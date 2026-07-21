<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OPCRUploadController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\ReportorialController;

// Test endpoint
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => now()->toISOString(),
    ]);
});

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/change-password', [AuthController::class, 'changePassword']);
    Route::post('/profile/upload-picture', [AuthController::class, 'uploadProfilePicture']);
    Route::delete('/profile/delete-picture', [AuthController::class, 'deleteProfilePicture']);
    
    // Channel routes
    Route::get('/channels', [ChannelController::class, 'index']);
    Route::post('/channels', [ChannelController::class, 'store']);
    Route::get('/channels/{channel}', [ChannelController::class, 'show']);
    Route::post('/channels/{channel}/messages', [ChannelController::class, 'sendMessage']);
    Route::get('/channels/{channel}/messages', [ChannelController::class, 'getMessages']);
    Route::post('/messages/{message}/react', [ChannelController::class, 'reactToMessage']);
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    
    // Announcement routes
    Route::get('/announcements', [AnnouncementController::class, 'index']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'show']);
    
    // President-only announcement management
    Route::middleware('role:president')->group(function () {
        Route::post('/announcements', [AnnouncementController::class, 'store']);
        Route::put('/announcements/{id}', [AnnouncementController::class, 'update']);
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'destroy']);
        Route::post('/announcements/{id}/publish', [AnnouncementController::class, 'togglePublish']);
        Route::post('/announcements/{id}/pin', [AnnouncementController::class, 'togglePin']);
    });
    
    // OPCR routes
    Route::prefix('opcr')->group(function () {
        Route::get('/test', [OPCRUploadController::class, 'test']);
        Route::post('/upload', [OPCRUploadController::class, 'upload']);
        Route::get('/list', [OPCRUploadController::class, 'index']);
        Route::get('/preview/{fileName}', [OPCRUploadController::class, 'preview']);
        Route::get('/parse/{fileName}', [OPCRUploadController::class, 'parse']);
        Route::get('/download/{fileName}', [OPCRUploadController::class, 'download']);
        Route::delete('/{fileName}', [OPCRUploadController::class, 'destroy']);
        
        // New: Save edited/corrected OPCR data
        Route::post('/save-parsed', [OPCRUploadController::class, 'saveParsedData']);
    });
    
    // Reportorial file management routes
    Route::prefix('reportorial')->group(function () {
        Route::get('/folders', [ReportorialController::class, 'getFolders']);
        Route::get('/folders/{folderId}', [ReportorialController::class, 'getFolderDetails']);
        Route::post('/folders/{folderId}/upload', [ReportorialController::class, 'uploadFile']);
        Route::get('/files/{fileId}/download', [ReportorialController::class, 'downloadFile']);
        Route::delete('/files/{fileId}', [ReportorialController::class, 'deleteFile']);
        Route::put('/files/{fileId}', [ReportorialController::class, 'updateFile']);
        Route::get('/statistics', [ReportorialController::class, 'getStatistics']);
        Route::get('/search', [ReportorialController::class, 'searchFiles']);
    });
});
