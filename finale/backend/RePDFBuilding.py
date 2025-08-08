import fitz
import os

def highlight_refined_texts(output):
    print("Rebuilding PDF with annotations")
    for sec in output.get("extracted_sections", []):
        filename = sec['document']
        page_num = sec['page_number']
        section_title = sec['section_title']
        print(page_num)
        if not section_title:
            continue

        pdf_path = os.path.join("./uploads", filename)
        if not os.path.exists(pdf_path):
            continue

        doc = fitz.open(pdf_path)
        if page_num < 0 or page_num >= len(doc):
            doc.close()
            continue

        page = doc[page_num-1]

        # Get page text and perform case-insensitive search
        page_text = page.get_text("text")
        search_term = section_title.lower()
        page_text_lower = page_text.lower()
        print("search term", search_term)
        print("page text", page_text_lower)
        # Find the position in the lowercased text
        start_index = page_text_lower.find(search_term)
        
        if start_index == -1:
            doc.close()
            continue
        print("start index", start_index)
        # Get the actual text (with original case) for highlighting
        end_index = min(start_index + len(search_term) + 500, len(page_text))
        print("end index", end_index)
        actual_text = page_text[start_index:end_index]
        print("actual text", actual_text)
        
        # Search for the exact text (with original case) to highlight
        matches = page.search_for(actual_text)
        if not matches:
            doc.close()
            continue
            
        # Highlight all matches found
        for rect in matches:
            page.add_highlight_annot(rect)

        doc.save(pdf_path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
        doc.close()
