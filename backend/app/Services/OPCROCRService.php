<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Exception;

/**
 * OPCR OCR Service
 * Interfaces with Python OCR script for table extraction
 */
class OPCROCRService
{
    private $pythonPath;
    private $scriptPath;
    
    public function __construct()
    {
        // Try to find Python executable
        $this->pythonPath = $this->findPython();
        $this->scriptPath = base_path('scripts/extract_opcr_tables.py');
    }
    
    /**
     * Find Python executable
     */
    private function findPython(): string
    {
        $possiblePaths = [
            'python',  // If in PATH
            'python3',
            'C:\\Python311\\python.exe',
            'C:\\Python310\\python.exe',
            'C:\\Python39\\python.exe',
            base_path('venv\\Scripts\\python.exe'),  // Virtual environment
        ];
        
        foreach ($possiblePaths as $path) {
            $result = shell_exec("\"$path\" --version 2>&1");
            if ($result && stripos($result, 'python') !== false) {
                Log::info("Found Python at: $path");
                return $path;
            }
        }
        
        // Default to 'python' and hope it's in PATH
        return 'python';
    }
    
    /**
     * Check if OCR tools are installed
     */
    public function isAvailable(): bool
    {
        if (!file_exists($this->scriptPath)) {
            Log::warning('OCR script not found', ['path' => $this->scriptPath]);
            return false;
        }
        
        // Try to run test script
        $testScript = base_path('scripts/test_ocr.py');
        if (file_exists($testScript)) {
            $command = "\"{$this->pythonPath}\" \"$testScript\" 2>&1";
            $output = shell_exec($command);
            
            Log::debug('OCR test output', ['output' => $output]);
            
            return $output && stripos($output, 'setup complete') !== false;
        }
        
        return false;
    }
    
    /**
     * Extract OPCR data from PDF using OCR
     *
     * @param string $pdfPath Full path to PDF file
     * @return array Extracted OPCR data
     * @throws Exception If extraction fails
     */
    public function extractTables(string $pdfPath): array
    {
        if (!file_exists($pdfPath)) {
            throw new Exception("PDF file not found: $pdfPath");
        }
        
        if (!file_exists($this->scriptPath)) {
            throw new Exception("OCR script not found. Please run: composer install");
        }
        
        Log::info('Starting OCR extraction', [
            'pdf_path' => $pdfPath,
            'python_path' => $this->pythonPath,
            'script_path' => $this->scriptPath,
        ]);
        
        // Build command
        $command = sprintf(
            '"%s" "%s" "%s" 2>&1',
            $this->pythonPath,
            $this->scriptPath,
            $pdfPath
        );
        
        Log::debug('Executing OCR command', ['command' => $command]);
        
        // Execute Python script
        $output = shell_exec($command);
        
        if ($output === null) {
            throw new Exception('Failed to execute OCR script. Check Python installation.');
        }
        
        Log::debug('OCR script output', ['output' => substr($output, 0, 500)]);
        
        // Parse JSON output
        $result = json_decode($output, true);
        
        if ($result === null) {
            Log::error('Failed to parse OCR output', [
                'output' => $output,
                'json_error' => json_last_error_msg(),
            ]);
            throw new Exception('Failed to parse OCR output: ' . json_last_error_msg());
        }
        
        if (!isset($result['success']) || !$result['success']) {
            $error = $result['error'] ?? 'Unknown error';
            $message = $result['message'] ?? 'OCR extraction failed';
            throw new Exception("$message: $error");
        }
        
        Log::info('OCR extraction completed', [
            'mfos_found' => $result['statistics']['total_mfos'] ?? 0,
            'targets_found' => $result['statistics']['total_targets'] ?? 0,
        ]);
        
        return $result;
    }
    
    /**
     * Get installation instructions
     */
    public function getInstallInstructions(): string
    {
        $installFile = base_path('INSTALL_OCR.md');
        if (file_exists($installFile)) {
            return file_get_contents($installFile);
        }
        
        return <<<EOT
# OCR Setup Required

To use automatic table extraction, please install:

1. Python 3.11+
   Download: https://www.python.org/downloads/

2. Tesseract OCR
   Download: https://github.com/UB-Mannheim/tesseract/wiki

3. Poppler (PDF to Image)
   Download: https://github.com/oschwartz10612/poppler-windows/releases

4. Python packages:
   ```
   pip install pytesseract pdf2image opencv-python numpy Pillow
   ```

See INSTALL_OCR.md for detailed instructions.
EOT;
    }
}
