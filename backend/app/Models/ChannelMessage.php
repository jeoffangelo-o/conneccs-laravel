<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChannelMessage extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'channel_id',
        'user_id',
        'content',
        'reply_to_id',
        'attachments',
        'mentioned_users',
        'is_pinned',
        'is_edited',
        'edited_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'mentioned_users' => 'array',
        'is_pinned' => 'boolean',
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the channel this message belongs to
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Get the user who sent this message
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the message this is replying to
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(ChannelMessage::class, 'reply_to_id');
    }

    /**
     * Get replies to this message
     */
    public function replies()
    {
        return $this->hasMany(ChannelMessage::class, 'reply_to_id');
    }

    /**
     * Get reactions to this message
     */
    public function reactions()
    {
        return $this->hasMany(MessageReaction::class, 'message_id');
    }

    /**
     * Get mentioned users
     */
    public function mentionedUsers()
    {
        return $this->belongsToMany(User::class, 'mentioned_users', 'message_id', 'user_id');
    }
}
