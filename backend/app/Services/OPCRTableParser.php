<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

/**
 * Advanced OPCR Table Parser
 * Uses positional analysis to reconstruct table structure from PDF
 */
class OPCRTableParser
{
    private $pdfParser;
    
    public function __construct()
    {
        $this->pdfParser = new Parser();
    }
    
    /**
     * Parse OPCR PDF with table structure awareness
     *
     * @param string $pdfPath
     * @return array
     */
    public function parse(string $pdfPath): array
    {
        // Parse PDF
        $pdf = $this->pdfParser->parseFile($pdfPath);
        $pages = $pdf->getPages();
        
        $allMFOs = [];
        $allTargets = [];
        $currentFunctionType = null;
        $currentMFO = null;
        
        foreach ($pages as $pageNum => $page) {
            $text = $page->getText();
            $lines = explode("\n", $text);
            
            // Analyze each line
            foreach ($lines as $lineNum => $lineText) {
                $line = trim($lineText);
                
                if (empty($line)) continue;
                
                // Detect function type headers
                if (preg_match('/(STRATEGIC|CORE|SUPPORT)\s+FUNCTION/i', $line, $matches)) {
                    $currentFunctionType = ucfirst(strtolower($matches[1]));
                    Log::info("Found function type: {$currentFunctionType}");
                    continue;
                }
                
                // Detect MFO (Main row in table)
                // Pattern: starts with number, followed by text, often ends with names
                if (preg_match('/^(\d+)\.\s+([A-Z].*?)(?:\s+[A-Z][a-z]+,|\s+[A-Z][A-Z\s]+,|$)/i', $line, $matches)) {
                    $mfoCode = $matches[1];
                    $mfoDescription = trim($matches[2]);
                    
                    // Look ahead for continuation
                    if (isset($lines[$lineNum + 1])) {
                        $nextLine = trim($lines[$lineNum + 1]);
                        // If next line starts with lowercase or is short, it's a continuation
                        if (preg_match('/^[a-z]/', $nextLine) && !preg_match('/^[a-z]\d?\./i', $nextLine)) {
                            $mfoDescription .= ' ' . $nextLine;
                        }
                    }
                    
                    $currentMFO = [
                        'code' => $mfoCode,
                        'description' => $this->cleanText($mfoDescription),
                        'type' => $currentFunctionType ?? 'Core',
                        'targets' => [],
                    ];
                    
                    $allMFOs[] = $currentMFO;
                    
                    Log::info("Found MFO #{$mfoCode}: " . substr($mfoDescription, 0, 50));
                    continue;
                }
                
                // Detect targets/success indicators
                // Pattern: a., a1., a2., b., b1., etc.
                if (preg_match('/^\s*([a-z]\d*)\.\s+(.+)$/i', $line, $matches)) {
                    $targetCode = $matches[1];
                    $targetDescription = trim($matches[2]);
                    
                    // Extract metadata from the line
                    $accountable = $this->extractNames($targetDescription);
                    $period = $this->extractPeriod($targetDescription);
                    $ratings = $this->extractRatings($lineText); // Use original line for position analysis
                    
                    // Clean description
                    $targetDescription = $this->cleanTargetDescription($targetDescription);
                    
                    // Look ahead for continuation
                    $lookAhead = 1;
                    while (isset($lines[$lineNum + $lookAhead])) {
                        $nextLine = trim($lines[$lineNum + $lookAhead]);
                        
                        // Stop if we hit another target, MFO, or metadata
                        if (preg_match('/^[a-z]\d?\./i', $nextLine) || 
                            preg_match('/^\d+\./i', $nextLine) ||
                            preg_match('/^x\s+x/i', $nextLine) ||
                            preg_match('/Jan-Dec|Jan-Jun|Jul-Dec/i', $nextLine)) {
                            break;
                        }
                        
                        // Otherwise it's continuation
                        if (strlen($nextLine) > 0 && !preg_match('/^[A-Z][a-z]+,/i', $nextLine)) {
                            $targetDescription .= ' ' . $nextLine;
                            $lookAhead++;
                        } else {
                            break;
                        }
                    }
                    
                    $target = [
                        'code' => $targetCode,
                        'mfo_code' => $currentMFO['code'] ?? null,
                        'function_type' => $currentFunctionType ?? 'Core',
                        'description' => $this->cleanTargetDescription($targetDescription),
                        'accountable' => $accountable,
                        'period' => $period,
                        'ratings' => $ratings,
                        'page' => $pageNum + 1,
                    ];
                    
                    $allTargets[] = $target;
                    
                    if ($currentMFO) {
                        $allMFOs[count($allMFOs) - 1]['targets'][] = $target;
                    }
                    
                    Log::debug("Found target {$targetCode}: " . substr($targetDescription, 0, 40));
                }
            }
        }
        
        return [
            'mfos' => $allMFOs,
            'targets' => $allTargets,
            'period' => $this->extractOverallPeriod($pdf->getText()),
            'college' => $this->extractCollege($pdf->getText()),
        ];
    }
    
