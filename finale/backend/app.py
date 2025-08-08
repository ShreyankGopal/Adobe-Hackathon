
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import logging
import json
from pathlib import Path
import fitz  # PyMuPDF
import pandas as pd
import joblib
import re
from sklearn.preprocessing import MinMaxScaler
import time
from datetime import datetime
import numpy as np
from RePDFBuilding import highlight_refined_texts
# Sentence Transformers for embeddings + util.cos_sim for mmr
from sentence_transformers import SentenceTransformer, util

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

model = None
embedder = None

def load_model():
    global model, embedder
    model_path = "heading_classifier_with_font_count_norm_textNorm_5.pkl"
    if not Path(model_path).exists():
        logger.error(f"Model file {model_path} not found!")
    else:
        model = joblib.load(model_path)
        logger.info("Heading classifier model loaded successfully")

    # Load the multilingual MiniLM model from local cache
    try:
        cached_path = Path("./cached_model")
        if cached_path.exists():
            embedder = SentenceTransformer(str(cached_path))
            logger.info("SentenceTransformer loaded from ./cached_model")
        else:
            logger.info("Cached model not found. Downloading...")
            embedder = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
            embedder.save(str(cached_path))
            logger.info("Model downloaded and saved to ./cached_model")
    except Exception as e:
        logger.error(f"Failed to load SentenceTransformer: {e}")
        embedder = None


# ---------------- PDF extraction utilities (same as before) ----------------
def is_bullet_point(text):
    text = text.strip()
    bullet_patterns = [
        r'^[•·▪▫▬►‣⁃]\s*', r'^\*\s+', r'^-\s+', r'^—\s+', r'^–\s+',
        r'^\+\s+', r'^>\s+', r'^»\s+', r'^○\s+', r'^□\s+', r'^▪\s+', r'^▫\s+'
    ]
    for pattern in bullet_patterns:
        if re.match(pattern, text):
            return True
    if re.match(r'^\d+[\.\)]\s*$', text) or re.match(r'^[a-zA-Z][\.\)]\s*$', text):
        return True
    if len(text) <= 3 and re.match(r'^[^\w\s]+$', text):
        return True
    return False

def should_ignore_text(text):
    text = text.strip()
    if len(text) < 2:
        return True
    if is_bullet_point(text):
        return True
    if re.match(r'^\d+$', text) or re.match(r'^[a-zA-Z]$', text):
        return True
    artifacts = ['©', '®', '™', '...', '…']
    if text in artifacts:
        return True
    return False

def clean_text(text):
    text = text.strip()
    bullet_patterns = [
        r'^[•·▪▫▬►‣⁃]\s*', r'^\*\s+', r'^-\s+', r'^—\s+', r'^–\s+',
        r'^\+\s+', r'^>\s+', r'^»\s+', r'^○\s+', r'^□\s+', r'^▪\s+', r'^▫\s+'
    ]
    for pattern in bullet_patterns:
        text = re.sub(pattern, '', text)
    return text.strip()

def extract_features(text, pdf_path, page_num, font_size, is_bold, is_italic, position_y, y_gap):
    text_length = len(text)
    upper_count = sum(1 for c in text if c.isupper())
    total_alpha = sum(1 for c in text if c.isalpha())
    capitalization_ratio = upper_count / total_alpha if total_alpha > 0 else 0
    starts_with_numbering = bool(re.match(r'^\d+(\.\d+)*(\.|\))\s', text))
    dot_match = re.match(r'^(\d+\.)+(\d+)', text)
    num_dots_in_prefix = dot_match.group(1).count('.') if dot_match else 0

    return {
        'PDF Path': str(pdf_path),
        'Page Number': page_num,
        'Section Text': text,
        'Font Size': font_size,
        'Is Bold': is_bold,
        'Is Italic': is_italic,
        'Text Length': text_length,
        'Capitalization Ratio': capitalization_ratio,
        'Starts with Numbering': starts_with_numbering,
        'Position Y': position_y,
        'Prefix Dot Count': num_dots_in_prefix,
        'Y Gap': y_gap
    }

