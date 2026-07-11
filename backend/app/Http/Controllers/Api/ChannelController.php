<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\ChannelMessage;
use App\Models\MessageReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChannelController extends Controller
{
    /**
     * Get all channels for the authenticated user
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $channels = Channel::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->with(['members', 'latestMessage' => function ($query) {
            $query->with('user')->latest()->limit(1);
        }])
        ->get()
        ->map(function ($channel) use ($user) {
            $latestMessage = $channel->latestMessage->first();
            $unreadCount = $channel->getUnreadCountForUser($user->id);

            return [
                'id' => $channel->id,
                'name' => $channel->name,
                'description' => $channel->description,
                'type' => $channel->type,
                'icon' => $channel->icon,
                'color' => $channel->color,
                'isPrivate' => $channel->is_private,
                'memberCount' => $channel->members->count(),
                'lastMessage' => $latestMessage ? $latestMessage->content : null,
                'lastMessageTime' => $latestMessage ? $latestMessage->created_at->diffForHumans() : null,
                'lastMessageAt' => $latestMessage ? $latestMessage->created_at->toISOString() : null,
                'unreadCount' => $unreadCount,
                'createdAt' => $channel->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $channels,
        ]);
    }

    /**
     * Get a specific channel
     */
    public function show($id)
    {
        $user = Auth::user();

        $channel = Channel::with('members')->findOrFail($id);

        // Check if user is a member
        if (!$channel->members->contains($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this channel',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $channel->id,
                'name' => $channel->name,
                'description' => $channel->description,
                'type' => $channel->type,
                'icon' => $channel->icon,
                'color' => $channel->color,
                'isPrivate' => $channel->is_private,
                'memberCount' => $channel->members->count(),
                'members' => $channel->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'role' => $member->pivot->role,
                    ];
                }),
                'createdAt' => $channel->created_at->toISOString(),
            ],
        ]);
    }

    /**
     * Get messages for a specific channel
     */
    public function getMessages($id, Request $request)
    {
        $user = Auth::user();
        $limit = $request->input('limit', 50);
        $before = $request->input('before'); // Message ID for pagination

        $channel = Channel::findOrFail($id);

        // Check if user is a member
        if (!$channel->members->contains($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this channel',
            ], 403);
        }

        $query = ChannelMessage::where('channel_id', $id)
            ->with(['user', 'replyTo.user', 'reactions.user'])
            ->orderBy('created_at', 'desc');

        if ($before) {
            $query->where('id', '<', $before);
        }

        $messages = $query->limit($limit)->get()->reverse()->values();

        $formattedMessages = $messages->map(function ($message) use ($user) {
            // Group reactions by emoji
            $reactionsGrouped = $message->reactions->groupBy('emoji')->map(function ($reactions, $emoji) use ($user) {
                return [
                    'emoji' => $emoji,
                    'count' => $reactions->count(),
                    'users' => $reactions->map(fn($r) => [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                    ])->values(),
                    'hasReacted' => $reactions->contains('user_id', $user->id),
                ];
            })->values();

            return [
                'id' => $message->id,
                'channelId' => $message->channel_id,
                'userId' => $message->user_id,
                'userName' => $message->user->name,
                'userEmail' => $message->user->email,
                'content' => $message->content,
                'attachments' => $message->attachments,
                'mentionedUsers' => $message->mentioned_users,
                'replyToId' => $message->reply_to_id,
                'replyTo' => $message->replyTo ? [
                    'id' => $message->replyTo->id,
                    'userId' => $message->replyTo->user_id,
                    'userName' => $message->replyTo->user->name,
                    'content' => $message->replyTo->content,
                ] : null,
                'reactions' => $reactionsGrouped,
                'isPinned' => $message->is_pinned,
                'isEdited' => $message->is_edited,
                'editedAt' => $message->edited_at ? $message->edited_at->toISOString() : null,
                'createdAt' => $message->created_at->toISOString(),
                'isCurrentUser' => $message->user_id === $user->id,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedMessages,
        ]);
    }

    /**
     * Send a message to a channel
     */
    public function sendMessage($id, Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'content' => 'required|string|max:5000',
            'replyToId' => 'nullable|exists:channel_messages,id',
            'attachments' => 'nullable|array',
            'attachments.*.name' => 'required|string',
            'attachments.*.url' => 'required|string',
            'attachments.*.type' => 'required|string',
            'attachments.*.size' => 'nullable|integer',
            'mentionedUsers' => 'nullable|array',
            'mentionedUsers.*' => 'exists:users,id',
        ]);

        $channel = Channel::findOrFail($id);

        // Check if user is a member
        if (!$channel->members->contains($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this channel',
            ], 403);
        }

        $message = ChannelMessage::create([
            'channel_id' => $id,
            'user_id' => $user->id,
            'content' => $request->content,
            'reply_to_id' => $request->replyToId,
            'attachments' => $request->attachments,
            'mentioned_users' => $request->mentionedUsers,
        ]);

        $message->load(['user', 'replyTo.user']);

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'data' => [
                'id' => $message->id,
                'channelId' => $message->channel_id,
                'userId' => $message->user_id,
                'userName' => $message->user->name,
                'userEmail' => $message->user->email,
                'content' => $message->content,
                'attachments' => $message->attachments,
                'mentionedUsers' => $message->mentioned_users,
                'replyToId' => $message->reply_to_id,
                'replyTo' => $message->replyTo ? [
                    'id' => $message->replyTo->id,
                    'userId' => $message->replyTo->user_id,
                    'userName' => $message->replyTo->user->name,
                    'content' => $message->replyTo->content,
                ] : null,
                'reactions' => [],
                'isPinned' => $message->is_pinned,
                'isEdited' => $message->is_edited,
                'createdAt' => $message->created_at->toISOString(),
                'isCurrentUser' => true,
            ],
        ], 201);
    }

    /**
     * Mark channel as read
     */
    public function markAsRead($id)
    {
        $user = Auth::user();
        $channel = Channel::findOrFail($id);

        // Check if user is a member
        $membership = DB::table('channel_members')
            ->where('channel_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this channel',
            ], 403);
        }

        // Update last_read_at
        DB::table('channel_members')
            ->where('channel_id', $id)
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Channel marked as read',
        ]);
    }

    /**
     * Create a new channel
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|in:GENERAL,DEPARTMENT,DIRECT,ANNOUNCEMENT',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
            'isPrivate' => 'boolean',
            'memberIds' => 'nullable|array',
            'memberIds.*' => 'exists:users,id',
        ]);

        $channel = Channel::create([
            'name' => $request->name,
            'description' => $request->description,
            'type' => $request->type,
            'icon' => $request->icon ?? 'people',
            'color' => $request->color ?? '#f4c430',
            'is_private' => $request->isPrivate ?? false,
            'created_by' => $user->id,
        ]);

        // Add creator as admin
        DB::table('channel_members')->insert([
            'channel_id' => $channel->id,
            'user_id' => $user->id,
            'role' => 'ADMIN',
            'last_read_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add other members
        if ($request->memberIds) {
            $members = collect($request->memberIds)
                ->filter(fn($id) => $id != $user->id)
                ->map(fn($id) => [
                    'channel_id' => $channel->id,
                    'user_id' => $id,
                    'role' => 'MEMBER',
                    'last_read_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

            DB::table('channel_members')->insert($members->toArray());
        }

        return response()->json([
            'success' => true,
            'message' => 'Channel created successfully',
            'data' => [
                'id' => $channel->id,
                'name' => $channel->name,
                'type' => $channel->type,
            ],
        ], 201);
    }

    /**
     * Delete a message
     */
    public function deleteMessage($channelId, $messageId)
    {
        $user = Auth::user();
        $message = ChannelMessage::where('channel_id', $channelId)
            ->where('id', $messageId)
            ->firstOrFail();

        // Only message owner or channel admin can delete
        $isAdmin = DB::table('channel_members')
            ->where('channel_id', $channelId)
            ->where('user_id', $user->id)
            ->where('role', 'ADMIN')
            ->exists();

        if ($message->user_id !== $user->id && !$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this message',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }

    /**
     * Edit a message
     */
    public function updateMessage($channelId, $messageId, Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $message = ChannelMessage::where('channel_id', $channelId)
            ->where('id', $messageId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $message->update([
            'content' => $request->content,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message updated successfully',
            'data' => [
                'id' => $message->id,
                'content' => $message->content,
                'isEdited' => true,
                'editedAt' => $message->edited_at->toISOString(),
            ],
        ]);
    }

    /**
     * Toggle reaction on a message
     */
    public function toggleReaction($channelId, $messageId, Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'emoji' => 'required|string|max:10',
        ]);

        $channel = Channel::findOrFail($channelId);

        // Check if user is a member
        if (!$channel->members->contains($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this channel',
            ], 403);
        }

        $message = ChannelMessage::where('channel_id', $channelId)
            ->where('id', $messageId)
            ->firstOrFail();

        // Check if reaction exists
        $reaction = MessageReaction::where('message_id', $messageId)
            ->where('user_id', $user->id)
            ->where('emoji', $request->emoji)
            ->first();

        if ($reaction) {
            // Remove reaction
            $reaction->delete();
            $action = 'removed';
        } else {
            // Add reaction
            MessageReaction::create([
                'message_id' => $messageId,
                'user_id' => $user->id,
                'emoji' => $request->emoji,
            ]);
            $action = 'added';
        }

        // Get updated reactions
        $reactions = MessageReaction::where('message_id', $messageId)
            ->with('user')
            ->get()
            ->groupBy('emoji')
            ->map(function ($reactions, $emoji) use ($user) {
                return [
                    'emoji' => $emoji,
                    'count' => $reactions->count(),
                    'users' => $reactions->map(fn($r) => [
                        'id' => $r->user->id,
                        'name' => $r->user->name,
                    ])->values(),
                    'hasReacted' => $reactions->contains('user_id', $user->id),
                ];
            })->values();

        return response()->json([
            'success' => true,
            'message' => "Reaction {$action} successfully",
            'data' => [
                'messageId' => $messageId,
                'reactions' => $reactions,
            ],
        ]);
    }

    /**
     * Upload file attachment
     */
    public function uploadAttachment(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $user = Auth::user();
        $file = $request->file('file');

        // Generate unique filename
        $filename = time() . '_' . $user->id . '_' . $file->getClientOriginalName();
        
        // Store file in public storage
        $path = $file->storeAs('attachments', $filename, 'public');

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'name' => $file->getClientOriginalName(),
                'url' => Storage::url($path),
                'type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ],
        ]);
    }

    /**
     * Get channel members for mentions
     */
    public function getMembers($id)
    {
        $user = Auth::user();
        $channel = Channel::findOrFail($id);

        // Check if user is a member
        if (!$channel->members->contains($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this channel',
            ], 403);
        }

        $members = $channel->members->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->pivot->role,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }
}
