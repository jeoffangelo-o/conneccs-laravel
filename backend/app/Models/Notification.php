<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notification extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'is_read',
        'related_ipcr_id',
        'related_target_id',
        'related_user_id',
        'metadata',
        'action_url',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'metadata' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Notification Types
    const TYPE_IPCR_SUBMITTED = 'IPCR_SUBMITTED';
    const TYPE_IPCR_ENDORSED = 'IPCR_ENDORSED';
    const TYPE_IPCR_RATED = 'IPCR_RATED';
    const TYPE_IPCR_APPROVED = 'IPCR_APPROVED';
    const TYPE_IPCR_RETURNED = 'IPCR_RETURNED';
    const TYPE_IPCR_INCOMPLETE = 'IPCR_INCOMPLETE';
    const TYPE_IPCR_OVERRIDE = 'IPCR_OVERRIDE';
    const TYPE_MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';
    const TYPE_MESSAGE_MENTION = 'MESSAGE_MENTION';
    const TYPE_MESSAGE_REPLY = 'MESSAGE_REPLY';
    const TYPE_REPORTORIAL_DUE = 'REPORTORIAL_DUE';
    const TYPE_REPORTORIAL_SUBMITTED = 'REPORTORIAL_SUBMITTED';
    const TYPE_ANNOUNCEMENT_POSTED = 'ANNOUNCEMENT_POSTED';
    const TYPE_SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT';
    const TYPE_TARGET_DEADLINE = 'TARGET_DEADLINE';
    const TYPE_ACCOMPLISHMENT_DEADLINE = 'ACCOMPLISHMENT_DEADLINE';
    const TYPE_CHANNEL_ADDED = 'CHANNEL_ADDED';
    const TYPE_DOCUMENT_SHARED = 'DOCUMENT_SHARED';

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function relatedUser()
    {
        return $this->belongsTo(User::class, 'related_user_id');
    }

    /**
     * Scopes
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeRecent($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Methods
     */
    public function markAsRead()
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function markAsUnread()
    {
        $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    /**
     * Static helper methods to create notifications
     */
    public static function createIPCRSubmitted($userId, $iprId, $submitterName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_IPCR_SUBMITTED,
            'title' => 'IPCR Submitted',
            'message' => "{$submitterName} has submitted their IPCR for review.",
            'related_ipcr_id' => $iprId,
            'action_url' => "/review-queue",
        ]);
    }

    public static function createIPCREndorsed($userId, $iprId, $endorserName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_IPCR_ENDORSED,
            'title' => 'IPCR Endorsed',
            'message' => "{$endorserName} has endorsed an IPCR. It's ready for your review.",
            'related_ipcr_id' => $iprId,
            'action_url' => "/review-queue",
        ]);
    }

    public static function createIPCRRated($userId, $iprId, $raterName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_IPCR_RATED,
            'title' => 'IPCR Rated',
            'message' => "{$raterName} has rated your IPCR.",
            'related_ipcr_id' => $iprId,
            'action_url' => "/my-ipcr",
        ]);
    }

    public static function createIPCRApproved($userId, $iprId, $approverName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_IPCR_APPROVED,
            'title' => 'IPCR Approved',
            'message' => "Congratulations! Your IPCR has been approved by {$approverName}.",
            'related_ipcr_id' => $iprId,
            'action_url' => "/my-ipcr",
        ]);
    }

    public static function createIPCRReturned($userId, $iprId, $returnerName, $reason)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_IPCR_RETURNED,
            'title' => 'IPCR Returned',
            'message' => "{$returnerName} has returned your IPCR. Reason: {$reason}",
            'related_ipcr_id' => $iprId,
            'action_url' => "/my-ipcr",
        ]);
    }

    public static function createMessageReceived($userId, $channelId, $senderName, $preview)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_MESSAGE_RECEIVED,
            'title' => 'New Message',
            'message' => "{$senderName}: {$preview}",
            'metadata' => ['channel_id' => $channelId],
            'action_url' => "/messages",
        ]);
    }

    public static function createMessageMention($userId, $channelId, $senderName, $channelName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_MESSAGE_MENTION,
            'title' => 'You were mentioned',
            'message' => "{$senderName} mentioned you in {$channelName}",
            'metadata' => ['channel_id' => $channelId],
            'action_url' => "/messages",
        ]);
    }

    public static function createChannelAdded($userId, $channelId, $channelName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_CHANNEL_ADDED,
            'title' => 'Added to Channel',
            'message' => "You've been added to {$channelName}",
            'metadata' => ['channel_id' => $channelId],
            'action_url' => "/messages",
        ]);
    }

    public static function createReportorialDue($userId, $requirementName, $dueDate)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_REPORTORIAL_DUE,
            'title' => 'Reportorial Requirement Due',
            'message' => "{$requirementName} is due on {$dueDate}",
            'action_url' => "/reportorial-requirements",
        ]);
    }

    public static function createAnnouncementPosted($userId, $title, $channelName)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_ANNOUNCEMENT_POSTED,
            'title' => 'New Announcement',
            'message' => "{$title} in {$channelName}",
            'action_url' => "/messages",
        ]);
    }

    public static function createSystemAnnouncement($userId, $title, $message)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_SYSTEM_ANNOUNCEMENT,
            'title' => $title,
            'message' => $message,
        ]);
    }

    public static function createTargetDeadline($userId, $targetName, $daysRemaining)
    {
        return static::create([
            'user_id' => $userId,
            'type' => static::TYPE_TARGET_DEADLINE,
            'title' => 'Target Deadline Approaching',
            'message' => "{$targetName} is due in {$daysRemaining} day(s)",
            'action_url' => "/my-ipcr",
        ]);
    }
}
