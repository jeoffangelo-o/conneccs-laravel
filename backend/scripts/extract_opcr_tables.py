#!/usr/bin/env python3
"""
OPCR Table Extraction Script
Converts PDF to images, performs OCR with table detection
"""

import sys
import json
import os
from pathlib import Path

try:
    import pytesseract
    from pdf2image import convert_from_path
    import cv2
    import numpy as np
    from PIL import Image
except ImportError as e:
    print(json.dumps({
        'success': False,
        'error': f'Missing required package: {str(e)}',
        'message': 'Please run: pip install pytesseract pdf2image opencv-python numpy Pillow'
    }))
    sys.exit(1)


class OPCRTableExtractor:
    def __init__(self, pdf_path, poppler_path=None):
        self.pdf_path = pdf_path
        self.poppler_path = poppler_path or r'C:\poppler\Library\bin'
        
        # Try to find Tesseract
        tesseract_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            '/usr/bin/tesseract',
            '/usr/local/bin/tesseract',
        ]
        
        for path in tesseract_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                break
    
    def convert_pdf_to_images(self):
        """Convert PDF pages to images"""
        try:
            # Try with poppler path
            images = convert_from_path(
                self.pdf_path,
                dpi=300,
                poppler_path=self.poppler_path if os.path.exists(self.poppler_path) else None
            )
            return images
        except Exception as e:
            # Try without poppler path (if it's in PATH)
            try:
                images = convert_from_path(self.pdf_path, dpi=300)
                return images
            except Exception as e2:
                raise Exception(f"Failed to convert PDF to images: {str(e2)}")
    
    def detect_table_regions(self, image):
        """Detect table regions in image using OpenCV"""
        # Convert PIL Image to OpenCV format
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Threshold
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        
        # Detect horizontal and vertical lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        
        horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
        vertical_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
        
        # Combine lines to find table structure
        table_structure = cv2.addWeighted(horizontal_lines, 0.5, vertical_lines, 0.5, 0.0)
        
        # Find contours (table cells)
        contours, _ = cv2.findContours(table_structure, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by area
        table_regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = w * h
            if area > 5000:  # Minimum area threshold
                table_regions.append({'x': x, 'y': y, 'width': w, 'height': h})
        
        return table_regions
    
    def extract_text_with_layout(self, image):
        """Extract text from image with layout information using improved OCR settings"""
        # Use Tesseract with better configuration for tables
        # --psm 6 = Assume a single uniform block of text (good for tables)
        # --oem 3 = Use both legacy and LSTM OCR engines
        custom_config = r'--oem 3 --psm 6'
        
        # Use Tesseract with TSV output to get word positions
        tsv_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config=custom_config)
        
        # Group text by rows (approximate Y positions)
        rows = {}
        row_tolerance = 15  # Increased tolerance for better row grouping
        
        for i in range(len(tsv_data['text'])):
            if tsv_data['text'][i].strip():
                conf = int(tsv_data['conf'][i])
                if conf > 20:  # Lower confidence threshold to capture more text
                    x = tsv_data['left'][i]
                    y = tsv_data['top'][i]
                    w = tsv_data['width'][i]
                    h = tsv_data['height'][i]
                    text = tsv_data['text'][i]
                    
                    # Find or create row
                    row_key = None
                    for existing_y in rows.keys():
                        if abs(existing_y - y) < row_tolerance:
                            row_key = existing_y
                            break
                    
                    if row_key is None:
                        row_key = y
                        rows[row_key] = []
                    
                    rows[row_key].append({
                        'text': text,
                        'x': x,
                        'y': y,
                        'width': w,
                        'height': h,
                        'conf': conf
                    })
        
        # Sort rows by Y position, then words in each row by X position
        sorted_rows = []
        for y in sorted(rows.keys()):
            sorted_words = sorted(rows[y], key=lambda w: w['x'])
            row_text = ' '.join([w['text'] for w in sorted_words])
            sorted_rows.append({
                'y': y,
                'text': row_text,
                'words': sorted_words
            })
        
        return sorted_rows
    
    def parse_opcr_structure(self, rows):
        """
        Parse OPCR structure from extracted text rows
        SIMPLIFIED: Focus on major sections only (numbers 1-9)
        Sub-items can be added manually via correction interface
        """
        mfos = []
        targets = []
        current_function_type = None
        current_mfo = None
        current_mfo_code = None
        
        # Track seen MFO codes to avoid duplicates
        seen_mfos = set()
        
        for i, row in enumerate(rows):
            line = row['text'].strip()
            
            if not line:
                continue
            
            # Detect function type headers
            line_upper = line.upper()
            if 'STRATEGIC' in line_upper and 'FUNCTION' in line_upper:
                current_function_type = 'Strategic'
                continue
            elif 'CORE' in line_upper and 'FUNCTION' in line_upper:
                current_function_type = 'Core'
                continue
            elif 'SUPPORT' in line_upper and 'FUNCTION' in line_upper:
                current_function_type = 'Support'
                continue
            
            # Skip table headers and other non-data rows
            if any(keyword in line_upper for keyword in ['SUCCESS INDICATOR', 'MFO/PAP', 'ALLOTTED BUDGET', 'ACCOUNTABLE', 'RATING', 'REMARKS', 'REVIEWED BY', 'APPROVED BY']):
                continue
            
            # Import regex
            import re
            
            # Detect MAJOR MFO: Single digit at start "1. " or "2. " etc
            # This is what OCR can reliably detect
            mfo_match = re.match(r'^(\d)\.\s+(.+)$', line)
            if mfo_match:
                mfo_code = mfo_match.group(1)
                mfo_desc = mfo_match.group(2).strip()
                
                # Must have substantial description
                if mfo_code not in seen_mfos and len(mfo_desc) > 15:
                    seen_mfos.add(mfo_code)
                    current_mfo_code = mfo_code
                    
                    current_mfo = {
                        'code': mfo_code,
                        'description': mfo_desc,
                        'type': current_function_type or 'Core',
                        'targets': [],
                        'ocr_confidence': 'high',  # Major items are reliable
                        'needs_review': False
                    }
                    mfos.append(current_mfo)
                continue
            
            # Detect SUB-ITEMS with decimal notation: "1.1 ", "1.4.3 ", etc.
            # Mark these as needing review since they're harder to parse accurately
            sub_item_match = re.match(r'^(\d+(?:\.\d+)+)\s+(.+)$', line)
            if sub_item_match:
                sub_code = sub_item_match.group(1)
                sub_desc = sub_item_match.group(2).strip()
                
                if len(sub_desc) > 15:
                    # Determine parent MFO (first digit)
                    parent_code = sub_code.split('.')[0]
                    
                    target = {
                        'code': sub_code,
                        'mfo_code': parent_code,
                        'function_type': current_function_type or 'Core',
                        'description': sub_desc,
                        'period': None,
                        'accountable': [],
                        'ratings': {'Q': False, 'E': False, 'T': False, 'A': False},
                        'ocr_confidence': 'medium',  # Sub-items less reliable
                        'needs_review': True  # Flag for manual review
                    }
                    
                    # Try to extract period
                    full_text = ' '.join([w['text'] for w in row.get('words', [])])
                    if 'Jan-Dec' in full_text or 'jan-dec' in full_text.lower():
                        target['period'] = 'Jan-Dec'
                    elif 'Jan-Jun' in full_text or 'jan-jun' in full_text.lower():
                        target['period'] = 'Jan-Jun'
                    elif 'Jul-Dec' in full_text or 'jul-dec' in full_text.lower():
                        target['period'] = 'Jul-Dec'
                    
                    targets.append(target)
                    
                    # Try to add to parent MFO if it exists
                    parent_mfo = next((m for m in mfos if m['code'] == parent_code), None)
                    if parent_mfo:
                        parent_mfo['targets'].append(target)
                continue
            
            # Detect simple letter targets: "a. ", "b. ", etc
            # These are typically under a numbered item
            letter_match = re.match(r'^([a-z])\.\s+(.{20,})$', line, re.IGNORECASE)
            if letter_match and current_mfo_code:
                target_code = letter_match.group(1).lower()
                target_desc = letter_match.group(2).strip()
                
                full_text = ' '.join([w['text'] for w in row.get('words', [])])
                period = None
                if 'Jan-Dec' in full_text or 'jan-dec' in full_text.lower():
                    period = 'Jan-Dec'
                elif 'Jan-Jun' in full_text or 'jan-jun' in full_text.lower():
                    period = 'Jan-Jun'
                elif 'Jul-Dec' in full_text or 'jul-dec' in full_text.lower():
                    period = 'Jul-Dec'
                
                target = {
                    'code': target_code,
                    'mfo_code': current_mfo_code,
                    'function_type': current_function_type or 'Core',
                    'description': target_desc,
                    'period': period,
                    'accountable': [],
                    'ratings': {'Q': False, 'E': False, 'T': False, 'A': False},
                    'ocr_confidence': 'high',
                    'needs_review': False
                }
                
                targets.append(target)
                if current_mfo:
                    current_mfo['targets'].append(target)
        
        return mfos, targets
    
    def extract(self):
        """Main extraction method with improved accuracy"""
        try:
            # Convert PDF to images
            images = self.convert_pdf_to_images()
            
            all_mfos = []
            all_targets = []
            
            # Process each page (NO print statements - causes JSON parsing errors)
            for page_num, image in enumerate(images, start=1):
                # Extract text with layout
                rows = self.extract_text_with_layout(image)
                
                # Parse OPCR structure
                mfos, targets = self.parse_opcr_structure(rows)
                
                all_mfos.extend(mfos)
                all_targets.extend(targets)
            
            # Post-process: Remove duplicate MFOs (keep first occurrence)
            unique_mfos = []
            seen_codes = set()
            for mfo in all_mfos:
                if mfo['code'] not in seen_codes:
                    seen_codes.add(mfo['code'])
                    unique_mfos.append(mfo)
            
            # Post-process: Clean up descriptions (remove extra spaces, truncation marks)
            for mfo in unique_mfos:
                mfo['description'] = ' '.join(mfo['description'].split())  # Normalize whitespace
                # Remove common OCR artifacts
                mfo['description'] = mfo['description'].replace('|', '').replace('_', ' ')
                
                for target in mfo['targets']:
                    target['description'] = ' '.join(target['description'].split())
                    target['description'] = target['description'].replace('|', '').replace('_', ' ')
            
            for target in all_targets:
                target['description'] = ' '.join(target['description'].split())
                target['description'] = target['description'].replace('|', '').replace('_', ' ')
            
            # Group MFOs by type
            mfos_by_type = {
                'Strategic': [],
                'Core': [],
                'Support': []
            }
            
            for mfo in unique_mfos:
                mfo_type = mfo.get('type', 'Core')
                mfos_by_type[mfo_type].append(mfo)
            
            return {
                'success': True,
                'mfos': unique_mfos,
                'targets': all_targets,
                'mfos_by_type': mfos_by_type,
                'statistics': {
                    'total_mfos': len(unique_mfos),
                    'strategic_count': len(mfos_by_type['Strategic']),
                    'core_count': len(mfos_by_type['Core']),
                    'support_count': len(mfos_by_type['Support']),
                    'total_targets': len(all_targets),
                    'pages_processed': len(images),
                    'high_confidence_count': len([t for t in all_targets if t.get('ocr_confidence') == 'high']),
                    'needs_review_count': len([t for t in all_targets if t.get('needs_review')]),
                },
                'ocr_info': {
                    'method': 'Tesseract OCR with table detection',
                    'note': 'Major items (1., 2., 3.) have high confidence. Sub-items (1.1, 1.4.3) may need manual review.',
                    'recommendation': 'Please review items marked "needs_review" for accuracy.'
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to extract OPCR tables'
            }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No PDF path provided',
            'usage': 'python extract_opcr_tables.py <pdf_path>'
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({
            'success': False,
            'error': f'PDF file not found: {pdf_path}'
        }))
        sys.exit(1)
    
    extractor = OPCRTableExtractor(pdf_path)
    result = extractor.extract()
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
