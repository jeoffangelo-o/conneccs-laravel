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
        """Extract text from image with layout information"""
        # Use Tesseract with TSV output to get word positions
        tsv_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config='--psm 6')
        
        # Group text by rows (approximate Y positions)
        rows = {}
        row_tolerance = 10  # pixels
        
        for i in range(len(tsv_data['text'])):
            if tsv_data['text'][i].strip():
                conf = int(tsv_data['conf'][i])
                if conf > 30:  # Confidence threshold
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
        """Parse OPCR structure from extracted text rows"""
        mfos = []
        targets = []
        current_function_type = None
        current_mfo = None
        
        for row in rows:
            line = row['text'].strip()
            
            if not line:
                continue
            
            # Detect function type
            if 'STRATEGIC FUNCTION' in line.upper():
                current_function_type = 'Strategic'
                continue
            elif 'CORE FUNCTION' in line.upper():
                current_function_type = 'Core'
                continue
            elif 'SUPPORT FUNCTION' in line.upper():
                current_function_type = 'Support'
                continue
            
            # Detect MFO (starts with number followed by dot and capital letter)
            if len(line) > 0 and line[0].isdigit() and '. ' in line[:5]:
                parts = line.split('. ', 1)
                if len(parts) == 2:
                    mfo_code = parts[0]
                    mfo_desc = parts[1]
                    
                    current_mfo = {
                        'code': mfo_code,
                        'description': mfo_desc,
                        'type': current_function_type or 'Core',
                        'targets': []
                    }
                    mfos.append(current_mfo)
                continue
            
            # Detect target (starts with letter followed by dot)
            if len(line) > 0 and line[0].isalpha() and '. ' in line[:5]:
                parts = line.split('. ', 1)
                if len(parts) == 2 and len(parts[0]) <= 3:
                    target_code = parts[0]
                    target_desc = parts[1]
                    
                    # Extract period (Jan-Dec, Jan-Jun, Jul-Dec)
                    period = None
                    if 'Jan-Dec' in target_desc:
                        period = 'Jan-Dec'
                    elif 'Jan-Jun' in target_desc:
                        period = 'Jan-Jun'
                    elif 'Jul-Dec' in target_desc:
                        period = 'Jul-Dec'
                    
                    target = {
                        'code': target_code,
                        'mfo_code': current_mfo['code'] if current_mfo else None,
                        'function_type': current_function_type or 'Core',
                        'description': target_desc,
                        'period': period,
                        'accountable': [],
                        'ratings': {'Q': False, 'E': False, 'T': False, 'A': False}
                    }
                    
                    targets.append(target)
                    if current_mfo:
                        current_mfo['targets'].append(target)
        
        return mfos, targets
    
    def extract(self):
        """Main extraction method"""
        try:
            # Convert PDF to images
            images = self.convert_pdf_to_images()
            
            all_mfos = []
            all_targets = []
            
            # Process each page
            for page_num, image in enumerate(images, start=1):
                print(f"Processing page {page_num}/{len(images)}...", file=sys.stderr)
                
                # Extract text with layout
                rows = self.extract_text_with_layout(image)
                
                # Parse OPCR structure
                mfos, targets = self.parse_opcr_structure(rows)
                
                all_mfos.extend(mfos)
                all_targets.extend(targets)
            
            # Group MFOs by type
            mfos_by_type = {
                'Strategic': [],
                'Core': [],
                'Support': []
            }
            
            for mfo in all_mfos:
                mfo_type = mfo.get('type', 'Core')
                mfos_by_type[mfo_type].append(mfo)
            
            return {
                'success': True,
                'mfos': all_mfos,
                'targets': all_targets,
                'mfos_by_type': mfos_by_type,
                'statistics': {
                    'total_mfos': len(all_mfos),
                    'strategic_count': len(mfos_by_type['Strategic']),
                    'core_count': len(mfos_by_type['Core']),
                    'support_count': len(mfos_by_type['Support']),
                    'total_targets': len(all_targets),
                    'pages_processed': len(images)
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
