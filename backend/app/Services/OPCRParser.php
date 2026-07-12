<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OPCRParser
{
    private $currentFunctionType = null;
    private $currentMFO = null;
    private $currentMFONumber = null;
    
    /**
     * Parse OPCR text and extract structured data
     *
     * @param string $text Full OPCR text
     * @param array $pages Page-by-page text data
     * @return array Parsed OPCR data
     */
    public function parseOPCR(string $text, array $pages): array
    {
        Log::info('Starting OPCR parsing');

        $mfos = $this->extractMFOs($text);
        $targets = $this->extractTargets($text, $pages);
        $accountable = $this->extractAccountable($text);
        $ratings = $this->extractRatings($text);
        $period = $this->extractPeriod($text);

        $parsed = [
            'period' => $period,
            'college' => $this->extractCollege($text),
            'mfos' => $mfos,
            'targets' => $targets,
            'summary' => [
                'total_mfos' => count($mfos),
                'total_targets' => count($targets),
                'total_accountable' => count($accountable),
            ],
        ];

        Log::info('OPCR parsing completed', [
            'mfos_found' => count($mfos),
            'targets_found' => count($targets),
        ]);

        return $parsed;
    }

    /**
     * Extract college name from OPCR
     *
     * @param string $text
     * @return string|null
     */
    private function extractCollege(string $text): ?string
    {
        // Look for "College of" pattern
        if (preg_match('/College of ([^\n,]+)/i', $text, $matches)) {
            return trim($matches[0]);
        }
        
        return 'College of Computer Studies'; // Default
    }

    /**
     * Extract period from OPCR (Jan-Jun, Jul-Dec, Jan-Dec)
     *
     * @param string $text
     * @return string
     */
    public function extractPeriod(string $text): string
    {
        // Look for period patterns in header
        $patterns = [
            '/January\s*to\s*June/i' => 'Jan-Jun',
            '/July\s*to\s*December/i' => 'Jul-Dec',
            '/January\s*to\s*December/i' => 'Jan-Dec',
        ];

        foreach ($patterns as $pattern => $period) {
            if (preg_match($pattern, $text)) {
                Log::debug('Period extracted', ['period' => $period]);
                return $period;
            }
        }

        return 'Jan-Dec'; // Default to full year
    }

    /**
     * Extract Major Final Outputs (MFOs)
     * Pattern: "1. Early Procurement and Utilization" followed by "of Budget" on next line
     *
     * @param string $text
     * @return array
     */
    public function extractMFOs(string $text): array
    {
        $mfos = [];
        $lines = explode("\n", $text);
        
        $currentType = null;
        $inMFOSection = false;
        $collectingMFO = false;
        $currentMFOText = '';
        $currentMFONumber = null;
        
        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            
            // Skip empty lines
            if (empty($line)) {
                continue;
            }
            
            // Detect function type headers
            if (preg_match('/STRATEGIC\s+FUNCTION.*?(\d+)%/i', $line)) {
                $currentType = 'Strategic';
                $inMFOSection = true;
                Log::debug('Entering Strategic Functions section');
                continue;
            } elseif (preg_match('/CORE\s+FUNCTION.*?(\d+)%/i', $line)) {
                $currentType = 'Core';
                $inMFOSection = true;
                Log::debug('Entering Core Functions section');
                continue;
            } elseif (preg_match('/SUPPORT\s+FUNCTION.*?(\d+)%/i', $line)) {
                $currentType = 'Support';
                $inMFOSection = true;
                Log::debug('Entering Support Functions section');
                continue;
            }
            
            // Stop collecting MFOs when we hit certain markers
            if (preg_match('/Total Overall Rating|CHARMANE RECAH|Performance Management Team/i', $line)) {
                $inMFOSection = false;
                break;
            }
            
            if (!$inMFOSection) {
                continue;
            }
            
            // Look for MFO pattern: "1. " or "2. " etc at start of line
            if (preg_match('/^(\d+)\.\s+(.+)$/i', $line, $matches)) {
                // Save previous MFO if collecting
                if ($collectingMFO && !empty($currentMFOText)) {
                    $mfos[] = [
                        'code' => $currentMFONumber,
                        'description' => $this->cleanMFODescription($currentMFOText),
                        'type' => $currentType ?? 'Core',
                    ];
                    
                    Log::debug('MFO saved', [
                        'code' => $currentMFONumber,
                        'description' => substr($currentMFOText, 0, 60),
                    ]);
                }
                
                // Start collecting new MFO
                $currentMFONumber = $matches[1];
                $currentMFOText = $matches[2];
                $collectingMFO = true;
                
                continue;
            }
            
            // If we're collecting an MFO, check if we should continue or stop
            if ($collectingMFO) {
                // Stop if we hit these patterns
                if (preg_match('/^[a-z]\d?\./i', $line) || // Target line (a., b., etc)
                    preg_match('/^[A-Z][A-Z\s]+,\s*[A-Z]/i', $line) || // All caps names like "AMADO A. OLIVA"
                    preg_match('/^[A-Z][a-z]+,\s*[A-Z][a-z]+,/i', $line) || // Name lists "Onesa, Gastilo,"
                    preg_match('/CSPC-F-|ANNEX|Effectivity Date/i', $line) || // Document codes
                    preg_match('/SUCCESS INDICATORS|Allotted|Budget|Accountable|Rating|OPCR/i', $line) || // Table headers
                    preg_match('/^\d+\s+target/i', $line)) { // Target count lines
                    
                    // Save current MFO and stop collecting
                    if (!empty($currentMFOText)) {
                        $mfos[] = [
                            'code' => $currentMFONumber,
                            'description' => $this->cleanMFODescription($currentMFOText),
                            'type' => $currentType ?? 'Core',
                        ];
                        
                        Log::debug('MFO saved (stopped at marker)', [
                            'code' => $currentMFONumber,
                            'description' => substr($currentMFOText, 0, 60),
                            'stopped_at' => substr($line, 0, 40),
                        ]);
                    }
                    
                    $collectingMFO = false;
                    $currentMFOText = '';
                    continue;
                }
                
                // Otherwise, append to current MFO description
                // But only if it looks like a continuation (starts with lowercase or is short)
                if (preg_match('/^[a-z]/', $line) || strlen($line) < 60) {
                    $currentMFOText .= ' ' . $line;
                }
            }
        }
        
        // Save last MFO if still collecting
        if ($collectingMFO && !empty($currentMFOText)) {
            $mfos[] = [
                'code' => $currentMFONumber,
                'description' => $this->cleanMFODescription($currentMFOText),
                'type' => $currentType ?? 'Core',
            ];
        }
        
        return $mfos;
    }
    
    /**
     * Clean MFO description by removing unwanted text
     */
    private function cleanMFODescription(string $description): string
    {
        // Remove document codes
        $description = preg_replace('/CSPC-F-[^\s]+/', '', $description);
        $description = preg_replace('/ANNEX\s+[A-Z]/', '', $description);
        
        // Remove person names (PhD, MIT, DBA titles)
        $description = preg_replace('/[A-Z][A-Z\s\.]+,?\s*(PhD|MIT|DBA|Jr\.)/', '', $description);
        
        // Remove name lists
        $description = preg_replace('/[A-Z][a-z]+,\s*[A-Z][a-z]+.*$/', '', $description);
        
        // Remove "target(s)" mentions
        $description = preg_replace('/\d+\s+target\(s\)/', '', $description);
        
        // Clean up extra whitespace
        $description = preg_replace('/\s+/', ' ', $description);
        
        return trim($description);
    }

    /**
     * Extract MFO code from line
     *
     * @param string $line
     * @return string|null
     */
    private function extractMFOCode(string $line): ?string
    {
        if (preg_match('/^([A-Z]|\d+)\./', $line, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Extract targets/success indicators from OPCR
     * Pattern: "a. Description" or "a1. Description" or "b2. Description"
     *
     * @param string $text
     * @param array $pages
     * @return array
     */
    public function extractTargets(string $text, array $pages): array
    {
        $targets = [];
        $lines = explode("\n", $text);
        
        $currentMFO = null;
        $currentType = null;
        $collectingTarget = false;
        $currentTargetText = '';
        $currentTargetCode = null;
        $currentLineStart = 0;
        
        for ($i = 0; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            
            // Skip empty lines
            if (empty($line)) {
                continue;
            }
            
            // Track function type
            if (preg_match('/STRATEGIC\s+FUNCTION/i', $line)) {
                $currentType = 'Strategic';
                continue;
            } elseif (preg_match('/CORE\s+FUNCTION/i', $line)) {
                $currentType = 'Core';
                continue;
            } elseif (preg_match('/SUPPORT\s+FUNCTION/i', $line)) {
                $currentType = 'Support';
                continue;
            }
            
            // Track current MFO (pattern: "1. " or "2. " at line start)
            if (preg_match('/^(\d+)\.\s+/i', $line, $matches)) {
                $currentMFO = $matches[1];
                continue;
            }
            
            // Look for target pattern: "a.", "a1.", "a2.", "b.", "b1.", etc.
            if (preg_match('/^([a-z]\d*)\.\s+(.+)$/i', $line, $matches)) {
                // Save previous target if collecting
                if ($collectingTarget && !empty($currentTargetText)) {
                    $this->saveTarget($targets, $currentTargetCode, $currentTargetText, $currentMFO, $currentType, $currentLineStart, $lines, $i);
                }
                
                // Start new target
                $currentTargetCode = $matches[1];
                $currentTargetText = $matches[2];
                $collectingTarget = true;
                $currentLineStart = $i;
                
                continue;
            }
            
            // If collecting target, check if line is continuation or new section
            if ($collectingTarget) {
                // Stop if we hit certain markers
                if (preg_match('/^(x\s+)+/i', $line) || // Rating marks
                    preg_match('/^(Jan-Dec|Jan-Jun|Jul-Dec)/i', $line) || // Period
                    preg_match('/^[A-Z][a-z]+,\s*[A-Z]/i', $line) || // Names list
                    preg_match('/^\d+\./i', $line) || // New MFO
                    preg_match('/^[a-z]\d?\./i', $line)) { // New target
                    
                    // Save current target
                    if (!empty($currentTargetText)) {
                        $this->saveTarget($targets, $currentTargetCode, $currentTargetText, $currentMFO, $currentType, $currentLineStart, $lines, $i);
                    }
                    
                    $collectingTarget = false;
                    $currentTargetText = '';
                    
                    // Re-check if this line starts a new target
                    if (preg_match('/^([a-z]\d*)\.\s+(.+)$/i', $line, $matches)) {
                        $currentTargetCode = $matches[1];
                        $currentTargetText = $matches[2];
                        $collectingTarget = true;
                        $currentLineStart = $i;
                    }
                    
                    continue;
                }
                
                // Otherwise, append to current target description
                $currentTargetText .= ' ' . $line;
            }
        }
        
        // Save last target if still collecting
        if ($collectingTarget && !empty($currentTargetText)) {
            $this->saveTarget($targets, $currentTargetCode, $currentTargetText, $currentMFO, $currentType, $currentLineStart, $lines, count($lines));
        }
        
        return $targets;
    }
    
    /**
     * Helper to save a target with metadata extraction
     */
    private function saveTarget(array &$targets, string $code, string $description, $mfoCode, $type, int $lineStart, array $lines, int $lineEnd): void
    {
        // Extract metadata from surrounding lines
        $contextLines = array_slice($lines, $lineStart, min(5, $lineEnd - $lineStart));
        $contextText = implode(' ', $contextLines);
        
        $accountable = $this->extractAccountableFromLine($contextText);
        $period = $this->extractPeriodFromLine($contextText);
        $ratings = $this->extractRatingsFromLine($contextText);
        
        $description = $this->cleanTargetDescription($description);
        
        if (strlen($description) > 10) {
            $targets[] = [
                'code' => $code,
                'mfo_code' => $mfoCode,
                'function_type' => $type ?? 'Core',
                'description' => $description,
                'accountable' => $accountable,
                'period' => $period,
                'ratings' => $ratings,
                'page' => 0, // Line-based, not page-based
            ];
            
            Log::debug('Target extracted', [
                'code' => $code,
                'mfo' => $mfoCode,
                'description' => substr($description, 0, 60),
            ]);
        }
    }
    
    /**
     * Clean target description by removing trailing info
     */
    private function cleanTargetDescription(string $description): string
    {
        // Remove period indicators at the end
        $description = preg_replace('/\s+(Jan-Dec|Jan-Jun|Jul-Dec)\s*$/i', '', $description);
        
        // Remove rating markers
        $description = preg_replace('/\s+[QETA]\s*$/i', '', $description);
        $description = preg_replace('/\s+x\s*$/i', '', $description);
        
        // Remove numbers that look like page numbers or years
        $description = preg_replace('/\s+\d{1,4}\s*$/', '', $description);
        
        // Clean up extra whitespace
        $description = preg_replace('/\s+/', ' ', $description);
        
        return trim($description);
    }
    
    /**
     * Extract period from a single line
     */
    private function extractPeriodFromLine(string $line): ?string
    {
        if (preg_match('/(Jan-Dec|Jan-Jun|Jul-Dec)/i', $line, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Check if a line looks like a target/success indicator
     *
     * @param string $line
     * @return bool
     */
    private function looksLikeTarget(string $line): bool
    {
        // Common action verbs in OPCR targets
        $actionVerbs = [
            'Submitted', 'Completed', 'Prepared', 'Conducted', 'Organized',
            'Implemented', 'Facilitated', 'Monitored', 'Evaluated', 'Developed',
            'Created', 'Updated', 'Reviewed', 'Approved', 'Processed',
            'Coordinated', 'Assisted', 'Maintained', 'Ensured', 'Provided'
        ];
        
        foreach ($actionVerbs as $verb) {
            if (stripos($line, $verb) !== false) {
                return true;
            }
        }
        
        // Check for percentage or numeric targets
        if (preg_match('/\d+%|\d+\/\d+/', $line)) {
            return true;
        }
        
        return false;
    }

    /**
     * Clean target text
     *
     * @param string $text
     * @return string
     */
    private function cleanTargetText(string $text): string
    {
        // Remove extra whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        
        // Remove common table artifacts
        $text = preg_replace('/[│|]/', '', $text);
        
        // Remove leading numbers or bullets
        $text = preg_replace('/^[\d\.\-•●○]\s*/', '', $text);
        
        return trim($text);
    }

    /**
     * Extract accountable persons/units from line
     * Names appear in column 4, usually as: Last, First format or comma-separated list
     *
     * @param string $line
     * @return array
     */
    private function extractAccountableFromLine(string $line): array
    {
        $accountable = [];
        
        // Filipino name patterns - often appear as comma-separated lists
        // Look for capitalized words that appear to be names
        // Pattern: "Onesa, Bagaporo, Baluis, Benitez, Bernosa, Brogueza"
        
        // Split by common delimiters and look for name-like words
        $parts = preg_split('/[,;]/', $line);
        
        foreach ($parts as $part) {
            $part = trim($part);
            
            // Look for capitalized words (likely surnames)
            // Pattern: One or more capital letters followed by lowercase letters
            if (preg_match('/^[A-Z][a-z]{2,}$/', $part)) {
                // Check if it's not a common word (like months, ratings, etc.)
                $commonWords = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December',
                               'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                               'Budget', 'Office', 'College', 'University', 'Dean', 'President',
                               'Quality', 'Efficiency', 'Timeliness', 'Average', 'Rating'];
                
                if (!in_array($part, $commonWords) && strlen($part) >= 3) {
                    $accountable[] = $part;
                }
            }
        }
        
        // Remove duplicates
        $accountable = array_unique($accountable);
        
        return array_values($accountable);
    }

    /**
     * Extract accountable persons from entire OPCR
     *
     * @param string $text
     * @return array
     */
    public function extractAccountable(string $text): array
    {
        $accountable = [];
        $lines = explode("\n", $text);
        
        foreach ($lines as $line) {
            $names = $this->extractAccountableFromLine($line);
            foreach ($names as $name) {
                if (!in_array($name, $accountable)) {
                    $accountable[] = $name;
                }
            }
        }
        
        Log::debug('Total accountable persons extracted', ['count' => count($accountable)]);
        
        return $accountable;
    }

    /**
     * Extract ratings from line (Q, E, T, A columns)
     * Look for 'x' marks in specific positions or patterns
     *
     * @param string $line
     * @return array
     */
    private function extractRatingsFromLine(string $line): array
    {
        $ratings = [
            'Q' => false,  // Quality
            'E' => false,  // Efficiency  
            'T' => false,  // Timeliness
            'A' => false,  // Average
        ];
        
        // Count 'x' occurrences (case insensitive)
        // Typically there are 4 'x' marks if all ratings are checked
        $xCount = substr_count(strtolower($line), 'x');
        
        // If we find exactly 4 x's, likely all ratings are marked
        if ($xCount >= 4) {
            $ratings['Q'] = true;
            $ratings['E'] = true;
            $ratings['T'] = true;
            $ratings['A'] = true;
        } 
        // If fewer x's, try to determine which columns
        elseif ($xCount > 0) {
            // This is a simplified approach
            // A more accurate method would need to know exact column positions
            // For now, mark as many as we found
            $keys = array_keys($ratings);
            for ($i = 0; $i < min($xCount, 4); $i++) {
                $ratings[$keys[$i]] = true;
            }
        }
        
        return $ratings;
    }

    /**
     * Extract all ratings from OPCR
     *
     * @param string $text
     * @return array
     */
    public function extractRatings(string $text): array
    {
        $allRatings = [];
        $lines = explode("\n", $text);
        
        foreach ($lines as $index => $line) {
            $ratings = $this->extractRatingsFromLine($line);
            
            // Only add if at least one rating is checked
            if (in_array(true, $ratings, true)) {
                $allRatings[] = [
                    'line' => $index + 1,
                    'ratings' => $ratings,
                ];
            }
        }
        
        return $allRatings;
    }

    /**
     * Parse and structure complete OPCR data
     *
     * @param string $text
     * @param array $pages
     * @return array
     */
    public function parseComplete(string $text, array $pages): array
    {
        $mfos = $this->extractMFOs($text);
        $targets = $this->extractTargets($text, $pages);
        $period = $this->extractPeriod($text);
        
        // Group MFOs by type
        $mfosByType = [
            'Strategic' => [],
            'Core' => [],
            'Support' => [],
        ];
        
        // Group targets by MFO
        $targetsByMFO = [];
        foreach ($targets as $target) {
            $mfoCode = $target['mfo_code'] ?? 'unassigned';
            if (!isset($targetsByMFO[$mfoCode])) {
                $targetsByMFO[$mfoCode] = [];
            }
            $targetsByMFO[$mfoCode][] = $target;
        }
        
        foreach ($mfos as $mfo) {
            $type = $mfo['type'] ?? 'Core';
            $mfoCode = $mfo['code'];
            
            $mfoData = [
                'mfo' => $mfo['description'],
                'code' => $mfoCode,
                'type' => $type,
                'targets' => $targetsByMFO[$mfoCode] ?? [],
                'target_count' => count($targetsByMFO[$mfoCode] ?? []),
            ];
            
            $mfosByType[$type][] = $mfoData;
        }
        
        return [
            'period' => $period,
            'college' => $this->extractCollege($text),
            'mfos_by_type' => $mfosByType,
            'all_mfos' => $mfos,
            'data' => array_merge(
                $mfosByType['Strategic'],
                $mfosByType['Core'],
                $mfosByType['Support']
            ),
            'all_targets' => $targets,
            'statistics' => [
                'total_mfos' => count($mfos),
                'strategic_count' => count($mfosByType['Strategic']),
                'core_count' => count($mfosByType['Core']),
                'support_count' => count($mfosByType['Support']),
                'total_targets' => count($targets),
                'targets_with_accountable' => count(array_filter($targets, function($t) {
                    return !empty($t['accountable']);
                })),
                'targets_with_ratings' => count(array_filter($targets, function($t) {
                    return !empty(array_filter($t['ratings']));
                })),
            ],
        ];
    }
}
