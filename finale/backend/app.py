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

def load_model():
    global model
    model_path = "heading_classifier_with_font_count_norm_textNorm_5.pkl"
    if not Path(model_path).exists():
        logger.error(f"Model file {model_path} not found!")
        return
    model = joblib.load(model_path)
    logger.info("Model loaded successfully")

# Functions for PDF processing
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
                if block['type'] != 0:  # Skip non-text blocks
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

        structured_json = build_json_from_predictions(df)
        print(structured_json)
        return jsonify({
            "success": True,
            "filename": filename,
            "outline": structured_json,
            "message": f"Successfully processed PDF and found {len(structured_json['outline'])} headings"
        })

    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

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
    app.run(debug=True, host='0.0.0.0', port=5000)