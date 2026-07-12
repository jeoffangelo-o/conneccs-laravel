<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OPCRParserService;
use App\Services\OPCRParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Exception;

class OPCRUploadController extends Controller
{
    protected OPCRParserService $parserService;
    protected OPCRParser $opcrParser;

    public function __construct(OPCRParserService $parserService, OPCRParser $opcrParser)
    {
        $this->parserService = $parserService;
        $this->opcrParser = $opcrParser;
    }

    /**
     * Upload and process OPCR PDF file
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        try {
            Log::info('OPCR upload request received', [
                'headers' => $request->headers->all(),
                'has_file' => $request->hasFile('file'),
                'all_inputs' => $request->except(['file']),
                'files' => $request->allFiles(),
            ]);

            // Validate the request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB
                'year' => 'required|string|max:10',
                'period' => 'required|in:MIDYEAR,YEAR_END',
            ]);

            if ($validator->fails()) {
                Log::error('OPCR upload validation failed', [
                    'errors' => $validator->errors()->toArray(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('file');
            $collegeName = $request->input('college_name', 'College of Computer Studies');
            $year = $request->input('year');
            $period = $request->input('period');

            Log::info('OPCR upload started', [
                'college_name' => $collegeName,
                'year' => $year,
                'period' => $period,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'file_mime' => $file->getMimeType(),
                'user_id' => auth()->id(),
            ]);

            // Store the file
            $timestamp = now()->format('YmdHis');
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $fileName = sprintf(
                'CCS_%s_%s_%s.pdf',
                $year,
                $period,
                $timestamp
            );

            // Store the file in opcr directory (not private)
            $filePath = $file->storeAs('opcr', $fileName, 'local');
            $fullPath = Storage::path($filePath);

            Log::info('OPCR file stored', [
                'storage_path' => $filePath,
                'full_path' => $fullPath,
            ]);

            // Validate PDF
            if (!$this->parserService->isValidPdf($fullPath)) {
                Storage::delete($filePath);
                
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded file is not a valid PDF.',
                ], 422);
            }

            // Extract metadata
            $metadata = $this->parserService->getMetadata($fullPath);
            
            Log::info('PDF metadata extracted', $metadata);

            // Extract text from PDF
            $extractedText = $this->parserService->extractText($fullPath);
            
            // Store raw text for debugging (Phase 1)
            $rawTextPath = $this->parserService->storeRawText($fileName, $extractedText);

            // Extract text by page
            $pageTexts = $this->parserService->extractTextByPage($fullPath);

            Log::info('OPCR text extraction completed', [
                'text_length' => strlen($extractedText),
                'total_pages' => count($pageTexts),
                'raw_text_path' => $rawTextPath,
            ]);

            // Return success response with extraction results
            return response()->json([
                'success' => true,
                'message' => 'OPCR PDF uploaded and processed successfully',
                'data' => [
                    'file_name' => $fileName,
                    'storage_path' => $filePath,
                    'college_name' => $collegeName,
                    'year' => $year,
                    'period' => $period,
                    'metadata' => $metadata,
                    'extraction' => [
                        'total_pages' => count($pageTexts),
                        'text_length' => strlen($extractedText),
                        'raw_text_stored' => true,
                        'raw_text_path' => basename($rawTextPath),
                    ],
                    'uploaded_by' => auth()->id(),
                    'uploaded_at' => now()->toISOString(),
                ],
            ], 200);

        } catch (Exception $e) {
            Log::error('OPCR upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
            ]);

            // Clean up file if it was uploaded
            if (isset($filePath) && Storage::exists($filePath)) {
                Storage::delete($filePath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload and process OPCR PDF',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get list of uploaded OPCR files
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $files = Storage::files('opcr');
            
            $opcrs = collect($files)->map(function ($file) {
                $fileName = basename($file);
                $fullPath = Storage::path($file);
                
                // Parse filename to extract info
                $parts = explode('_', pathinfo($fileName, PATHINFO_FILENAME));
                
                // Try to get metadata from the raw text file
                $rawTextFileName = pathinfo($fileName, PATHINFO_FILENAME) . '_raw.txt';
                $rawTextPath = storage_path('app/opcr/raw-text/' . $rawTextFileName);
                
                $textLength = 0;
                $pageCount = 0;
                
                if (file_exists($rawTextPath)) {
                    $textLength = strlen(file_get_contents($rawTextPath));
                }
                
                // Try to get page count from PDF
                try {
                    $parser = new \Smalot\PdfParser\Parser();
                    $pdf = $parser->parseFile($fullPath);
                    $pages = $pdf->getPages();
                    $pageCount = count($pages);
                } catch (\Exception $e) {
                    Log::warning('Failed to get page count', [
                        'file' => $fileName,
                        'error' => $e->getMessage(),
                    ]);
                }
                
                return [
                    'file_name' => $fileName,
                    'storage_path' => $file,
                    'size' => Storage::size($file),
                    'uploaded_at' => Storage::lastModified($file),
                    'college_name' => $parts[0] ?? null,
                    'year' => $parts[1] ?? null,
                    'period' => $parts[2] ?? null,
                    'page_count' => $pageCount,
                    'text_length' => $textLength,
                ];
            })->sortByDesc('uploaded_at')->values();

            return response()->json([
                'success' => true,
                'data' => $opcrs,
            ], 200);

        } catch (Exception $e) {
            Log::error('Failed to fetch OPCR files', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch OPCR files',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an uploaded OPCR file
     *
     * @param string $fileName
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $fileName)
    {
        try {
            $filePath = 'opcr/' . $fileName;
            
            if (!Storage::exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OPCR file not found',
                ], 404);
            }

            Storage::delete($filePath);
            
            // Also delete raw text file if exists
            $rawTextFileName = pathinfo($fileName, PATHINFO_FILENAME) . '_raw.txt';
            $rawTextPath = storage_path('app/opcr/raw-text/' . $rawTextFileName);
            
            if (file_exists($rawTextPath)) {
                unlink($rawTextPath);
            }

            Log::info('OPCR file deleted', [
                'file_name' => $fileName,
                'deleted_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'OPCR file deleted successfully',
            ], 200);

        } catch (Exception $e) {
            Log::error('Failed to delete OPCR file', [
                'file_name' => $fileName,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete OPCR file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get extracted text preview for a file
     *
     * @param string $fileName
     * @return \Illuminate\Http\JsonResponse
     */
    public function preview(string $fileName)
    {
        try {
            $filePath = 'opcr/' . $fileName;
            
            if (!Storage::exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OPCR file not found',
                ], 404);
            }

