<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OPCRUploadController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google', [AuthController::class, 'googleAuth']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
    
    // Channel routes
    Route::prefix('channels')->group(function () {
        Route::get('/', [ChannelController::class, 'index']);
        Route::post('/', [ChannelController::class, 'store']);
        Route::get('/{id}', [ChannelController::class, 'show']);
        Route::get('/{id}/members', [ChannelController::class, 'getMembers']);
        Route::get('/{id}/messages', [ChannelController::class, 'getMessages']);
        Route::post('/{id}/messages', [ChannelController::class, 'sendMessage']);
        Route::put('/{id}/read', [ChannelController::class, 'markAsRead']);
        Route::put('/{channelId}/messages/{messageId}', [ChannelController::class, 'updateMessage']);
        Route::delete('/{channelId}/messages/{messageId}', [ChannelController::class, 'deleteMessage']);
        Route::post('/{channelId}/messages/{messageId}/react', [ChannelController::class, 'toggleReaction']);
        Route::post('/upload', [ChannelController::class, 'uploadAttachment']);
    });
    
    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/clear-read', [NotificationController::class, 'clearRead']);
        Route::get('/preferences', [NotificationController::class, 'getPreferences']);
        Route::put('/preferences', [NotificationController::class, 'updatePreferences']);
        Route::put('/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/{id}/unread', [NotificationController::class, 'markAsUnread']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
    });
    
    // OPCR Upload routes
    Route::prefix('opcr')->group(function () {
        Route::post('/upload', [OPCRUploadController::class, 'upload']);
        Route::get('/files', [OPCRUploadController::class, 'index']);
        Route::get('/download/{fileName}', [OPCRUploadController::class, 'download']);
        Route::delete('/files/{fileName}', [OPCRUploadController::class, 'destroy']);
    });
});
