#!/usr/bin/env python3
"""
OPCR Table Extraction Script V2
Uses direct PDF text extraction with better table detection
"""

import sys
import json
import os
from pathlib import Path
import re

try:
    from pdfminer.high_level import extract_pages, extract_text
    from pdfminer.layout import LTTextContainer, LTChar, LTTextLine, LTTextBox
except ImportError:
    print(json.dumps({
        'success': False,
        'error': 'pdfminer.six is not installed',
        'message': 'Please run: pip install pdfminer.six'
    }))
    sys.exit(1)


class OPCRTableExtractorV2:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
    
    def extract_text_with_layout(self):
        """Extract text from PDF preserving layout using pdfminer"""
        all_lines = []
        
        for page_num, page_layout in enumerate(extract_pages(self.pdf_path), start=1):
            page_lines = []
            
            # Extract all text elements with their positions
            for element in page_layout:
                if isinstance(element, (LTTextBox, LTTextLine)):
                    text = element.get_text().strip()
                    if text:
                        # Get position
                        x0, y0, x1, y1 = element.bbox
                        page_lines.append({
                            'text': text,
                            'x': x0,
                            'y': y0,
                            'page': page_num
                        })
            
            # Sort by Y position (top to bottom)
            page_lines.sort(key=lambda l: -l['y'])  # Negative because PDF Y starts at bottom
            all_lines.extend(page_lines)
        
        return all_lines
    
    def parse_opcr_structure(self, lines):
        """Parse OPCR structure from extracted lines"""
        mfos = []
        targets = []
        current_function_type = None
        current_mfo = None
        current_mfo_code = None
        seen_mfos = set()
        
        # Patterns
        mfo_pattern = re.compile(r'^(\d)\.\s+(.+)$')  # Single digit MFO
        target_pattern = re.compile(r'^\s*([a-z]\d?)\.\s+(.{15,})$', re.IGNORECASE)  # Target with substantial description
        
        for line_data in lines:
            line = line_data['text'].strip()
            
            if not line or len(line) < 3:
                continue
            
            line_upper = line.upper()
            
            # Detect function type
            if 'STRATEGIC' in line_upper and 'FUNCTION' in line_upper:
                current_function_type = 'Strategic'
                continue
            elif 'CORE' in line_upper and 'FUNCTION' in line_upper:
                current_function_type = 'Core'
                continue
            elif 'SUPPORT' in line_upper and 'FUNCTION' in line_upper:
                current_function_type = 'Support'
                continue
            
            # Skip headers
            if any(kw in line_upper for kw in ['SUCCESS INDICATOR', 'MFO/PAP', 'RATING', 'ALLOTTED', 'BUDGET', 'ACCOUNTABLE']):
                continue
            
            # Try to match MFO
            mfo_match = mfo_pattern.match(line)
            if mfo_match:
                mfo_code = mfo_match.group(1)
                mfo_desc = mfo_match.group(2).strip()
                
                if mfo_code not in seen_mfos and len(mfo_desc) > 10:
                    seen_mfos.add(mfo_code)
                    current_mfo_code = mfo_code
                    
                    current_mfo = {
                        'code': mfo_code,
                        'description': mfo_desc,
                        'type': current_function_type or 'Core',
                        'targets': []
                    }
                    mfos.append(current_mfo)
                continue
            
            # Try to match target
            target_match = target_pattern.match(line)
            if target_match and current_mfo_code:
                target_code = target_match.group(1).lower()
                target_desc = target_match.group(2).strip()
                
                # Extract period
                period = None
                if 'Jan-Dec' in target_desc or 'jan-dec' in target_desc.lower():
                    period = 'Jan-Dec'
                elif 'Jan-Jun' in target_desc or 'jan-jun' in target_desc.lower():
                    period = 'Jan-Jun'
                elif 'Jul-Dec' in target_desc or 'jul-dec' in target_desc.lower():
                    period = 'Jul-Dec'
                
                target = {
                    'code': target_code,
                    'mfo_code': current_mfo_code,
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
            if not os.path.exists(self.pdf_path):
                return {
                    'success': False,
                    'error': f'PDF file not found: {self.pdf_path}'
                }
            
            # Extract text with layout
            lines = self.extract_text_with_layout()
            
            # Parse structure
            mfos, targets = self.parse_opcr_structure(lines)
            
            # Group by type
            mfos_by_type = {
                'Strategic': [m for m in mfos if m['type'] == 'Strategic'],
                'Core': [m for m in mfos if m['type'] == 'Core'],
                'Support': [m for m in mfos if m['type'] == 'Support']
            }
            
            return {
                'success': True,
                'mfos': mfos,
                'targets': targets,
                'mfos_by_type': mfos_by_type,
                'statistics': {
                    'total_mfos': len(mfos),
                    'strategic_count': len(mfos_by_type['Strategic']),
                    'core_count': len(mfos_by_type['Core']),
                    'support_count': len(mfos_by_type['Support']),
                    'total_targets': len(targets),
                    'lines_processed': len(lines)
                },
                'method': 'pdfminer_text_extraction'
            }
            
        except Exception as e:
            import traceback
            return {
                'success': False,
                'error': str(e),
                'trace': traceback.format_exc(),
                'message': 'Failed to extract OPCR tables'
            }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No PDF path provided',
            'usage': 'python extract_opcr_tables_v2.py <pdf_path>'
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    extractor = OPCRTableExtractorV2(pdf_path)
    result = extractor.extract()
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