            $fullPath = Storage::path($filePath);
            
            // Get raw text
            $rawTextFileName = pathinfo($fileName, PATHINFO_FILENAME) . '_raw.txt';
            $rawTextPath = storage_path('app/opcr/raw-text/' . $rawTextFileName);
            
            $rawText = '';
            if (file_exists($rawTextPath)) {
                $rawText = file_get_contents($rawTextPath);
            }
            
            // Get page-by-page extraction
            $pages = $this->parserService->extractTextByPage($fullPath);
            
            // Get metadata
            $metadata = $this->parserService->getMetadata($fullPath);
            
            Log::info('OPCR preview generated', [
                'file_name' => $fileName,
                'total_pages' => count($pages),
                'viewed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'file_name' => $fileName,
                    'metadata' => $metadata,
                    'raw_text' => $rawText,
                    'pages' => $pages,
                    'statistics' => [
                        'total_pages' => count($pages),
                        'total_characters' => strlen($rawText),
                        'pages_with_tables' => collect($pages)->where('has_table', true)->count(),
                        'total_lines' => array_sum(array_column($pages, 'line_count')),
                    ],
                ],
            ], 200);

        } catch (Exception $e) {
            Log::error('Failed to generate OPCR preview', [
                'file_name' => $fileName,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate preview',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Parse OPCR and extract structured data
     *
     * @param string $fileName
     * @return \Illuminate\Http\JsonResponse
     */
    public function parse(string $fileName)
    {
        try {
            $filePath = 'opcr/' . $fileName;
            
            if (!Storage::exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OPCR file not found',
                ], 404);
            }

            $fullPath = Storage::path($filePath);
            
            // Get raw text
            $rawTextFileName = pathinfo($fileName, PATHINFO_FILENAME) . '_raw.txt';
            $rawTextPath = storage_path('app/opcr/raw-text/' . $rawTextFileName);
            
            $rawText = '';
            if (file_exists($rawTextPath)) {
                $rawText = file_get_contents($rawTextPath);
            } else {
                // Extract if not exists
                $rawText = $this->parserService->extractText($fullPath);
            }
            
            // Clean UTF-8 encoding issues more aggressively
            $rawText = $this->cleanText($rawText);
            
            // Get page-by-page extraction
            $pages = $this->parserService->extractTextByPage($fullPath);
            
            // Clean each page
            foreach ($pages as &$page) {
                $page['text'] = $this->cleanText($page['text']);
            }
            unset($page); // Break reference
            
            // Debug: Log first 2000 characters of raw text
            Log::info('Raw text sample for debugging', [
                'sample' => substr($rawText, 0, 2000),
                'first_page_sample' => isset($pages[0]) ? substr($pages[0]['text'], 0, 1000) : 'No pages',
            ]);
            
            // Parse OPCR structure
            $parsedData = $this->opcrParser->parseComplete($rawText, $pages);
            
            // Clean all string values in parsed data
            $parsedData = $this->cleanArrayRecursive($parsedData);
            
            // Add debug info
            $parsedData['debug'] = [
                'raw_text_length' => strlen($rawText),
                'total_pages' => count($pages),
                'first_100_lines' => array_slice(explode("\n", $rawText), 0, 100),
            ];
            
            Log::info('OPCR parsed successfully', [
                'file_name' => $fileName,
                'mfos_found' => $parsedData['statistics']['total_mfos'] ?? 0,
                'targets_found' => $parsedData['statistics']['total_targets'] ?? 0,
                'parsed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $parsedData,
            ], 200, [], JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);

        } catch (Exception $e) {
            Log::error('Failed to parse OPCR', [
                'file_name' => $fileName,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to parse OPCR',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clean text from invalid UTF-8 characters
     *
     * @param string $text
     * @return string
     */
    private function cleanText(string $text): string
    {
        // Remove null bytes
        $text = str_replace("\0", '', $text);
        
        // Convert to UTF-8
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        
        // Remove invalid UTF-8 sequences
        $text = iconv('UTF-8', 'UTF-8//IGNORE', $text);
        
        // Remove control characters except newlines, tabs, and carriage returns
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
        
        return $text;
    }

    /**
     * Recursively clean all strings in an array
     *
     * @param mixed $data
     * @return mixed
     */
    private function cleanArrayRecursive($data)
    {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = $this->cleanArrayRecursive($value);
            }
            return $data;
        } elseif (is_string($data)) {
            return $this->cleanText($data);
        }
        return $data;
    }

    /**
     * Download an OPCR file
     *
     * @param string $fileName
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function download(string $fileName)
    {
        try {
            $filePath = 'opcr/' . $fileName;
            
            if (!Storage::exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'OPCR file not found',
                ], 404);
            }

            Log::info('OPCR file downloaded', [
                'file_name' => $fileName,
                'downloaded_by' => auth()->id(),
            ]);

            return Storage::download($filePath, $fileName);

        } catch (Exception $e) {
            Log::error('Failed to download OPCR file', [
                'file_name' => $fileName,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download OPCR file',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