def analyze_pdf_sections(pdf_path):
    sections_data = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            blocks = page.get_text("dict")['blocks']

            prev_line_y = None
            prev_font_size = None
            prev_bold = None
            prev_italic = None
            current_lines = []
            prev_y_gap = None

            for block in blocks:
                if block['type'] != 0:
                    continue

                for line in block['lines']:
                    spans = [s for s in line['spans'] if s['text'].strip()]
                    if not spans:
                        continue

                    line_text = " ".join(span['text'].strip() for span in spans)
                    if should_ignore_text(line_text):
                        continue
                    cleaned_text = clean_text(line_text)
                    if not cleaned_text or should_ignore_text(cleaned_text):
                        continue

                    first_span = spans[0]
                    font_size = first_span['size']
                    font_flags = first_span['flags']
                    is_bold = (font_flags & 16) > 0
                    is_italic = (font_flags & 2) > 0
                    y_position = first_span['bbox'][1]

                    if prev_line_y is None:
                        y_gap = None
                    else:
                        y_gap = abs(y_position - prev_line_y)
                    prev_line_y = y_position

                    same_style = (
                        prev_font_size is not None and
                        abs(prev_font_size - font_size) < 0.5 and
                        is_bold == prev_bold and
                        is_italic == prev_italic
                    )

                    if same_style:
                        current_lines.append(cleaned_text)
                    else:
                        if current_lines:
                            full_text = " ".join(current_lines)
                            if not should_ignore_text(full_text) and len(full_text.strip()) > 2:
                                feat = extract_features(
                                    full_text, pdf_path, page_num + 1,
                                    prev_font_size, prev_bold, prev_italic, prev_line_y, prev_y_gap
                                )
                                sections_data.append(feat)

                        current_lines = [cleaned_text]
                        prev_font_size = font_size
                        prev_bold = is_bold
                        prev_italic = is_italic
                        prev_y_gap = y_gap

            if current_lines:
                full_text = " ".join(current_lines)
                if not should_ignore_text(full_text) and len(full_text.strip()) > 2:
                    feat = extract_features(
                        full_text, pdf_path, page_num + 1,
                        prev_font_size, prev_bold, prev_italic, prev_line_y, prev_y_gap
                    )
                    sections_data.append(feat)

        doc.close()
    except Exception as e:
        logger.error(f"Error processing {pdf_path}: {str(e)}")
    return pd.DataFrame(sections_data)

def preprocess_features(df):
    if df.empty:
        return df

    df['Is Bold'] = df['Is Bold'].astype(int)
    df['Is Italic'] = df['Is Italic'].astype(int)
    df['Starts with Numbering'] = df['Starts with Numbering'].astype(int)

    font_sizes = sorted(df['Font Size'].unique(), reverse=True)
    font_size_rank_map = {size: rank + 1 for rank, size in enumerate(font_sizes)}
    df['Font Size Rank'] = df['Font Size'].map(font_size_rank_map)

    df['Font Size Normalised'] = df['Font Size']
    columns_to_normalize = ['Font Size Normalised', 'Text Length', 'Capitalization Ratio', 'Position Y']
    if len(df) > 0:
        scaler = MinMaxScaler()
        df[columns_to_normalize] = scaler.fit_transform(df[columns_to_normalize])

    if not df['Font Size'].empty:
        body_font_size = df['Font Size'].mode()[0]
        df['Font Ratio'] = df['Font Size'] / body_font_size
    else:
        df['Font Ratio'] = 1.0

    df['Font Size Count'] = df['Font Size'].map(df['Font Size'].value_counts())
    df['Is Unique Font Size'] = (df['Font Size Count'] == 1).astype(int)

    df['Y Gap'] = df['Y Gap'].fillna(2)
    df['Y Gap'] = pd.to_numeric(df['Y Gap'], errors='coerce').fillna(2)

    def scale_column_per_pdf(group):
        if len(group) > 1 and group.std() > 0:
            scaler = MinMaxScaler()
            return scaler.fit_transform(group.values.reshape(-1, 1)).flatten()
        else:
            return [0] * len(group)

    df['Y Gap Scaled'] = df.groupby('PDF Path')['Y Gap'].transform(scale_column_per_pdf)
    df['Font Size Count'] = df.groupby('PDF Path')['Font Size Count'].transform(scale_column_per_pdf)
    return df

