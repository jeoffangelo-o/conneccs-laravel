#!/usr/bin/env python3
"""Test OCR setup"""

import sys

print("Testing OCR setup...")
print("-" * 50)

# Test 1: Python version
print(f"✓ Python version: {sys.version}")

# Test 2: Check packages
packages = {
    'pytesseract': 'Tesseract OCR wrapper',
    'pdf2image': 'PDF to image conversion',
    'cv2': 'OpenCV for image processing',
    'numpy': 'Numerical computing',
    'PIL': 'Python Imaging Library'
}

missing = []
for package, description in packages.items():
    try:
        __import__(package)
        print(f"✓ {package}: {description}")
    except ImportError:
        print(f"✗ {package}: NOT INSTALLED")
        missing.append(package)

# Test 3: Check Tesseract
print("\nChecking Tesseract OCR...")
try:
    import pytesseract
    import os
    
    tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    
    tesseract_found = False
    for path in tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            version = pytesseract.get_tesseract_version()
            print(f"✓ Tesseract found: {path}")
            print(f"  Version: {version}")
            tesseract_found = True
            break
    
    if not tesseract_found:
        print("✗ Tesseract NOT FOUND in standard locations")
        print("  Please install from: https://github.com/UB-Mannheim/tesseract/wiki")
        
except Exception as e:
    print(f"✗ Tesseract error: {e}")

# Test 4: Check Poppler
print("\nChecking Poppler (for PDF conversion)...")
try:
    from pdf2image import convert_from_path
    import os
    
    poppler_path = r'C:\poppler\Library\bin'
    if os.path.exists(poppler_path):
        print(f"✓ Poppler found: {poppler_path}")
    else:
        print("⚠ Poppler not found in default location")
        print("  PDF conversion may still work if poppler is in PATH")
        print("  Download from: https://github.com/oschwartz10612/poppler-windows/releases")
        
except Exception as e:
    print(f"✗ Poppler error: {e}")

# Summary
print("\n" + "=" * 50)
if missing:
    print("❌ Installation INCOMPLETE")
    print(f"\nMissing packages: {', '.join(missing)}")
    print(f"\nInstall with: pip install {' '.join(missing)}")
else:
    print("✅ OCR setup complete!")
    print("\nYou can now use OPCR table extraction.")