    /**
     * Extract names from text
     */
    private function extractNames(string $text): array
    {
        $names = [];
        
        // Pattern: Comma-separated capitalized words
        if (preg_match_all('/\b([A-Z][a-z]{2,})\b/', $text, $matches)) {
            $excludeWords = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December',
                            'Budget', 'Office', 'College', 'University', 'Quality', 'Submitted'];
            
            foreach ($matches[1] as $name) {
                if (!in_array($name, $excludeWords) && strlen($name) >= 3) {
                    $names[] = $name;
                }
            }
        }
        
        return array_unique($names);
    }
    
    /**
     * Extract period from text
     */
    private function extractPeriod(string $text): ?string
    {
        if (preg_match('/(Jan-Dec|Jan-Jun|Jul-Dec)/i', $text, $matches)) {
            return $matches[1];
        }
        return null;
    }
    
    /**
     * Extract ratings based on 'x' marks
     */
    private function extractRatings(string $line): array
    {
        $ratings = ['Q' => false, 'E' => false, 'T' => false, 'A' => false];
        
        // Count x occurrences
        $xCount = substr_count(strtolower($line), 'x');
        
        if ($xCount >= 4) {
            $ratings = ['Q' => true, 'E' => true, 'T' => true, 'A' => true];
        } elseif ($xCount > 0) {
            // Mark first N ratings
            $keys = array_keys($ratings);
            for ($i = 0; $i < min($xCount, 4); $i++) {
                $ratings[$keys[$i]] = true;
            }
        }
        
        return $ratings;
    }
    
    /**
     * Extract overall period from document
     */
    private function extractOverallPeriod(string $text): string
    {
        if (preg_match('/January\s+to\s+December/i', $text)) {
            return 'Jan-Dec';
        } elseif (preg_match('/January\s+to\s+June/i', $text)) {
            return 'Jan-Jun';
        } elseif (preg_match('/July\s+to\s+December/i', $text)) {
            return 'Jul-Dec';
        }
        return 'Jan-Dec';
    }
    
    /**
     * Extract college name
     */
    private function extractCollege(string $text): string
    {
        if (preg_match('/College of ([^\n,]+)/i', $text, $matches)) {
            return trim($matches[0]);
        }
        return 'College of Computer Studies';
    }
    
    /**
     * Clean general text
     */
    private function cleanText(string $text): string
    {
        // Remove document codes
        $text = preg_replace('/CSPC-F-[^\s]+/', '', $text);
        $text = preg_replace('/ANNEX\s+[A-Z]/', '', $text);
        
        // Remove titles and degrees
        $text = preg_replace('/,?\s*(PhD|MIT|DBA|Jr\.|Sr\.)/', '', $text);
        
        // Remove "target(s)"
        $text = preg_replace('/\d+\s+target\(s\)/', '', $text);
        
        // Clean whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        return trim($text);
    }
    
    /**
     * Clean target description
     */
    private function cleanTargetDescription(string $text): string
    {
        // Remove periods
        $text = preg_replace('/(Jan-Dec|Jan-Jun|Jul-Dec)/i', '', $text);
        
        // Remove rating markers
        $text = preg_replace('/\s+[xXQETA]\s+/i', ' ', $text);
        
        // Remove trailing numbers
        $text = preg_replace('/\s+\d{1,4}\s*$/', '', $text);
        
        // Clean whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        return trim($text);
    }
}