def build_json_from_predictions(df):
    outline = []
    title_rows = df[df['Label'] == 'Title']
    if not title_rows.empty:
        title_text = title_rows.iloc[0]['Section Text']
        title_page = int(title_rows.iloc[0]['Page Number'])
    else:
        non_none = df[df['Label'] != 'None']
        title_text = non_none.iloc[0]['Section Text'] if not non_none.empty else "Untitled Document"
        title_page = int(non_none.iloc[0]['Page Number']) if not non_none.empty else 1

    for _, row in df[(df['Label'] != 'None') & (df['Label'] != 'Title')].iterrows():
        outline.append({
            "level": row['Label'],
            "text": row['Section Text'],
            "page": int(row['Page Number'])
        })

    return {
        "title": title_text,
        "outline": outline
    }

# -------------------------
# MMR logic (from Extract_Section)
# -------------------------
def mmr(query_emb, sections, lambda_param=0.72, top_k=5):
    if not sections:
        return [], []

    selected, remaining = [], list(range(len(sections)))
    sim_q = [util.cos_sim(query_emb, s['embedding']).item() for s in sections]
    sim_doc = [[util.cos_sim(sections[i]['embedding'], sections[j]['embedding']).item() for j in range(len(sections))] for i in range(len(sections))]

    while len(selected) < top_k and remaining:
        if not selected:
            idx = int(np.argmax([sim_q[i] for i in remaining]))
            idx = remaining[idx]
            selected.append(idx)
            remaining.remove(idx)
        else:
            mmr_scores = []
            for idx in remaining:
                max_sim = max(sim_doc[idx][j] for j in selected) if selected else 0
                score = lambda_param * sim_q[idx] - (1 - lambda_param) * max_sim
                mmr_scores.append(score)
            chosen_rel_index = int(np.argmax(mmr_scores))
            idx = remaining[chosen_rel_index]
            selected.append(idx)
            remaining.remove(idx)
    return selected, sim_q

@app.route('/role_query', methods=['POST'])
def role_query():
    try:
        data = request.get_json(force=True)
        if data is None:
            return jsonify({"error": "Invalid JSON"}), 400

        # Extract persona and job
        persona = None
        if isinstance(data.get('persona'), dict):
            persona = data['persona'].get('role')
        else:
            persona = data.get('persona')

        job = None
        if isinstance(data.get('job_to_be_done'), dict):
            job = data['job_to_be_done'].get('task')
        else:
            job = data.get('job_to_be_done')

        if not persona or not job:
            return jsonify({"error": "Missing persona or job_to_be_done"}), 400

        documents = data.get('documents', [])
        if not isinstance(documents, list):
            return jsonify({"error": "documents must be a list"}), 400

        if embedder is None:
            return jsonify({"error": "Embedder not loaded on server"}), 500

        query_text = f"{job} {persona}"
        query_embedding = embedder.encode(query_text, normalize_embeddings=True)

        # Build sections from supplied document.sections OR outline
        section_data = []
        for doc in documents:
            filename = doc.get('filename') or doc.get('serverFilename') or doc.get('name')
            print("file name i am printing ", filename)
            sections_list = doc.get('sections')  # prefer 'sections' created at upload time
            #print("sections list i am printing ", sections_list)
            if not sections_list:
                # fallback to outline list: doc['outline']['outline'] (headings only)
                outline_obj = doc.get('outline') or {}
                sections_list = outline_obj.get('outline') if isinstance(outline_obj, dict) else None

            if not sections_list:
                # no headings/sections for this doc — skip
                continue

            for item in sections_list:
                # item might be either {heading,text,page} (sections) OR {level,text,page} (outline)
                if 'text' in item and 'heading' in item:
                    heading = item['heading']
                    full_text = item['text']
                    page = item.get('page')
                elif 'text' in item and 'level' in item:
                    heading = item['text']
                    full_text = item['text']
                    page = item.get('page')
                else:
                    # attempt best-effort
                    heading = item.get('heading') or item.get('text') or str(item)
                    full_text = item.get('text') or heading
                    page = item.get('page')

                emb = embedder.encode(full_text, normalize_embeddings=True)
                section_data.append({
                    'Document': filename,
                    'Page': page if page is not None else -1,
                    'heading': heading,
                    'text': full_text,
                    'embedding': emb
                })

        if not section_data:
            return jsonify({"error": "No headings/sections found in supplied documents"}), 400

        top_k = min(5, len(section_data))
        selected_indices, sim_scores = mmr(query_embedding, section_data, top_k=top_k)

        now = datetime.now().isoformat()
        output = {
            "metadata": {
                "input_documents": [d.get('filename') for d in documents],
                "persona": persona,
                "job_to_be_done": job,
                "processing_timestamp": now
            },
            "extracted_sections": [],
            "subsection_analysis": []
        }

        for rank, idx in enumerate(selected_indices, start=1):
            sec = section_data[idx]
            output['extracted_sections'].append({
                "document": sec['Document'],
                "section_title": sec['heading'],
                "importance_rank": rank,
                "page_number": sec['Page']
            })
            output['subsection_analysis'].append({
                "document": sec['Document'],
                "refined_text": sec['text'],
                "page_number": sec['Page']
            })
        highlight_refined_texts(output)
        return jsonify(output)

    except Exception as e:
        logger.exception("Error in role_query")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

