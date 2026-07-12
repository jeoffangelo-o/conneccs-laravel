<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OPCRParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Exception;

class OPCRUploadController extends Controller
{
    protected OPCRParserService $parserService;

    public function __construct(OPCRParserService $parserService)
    {
        $this->parserService = $parserService;
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
            // Validate the request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB
                'year' => 'required|string|max:10',
                'period' => 'required|in:MIDYEAR,YEAR_END',
            ]);

            if ($validator->fails()) {
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
                'user_id' => auth()->id(),
            ]);

            // Generate unique filename
            $timestamp = now()->format('YmdHis');
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $fileName = sprintf(
                'CCS_%s_%s_%s.pdf',
                $year,
                $period,
                $timestamp
            );

            // Store the file
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
                
                return [
                    'file_name' => $fileName,
                    'storage_path' => $file,
                    'size' => Storage::size($file),
                    'uploaded_at' => Storage::lastModified($file),
                    'college_name' => $parts[0] ?? null,
                    'year' => $parts[1] ?? null,
                    'period' => $parts[2] ?? null,
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
