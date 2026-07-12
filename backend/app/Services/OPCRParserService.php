<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Log;
use Exception;

class OPCRParserService
{
    protected Parser $parser;

    public function __construct()
    {
        $this->parser = new Parser();
    }

    /**
     * Extract text from PDF file
     *
     * @param string $filePath
     * @return string
     * @throws Exception
     */
    public function extractText(string $filePath): string
    {
        try {
            Log::info('Starting PDF text extraction', ['file' => $filePath]);

            if (!file_exists($filePath)) {
                throw new Exception("PDF file not found: {$filePath}");
            }

            $pdf = $this->parser->parseFile($filePath);
            $text = $pdf->getText();

            Log::info('PDF text extraction completed', [
                'file' => $filePath,
                'text_length' => strlen($text),
            ]);

            return $text;
        } catch (Exception $e) {
            Log::error('Failed to extract text from PDF', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Extract text page by page
     *
     * @param string $filePath
     * @return array
     * @throws Exception
     */
    public function extractTextByPage(string $filePath): array
    {
        try {
            Log::info('Starting PDF page-by-page text extraction', ['file' => $filePath]);

            if (!file_exists($filePath)) {
                throw new Exception("PDF file not found: {$filePath}");
            }

            $pdf = $this->parser->parseFile($filePath);
            $pages = $pdf->getPages();
            $extractedPages = [];

            foreach ($pages as $index => $page) {
                $pageNumber = $index + 1;
                $pageText = $page->getText();
                
                // Detect if page contains table structures
                $hasTable = $this->detectTableStructure($pageText);
                
                $extractedPages[] = [
                    'page' => $pageNumber,
                    'text' => $pageText,
                    'length' => strlen($pageText),
                    'has_table' => $hasTable,
                    'line_count' => substr_count($pageText, "\n"),
                ];

                Log::debug("Extracted page {$pageNumber}", [
                    'text_length' => strlen($pageText),
                    'has_table' => $hasTable,
                ]);
            }

            Log::info('PDF page-by-page extraction completed', [
                'file' => $filePath,
                'total_pages' => count($extractedPages),
            ]);

            return $extractedPages;
        } catch (Exception $e) {
            Log::error('Failed to extract pages from PDF', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Detect if text contains table structures
     *
     * @param string $text
     * @return bool
     */
    private function detectTableStructure(string $text): bool
    {
        // Look for patterns that indicate tables:
        // - Multiple consecutive spaces (column separators)
        // - Repeated line patterns
        // - Pipe characters or vertical bars
        // - Multiple numbers in a row
        
        $lines = explode("\n", $text);
        $tableIndicators = 0;
        
        foreach ($lines as $line) {
            // Check for multiple consecutive spaces (3 or more)
            if (preg_match('/\s{3,}/', $line)) {
                $tableIndicators++;
            }
            
            // Check for pipe characters or vertical bars
            if (preg_match('/[|│]/', $line)) {
                $tableIndicators++;
            }
            
            // Check for lines with multiple tab characters
            if (substr_count($line, "\t") >= 2) {
                $tableIndicators++;
            }
        }
        
        // If we found table indicators in more than 20% of lines, likely a table
        return $tableIndicators > (count($lines) * 0.2);
    }

    /**
     * Get PDF metadata
     *
     * @param string $filePath
     * @return array
     * @throws Exception
     */
    public function getMetadata(string $filePath): array
    {
        try {
            $pdf = $this->parser->parseFile($filePath);
            $details = $pdf->getDetails();
            $pages = $pdf->getPages();

            return [
                'title' => $details['Title'] ?? null,
                'author' => $details['Author'] ?? null,
                'subject' => $details['Subject'] ?? null,
                'creator' => $details['Creator'] ?? null,
                'producer' => $details['Producer'] ?? null,
                'creation_date' => $details['CreationDate'] ?? null,
                'modification_date' => $details['ModDate'] ?? null,
                'page_count' => count($pages),
            ];
        } catch (Exception $e) {
            Log::error('Failed to get PDF metadata', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Validate if file is a valid PDF
     *
     * @param string $filePath
     * @return bool
     */
    public function isValidPdf(string $filePath): bool
    {
        try {
            if (!file_exists($filePath)) {
                return false;
            }

            // Check file extension
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            if ($extension !== 'pdf') {
                return false;
            }

            // Try to parse the PDF
            $this->parser->parseFile($filePath);
            
            return true;
        } catch (Exception $e) {
            Log::warning('Invalid PDF file', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Store raw extracted text for debugging
     *
     * @param string $fileName
     * @param string $text
     * @return string Path to stored file
     */
    public function storeRawText(string $fileName, string $text): string
    {
        $directory = storage_path('app/opcr/raw-text');
        
        if (!file_exists($directory)) {
            mkdir($directory, 0755, true);
        }

        $textFileName = pathinfo($fileName, PATHINFO_FILENAME) . '_raw.txt';
        $filePath = $directory . '/' . $textFileName;
        
        file_put_contents($filePath, $text);
        
        Log::info('Raw text stored', ['file' => $filePath]);
        
        return $filePath;
    }
}
