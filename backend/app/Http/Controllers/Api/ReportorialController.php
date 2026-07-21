<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportorialFolder;
use App\Models\ReportorialFile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ReportorialController extends Controller
{
    /**
     * Get all reportorial folders.
     */
    public function getFolders(): JsonResponse
    {
        $folders = ReportorialFolder::active()
            ->ordered()
            ->withCount('files')
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'icon' => $folder->icon,
                    'color' => $folder->color,
                    'description' => $folder->description,
                    'filesCount' => $folder->files_count,
                    'contributorsCount' => $folder->contributors_count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $folders,
        ]);
    }

    /**
     * Get folder details with files.
     */
    public function getFolderDetails($folderId): JsonResponse
    {
        $folder = ReportorialFolder::with(['files.user'])
            ->findOrFail($folderId);

        $files = $folder->files->map(function ($file) {
            return [
                'id' => $file->id,
                'name' => $file->original_name,
                'type' => $file->file_type,
                'size' => $file->file_size_formatted,
                'sizeBytes' => $file->file_size,
                'mimeType' => $file->mime_type,
                'uploadedBy' => $file->user->name,
                'uploadedById' => $file->user_id,
                'uploadedAt' => $file->created_at->toISOString(),
                'description' => $file->description,
                'url' => $file->file_url,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'folder' => [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'icon' => $folder->icon,
                    'color' => $folder->color,
                    'description' => $folder->description,
                ],
                'files' => $files,
                'stats' => [
                    'totalFiles' => $files->count(),
                    'totalSize' => $folder->files->sum('file_size'),
                    'contributors' => $folder->files->pluck('user_id')->unique()->count(),
                ],
            ],
        ]);
    }

    /**
     * Upload file to folder.
     */
    public function uploadFile(Request $request, $folderId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $folder = ReportorialFolder::findOrFail($folderId);
        $uploadedFile = $request->file('file');

        // Generate unique filename
        $originalName = $uploadedFile->getClientOriginalName();
        $extension = $uploadedFile->getClientOriginalExtension();
        $fileName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '_' . time() . '.' . $extension;

        // Store file
        $filePath = $uploadedFile->storeAs(
            'reportorial/' . $folder->id,
            $fileName,
            'public'
        );

        // Create file record
        $file = ReportorialFile::create([
            'folder_id' => $folder->id,
            'user_id' => auth()->id(),
            'name' => $fileName,
            'original_name' => $originalName,
            'file_path' => $filePath,
            'file_type' => $extension,
            'file_size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'id' => $file->id,
                'name' => $file->original_name,
                'type' => $file->file_type,
                'size' => $file->file_size_formatted,
                'uploadedBy' => $file->user->name,
                'uploadedAt' => $file->created_at->toISOString(),
                'url' => $file->file_url,
            ],
        ], 201);
    }

    /**
     * Download file.
     */
    public function downloadFile($fileId): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $file = ReportorialFile::findOrFail($fileId);

        if (!Storage::exists($file->file_path)) {
            abort(404, 'File not found in storage');
        }

        return Storage::download($file->file_path, $file->original_name);
    }

    /**
     * Delete file.
     */
    public function deleteFile($fileId): JsonResponse
    {
        $file = ReportorialFile::findOrFail($fileId);

        // Check if user owns the file or is admin/secretary
        if ($file->user_id !== auth()->id() && !in_array(auth()->user()->role, ['ADMIN', 'SECRETARY'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this file',
            ], 403);
        }

        $file->delete(); // Will automatically delete from storage due to boot method

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully',
        ]);
    }

    /**
     * Update file details.
     */
    public function updateFile(Request $request, $fileId): JsonResponse
    {
        $file = ReportorialFile::findOrFail($fileId);

        // Check if user owns the file
        if ($file->user_id !== auth()->id() && !in_array(auth()->user()->role, ['ADMIN', 'SECRETARY'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update this file',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file->update([
            'description' => $request->description,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File updated successfully',
            'data' => [
                'id' => $file->id,
                'description' => $file->description,
            ],
        ]);
    }

    /**
     * Get file statistics.
     */
    public function getStatistics(): JsonResponse
    {
        $totalFolders = ReportorialFolder::active()->count();
        $totalFiles = ReportorialFile::count();
        $totalSize = ReportorialFile::sum('file_size');
        $myFiles = ReportorialFile::where('user_id', auth()->id())->count();

        // Format total size
        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $totalSize;
        $unit = 0;
        
        while ($size > 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'totalFolders' => $totalFolders,
                'totalFiles' => $totalFiles,
                'totalSize' => round($size, 2) . ' ' . $units[$unit],
                'myFiles' => $myFiles,
                'recentUploads' => ReportorialFile::with(['user', 'folder'])
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->map(function ($file) {
                        return [
                            'id' => $file->id,
                            'name' => $file->original_name,
                            'folder' => $file->folder->name,
                            'uploadedBy' => $file->user->name,
                            'uploadedAt' => $file->created_at->toISOString(),
                        ];
                    }),
            ],
        ]);
    }

    /**
     * Search files across all folders.
     */
    public function searchFiles(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        $files = ReportorialFile::with(['user', 'folder'])
            ->where('original_name', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->latest()
            ->limit(50)
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->original_name,
                    'type' => $file->file_type,
                    'size' => $file->file_size_formatted,
                    'folder' => [
                        'id' => $file->folder->id,
                        'name' => $file->folder->name,
                    ],
                    'uploadedBy' => $file->user->name,
                    'uploadedAt' => $file->created_at->toISOString(),
                    'url' => $file->file_url,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $files,
            'query' => $query,
        ]);
    }
}
