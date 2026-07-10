<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Channel extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'type',
        'icon',
        'color',
        'is_private',
        'created_by',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created the channel
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all messages in this channel
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChannelMessage::class);
    }

    /**
     * Get all members of this channel
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'channel_members')
            ->withPivot(['role', 'last_read_at', 'is_muted'])
            ->withTimestamps();
    }

    /**
     * Get the latest message in this channel
     */
    public function latestMessage(): HasMany
    {
        return $this->hasMany(ChannelMessage::class)->latest();
    }

    /**
     * Get unread count for a specific user
     */
    public function getUnreadCountForUser($userId)
    {
        $member = $this->members()->where('user_id', $userId)->first();
        
        if (!$member) {
            return 0;
        }

        $lastReadAt = $member->pivot->last_read_at;

        if (!$lastReadAt) {
            return $this->messages()->count();
        }

        return $this->messages()
            ->where('created_at', '>', $lastReadAt)
            ->where('user_id', '!=', $userId) // Don't count own messages
            ->count();
    }
}
