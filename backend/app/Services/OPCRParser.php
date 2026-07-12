<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OPCRParser
{
    private $currentFunctionType = null;
    private $currentMFO = null;
    
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
        if (preg_match('/College of ([^\n]+)/i', $text, $matches)) {
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
        // Look for period patterns
        $patterns = [
            '/January\s*-\s*June/i' => 'Jan-Jun',
            '/July\s*-\s*December/i' => 'Jul-Dec',
            '/January\s*-\s*December/i' => 'Jan-Dec',
            '/Jan\s*-\s*Jun/i' => 'Jan-Jun',
            '/Jul\s*-\s*Dec/i' => 'Jul-Dec',
        ];

        foreach ($patterns as $pattern => $period) {
            if (preg_match($pattern, $text)) {
                Log::debug('Period extracted', ['period' => $period]);
                return $period;
            }
        }

        // Check for "Midyear" or "Year-end"
        if (preg_match('/midyear/i', $text)) {
            return 'Jan-Jun';
        } elseif (preg_match('/year[\s-]*end/i', $text)) {
            return 'Jul-Dec';
        }

        return 'Jan-Dec'; // Default to full year
    }

    /**
     * Extract Major Final Outputs (MFOs) / Principal Activities and Programs (PAPs)
     * MFOs are in column 1 with numbering like: 1.1, 1.2, 2.1, etc.
     *
     * @param string $text
     * @return array
     */
    public function extractMFOs(string $text): array
    {
        $mfos = [];
        $lines = explode("\n", $text);
        
        $currentType = null; // Strategic, Core, or Support
        
        foreach ($lines as $lineNum => $line) {
            $line = trim($line);
            
            // Skip empty lines
            if (empty($line)) {
                continue;
            }
            
            // Detect function type headers with percentages
            if (preg_match('/STRATEGIC\s+FUNCTION.*?(\d+)%/i', $line, $matches)) {
                $currentType = 'Strategic';
                Log::debug('Entering Strategic Functions section', ['percentage' => $matches[1]]);
                continue;
            } elseif (preg_match('/CORE\s+FUNCTION.*?(\d+)%/i', $line, $matches)) {
                $currentType = 'Core';
                Log::debug('Entering Core Functions section', ['percentage' => $matches[1]]);
                continue;
            } elseif (preg_match('/SUPPORT\s+FUNCTION.*?(\d+)%/i', $line, $matches)) {
                $currentType = 'Support';
                Log::debug('Entering Support Functions section', ['percentage' => $matches[1]]);
                continue;
            }
            
            // Look for MFO pattern: starts with decimal numbering like "1.1", "1.2", "2.1"
            // Followed by capital letters (main MFO title)
            if (preg_match('/^(\d+\.\d+)\s+([A-Z][A-Za-z\s,\-\/]+?)(?:\s|$)/i', $line, $matches)) {
                $code = $matches[1];
                $description = trim($matches[2]);
                
                // Only add if description is substantial (more than just a few characters)
                if (strlen($description) > 10) {
                    $mfos[] = [
                        'code' => $code,
                        'description' => $description,
                        'type' => $currentType ?? 'Core',
                        'line_number' => $lineNum + 1,
                    ];
                    
                    $this->currentMFO = $code;
                    
                    Log::debug('MFO found', [
                        'code' => $code,
                        'mfo' => substr($description, 0, 50),
                        'type' => $currentType ?? 'Core',
                    ]);
                }
            }
        }
        
        return $mfos;
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
     * Targets are in column 2 with hierarchical numbering like: 1.1.1, 1.1.2, 1.2.1, etc.
     *
     * @param string $text
     * @param array $pages
     * @return array
     */
    public function extractTargets(string $text, array $pages): array
    {
        $targets = [];
        $currentMFO = null;
        $currentType = null;
        
        foreach ($pages as $pageData) {
            $pageText = $pageData['text'];
            $lines = explode("\n", $pageText);
            
            foreach ($lines as $line) {
                $originalLine = $line;
                $line = trim($line);
                
                // Skip very short lines
                if (strlen($line) < 15) {
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
                
                // Track current MFO (pattern: 1.1, 1.2, etc.)
                if (preg_match('/^(\d+\.\d+)\s+/', $line, $matches)) {
                    $currentMFO = $matches[1];
                }
                
                // Look for target/success indicator pattern
                // Pattern: 1.1.1, 1.2.3, 1.3.1.1 (3 or 4 level numbering)
                if (preg_match('/^(\d+\.\d+\.\d+(?:\.\d+)?)\s+(.+?)$/i', $line, $matches)) {
                    $targetCode = $matches[1];
                    $description = trim($matches[2]);
                    
                    // Extract accountable persons (usually appear after description)
                    $accountable = $this->extractAccountableFromLine($originalLine);
                    
                    // Extract period (Jan-Dec, Jan-Jun, Jul-Dec) from end of line
                    $period = $this->extractPeriodFromLine($line);
                    
                    // Extract ratings (x marks in Q, E, T, A columns)
                    $ratings = $this->extractRatingsFromLine($originalLine);
                    
                    // Clean description - remove trailing names, dates, and markers
                    $description = $this->cleanTargetDescription($description);
                    
                    if (strlen($description) > 10) {
                        $targets[] = [
                            'code' => $targetCode,
                            'mfo_code' => $currentMFO,
                            'function_type' => $currentType ?? 'Core',
                            'description' => $description,
                            'accountable' => $accountable,
                            'period' => $period,
                            'ratings' => $ratings,
                            'page' => $pageData['page'],
                        ];
                        
                        Log::debug('Target extracted', [
                            'code' => $targetCode,
                            'mfo' => $currentMFO,
                            'description' => substr($description, 0, 60),
                        ]);
                    }
                }
                
                // Also catch bullet points or sub-items without full numbering
                // Pattern: • description or - description
                elseif (preg_match('/^[•\-\*]\s+(.+?)$/i', $line, $matches)) {
                    $description = trim($matches[1]);
                    
                    if ($this->looksLikeTarget($description) && strlen($description) > 15) {
                        $accountable = $this->extractAccountableFromLine($originalLine);
                        $period = $this->extractPeriodFromLine($line);
                        $ratings = $this->extractRatingsFromLine($originalLine);
                        
                        $description = $this->cleanTargetDescription($description);
                        
                        $targets[] = [
                            'code' => null,
                            'mfo_code' => $currentMFO,
                            'function_type' => $currentType ?? 'Core',
                            'description' => $description,
                            'accountable' => $accountable,
                            'period' => $period,
                            'ratings' => $ratings,
                            'page' => $pageData['page'],
                        ];
                    }
                }
            }
        }
        
        return $targets;
    }
    
    /**
     * Clean target description by removing trailing info
     */
    private function cleanTargetDescription(string $description): string
    {
        // Remove period indicators at the end
        $description = preg_replace('/\s+(Jan-Dec|Jan-Jun|Jul-Dec)\s*$/i', '', $description);
        
        // Remove single letters (likely column markers)
        $description = preg_replace('/\s+[QETA]\s*$/i', '', $description);
        
        // Remove trailing x marks
        $description = preg_replace('/\s+x\s*$/i', '', $description);
        
        // Remove trailing numbers that look like dates
        $description = preg_replace('/\s+\d{4}\s*$/', '', $description);
        
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