# -------------------------
# existing endpoints preserved and updated
# -------------------------
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "PDF Analysis API is running",
        "version": "1.0.0"
    })

@app.route('/upload', methods=['POST'])
def upload_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
            return jsonify({"error": "Invalid file type. Only PDF files are allowed"}), 400

        if request.content_length and request.content_length > MAX_FILE_SIZE:
            return jsonify({"error": "File too large. Maximum size is 50MB"}), 400

        filename = secure_filename(file.filename)
        timestamp = str(int(time.time()))
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        logger.info(f"Uploaded file: {filename}")

        if model is None:
            os.remove(filepath)
            return jsonify({"error": "Model not loaded"}), 500

        df = analyze_pdf_sections(filepath)
        if df.empty:
            os.remove(filepath)
            return jsonify({"error": "No extractable text"}), 400

        df = preprocess_features(df)
        if df.empty:
            os.remove(filepath)
            return jsonify({"error": "Preprocessing failed"}), 400

        features = [
            'Font Ratio', 'Font Size Rank', 'Text Length', 'Capitalization Ratio',
            'Position Y', 'Is Bold', 'Is Italic',
            'Starts with Numbering', 'Font Size Count', 'Is Unique Font Size'
        ]
        df['Label'] = model.predict(df[features])

        # Build outline (existing behaviour)
        structured_json = build_json_from_predictions(df)

        # NEW: Build sections mapping using Title/H1/H2 as section starts (same logic as Extract_Section.py)
        sections = []
        final_df = df.reset_index(drop=True)
        section_labels = ['Title', 'H1', 'H2']
        for i, row in final_df.iterrows():
            if row['Label'] in section_labels:
                heading = row['Section Text']
                body = []
                for j in range(i + 1, len(final_df)):
                    next_row = final_df.iloc[j]
                    if next_row['Label'] in section_labels:
                        break
                    body.append(next_row['Section Text'])
                # join body. If no body lines, still include heading-only text.
                full_text = heading + ("|" + "|".join(body) if body else "")
                sections.append({
                    "heading": heading,
                    "text": full_text,
                    "page": int(row['Page Number'])
                })

        # send both outline and sections in response
        response_payload = {
            "success": True,
            "filename": filename,
            "outline": structured_json,
            "sections": sections,
            "message": f"Successfully processed PDF and found {len(structured_json['outline'])} headings and {len(sections)} sections"
        }

        return jsonify(response_payload)

    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@app.route('/uploads/<filename>', methods=['GET'])
def serve_pdf(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/files', methods=['GET'])
def list_files():
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            if filename.endswith('.pdf'):
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file_size = os.path.getsize(filepath)
                files.append({
                    "filename": filename,
                    "size": file_size,
                    "uploaded_at": os.path.getctime(filepath)
                })
        return jsonify({
            "success": True,
            "files": files,
            "count": len(files)
        })
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    load_model()
    app.run(debug=True, host='0.0.0.0', port=5001)



