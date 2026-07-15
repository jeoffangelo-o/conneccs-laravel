<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnnouncementController extends Controller
{
    /**
     * Get all announcements (published only for non-admin)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Announcement::with('creator:id,name,email');
        
        // Admin/President can see all, others see only published
        if (!$user || $user->role !== 'president') {
            $query->published();
        }
        
        $announcements = $query->orderByImportance()->get();
        
        return response()->json([
            'success' => true,
            'data' => $announcements,
        ]);
    }

    /**
     * Get single announcement
     */
    public function show($id)
    {
        $announcement = Announcement::with('creator:id,name,email')->find($id);
        
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $announcement,
        ]);
    }

    /**
     * Create new announcement (President only)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|in:low,normal,high,urgent',
            'is_pinned' => 'boolean',
            'publish_now' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement = Announcement::create([
            'title' => $request->title,
            'content' => $request->content,
            'priority' => $request->priority,
            'is_pinned' => $request->is_pinned ?? false,
            'created_by' => $request->user()->id,
            'published_at' => $request->publish_now ? now() : null,
        ]);

        $announcement->load('creator:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Announcement created successfully',
            'data' => $announcement,
        ], 201);
    }

    /**
     * Update announcement (President only)
     */
    public function update(Request $request, $id)
    {
        $announcement = Announcement::find($id);
        
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'priority' => 'sometimes|required|in:low,normal,high,urgent',
            'is_pinned' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $announcement->update($request->only([
            'title',
            'content',
            'priority',
            'is_pinned',
        ]));

        $announcement->load('creator:id,name,email');

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully',
            'data' => $announcement,
        ]);
    }

    /**
     * Delete announcement (President only)
     */
    public function destroy($id)
    {
        $announcement = Announcement::find($id);
        
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found',
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully',
        ]);
    }

    /**
     * Publish/unpublish announcement (President only)
     */
    public function togglePublish($id)
    {
        $announcement = Announcement::find($id);
        
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found',
            ], 404);
        }

        $announcement->published_at = $announcement->published_at ? null : now();
        $announcement->save();

        $announcement->load('creator:id,name,email');

        return response()->json([
            'success' => true,
            'message' => $announcement->published_at ? 'Announcement published' : 'Announcement unpublished',
            'data' => $announcement,
        ]);
    }

    /**
     * Toggle pin status (President only)
     */
    public function togglePin($id)
    {
        $announcement = Announcement::find($id);
        
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Announcement not found',
            ], 404);
        }

        $announcement->is_pinned = !$announcement->is_pinned;
        $announcement->save();

        $announcement->load('creator:id,name,email');

        return response()->json([
            'success' => true,
            'message' => $announcement->is_pinned ? 'Announcement pinned' : 'Announcement unpinned',
            'data' => $announcement,
        ]);
    }
}
