<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OPCRParser
{
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
     *
     * @param string $text
     * @return array
     */
    public function extractMFOs(string $text): array
    {
        $mfos = [];
        $lines = explode("\n", $text);
        
        $inMFOSection = false;
        $currentMFO = null;
        
        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip empty lines
            if (empty($line)) {
                continue;
            }
            
            // Check if we're entering MFO/PAP section
            if (preg_match('/MFO|PAP|MAJOR FINAL OUTPUT|PRINCIPAL ACTIVITIES/i', $line)) {
                $inMFOSection = true;
                continue;
            }
            
            // Look for numbered items (MFOs are usually numbered)
            if (preg_match('/^[A-Z]\.|\d+\./', $line)) {
                // This might be an MFO
                $mfoText = preg_replace('/^[A-Z]\.|^\d+\./', '', $line);
                $mfoText = trim($mfoText);
                
                if (strlen($mfoText) > 10) { // Must be substantial text
                    $mfos[] = [
                        'code' => $this->extractMFOCode($line),
                        'description' => $mfoText,
                    ];
                    Log::debug('MFO found', ['mfo' => $mfoText]);
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
     *
     * @param string $text
     * @param array $pages
     * @return array
     */
    public function extractTargets(string $text, array $pages): array
    {
        $targets = [];
        
        foreach ($pages as $pageData) {
            $pageText = $pageData['text'];
            $lines = explode("\n", $pageText);
            
            foreach ($lines as $line) {
                $line = trim($line);
                
                // Skip short lines
                if (strlen($line) < 20) {
                    continue;
                }
                
                // Look for lines that might be targets
                // Targets often start with action verbs or contain specific keywords
                if ($this->looksLikeTarget($line)) {
                    $target = [
                        'description' => $this->cleanTargetText($line),
                        'page' => $pageData['page'],
                        'accountable' => $this->extractAccountableFromLine($line),
                        'ratings' => $this->extractRatingsFromLine($line),
                    ];
                    
                    if (!empty($target['description'])) {
                        $targets[] = $target;
                        Log::debug('Target extracted', ['target' => substr($target['description'], 0, 50) . '...']);
                    }
                }
            }
        }
        
        return $targets;
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
     *
     * @param string $line
     * @return array
     */
    private function extractAccountableFromLine(string $line): array
    {
        $accountable = [];
        
        // Common Filipino surnames and positions
        $namePatterns = [
            '/([A-Z][a-z]+)\s*,?\s*([A-Z][a-z]+)/',  // Last, First
            '/([A-Z][a-z]+)\s+([A-Z]\.)/',            // Last F.
            '/(Dean|Secretary|Chair|Coordinator|Faculty)\s+([A-Z][a-z]+)/',  // Position Name
        ];
        
        foreach ($namePatterns as $pattern) {
            if (preg_match_all($pattern, $line, $matches)) {
                foreach ($matches[0] as $match) {
                    $name = trim($match);
                    if (strlen($name) > 3 && !in_array($name, $accountable)) {
                        $accountable[] = $name;
                    }
                }
            }
        }
        
        return $accountable;
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
        
        // Look for checkmarks, X marks, or filled indicators
        $indicators = ['✓', '✔', '√', 'X', 'x', '•', '●'];
        
        // Try to find rating columns
        // This is a simplified approach - actual implementation might need more sophisticated parsing
        foreach (array_keys($ratings) as $rating) {
            foreach ($indicators as $indicator) {
                if (stripos($line, $indicator) !== false) {
                    $ratings[$rating] = true;
                    break;
                }
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
        
        // Structure data with MFOs and their targets
        $structured = [];
        
        foreach ($mfos as $mfo) {
            $mfoData = [
                'mfo' => $mfo['description'],
                'code' => $mfo['code'],
                'targets' => [],
            ];
            
            // This is simplified - in reality, you'd need to associate targets with their MFOs
            // based on proximity in the text or table structure
            
            $structured[] = $mfoData;
        }
        
        return [
            'period' => $period,
            'college' => $this->extractCollege($text),
            'data' => $structured,
            'all_targets' => $targets,
            'statistics' => [
                'total_mfos' => count($mfos),
                'total_targets' => count($targets),
            ],
        ];
    }
}
