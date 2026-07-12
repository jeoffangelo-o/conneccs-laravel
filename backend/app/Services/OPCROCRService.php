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
        
        Log::info('OPCROCRService initialized', [
            'python_path' => $this->pythonPath,
            'script_path' => $this->scriptPath,
        ]);
    }
    
    /**
     * Find Python executable
     */
    private function findPython(): string
    {
        $possiblePaths = [
            base_path('venv\\Scripts\\python.exe'),  // Virtual environment (try this FIRST!)
            'python',  // If in PATH
            'python3',
            'C:\\Python314\\python.exe',
            'C:\\Python311\\python.exe',
            'C:\\Python310\\python.exe',
            'C:\\Python39\\python.exe',
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
        
        // Simple check: just verify Python and the script exist
        $result = shell_exec("\"{$this->pythonPath}\" --version 2>&1");
        $pythonAvailable = $result && stripos($result, 'python') !== false;
        
        if ($pythonAvailable) {
            Log::info('OCR is available', [
                'python' => $this->pythonPath,
                'script' => $this->scriptPath
            ]);
            return true;
        }
        
        Log::warning('Python not available for OCR');
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
        
        // Increase PHP execution time for large PDFs
        set_time_limit(300); // 5 minutes
        
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
        
        // Clean output: remove any stderr messages before JSON
        $output = trim($output);
        
        // Find the JSON start (should be { or [)
        $jsonStart = strpos($output, '{');
        if ($jsonStart !== false && $jsonStart > 0) {
            // There's content before the JSON, skip it
            $output = substr($output, $jsonStart);
        }
        
        Log::debug('OCR script raw output', [
            'length' => strlen($output),
            'first_100' => substr($output, 0, 100),
            'last_100' => substr($output, -100)
        ]);
        
        // Parse JSON output
        $result = json_decode($output, true);
        
        if ($result === null) {
            Log::error('Failed to parse OCR output', [
                'output_length' => strlen($output),
                'output_sample' => substr($output, 0, 1000),
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
