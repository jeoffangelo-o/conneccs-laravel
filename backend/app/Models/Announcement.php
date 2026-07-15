<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'priority',
        'created_by',
        'published_at',
        'is_pinned',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_pinned' => 'boolean',
    ];

    /**
     * Get the user who created the announcement
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for published announcements
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
    }

    /**
     * Scope for pinned announcements
     */
    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope for ordering by priority and date
     */
    public function scopeOrderByImportance($query)
    {
        return $query->orderByRaw("
            CASE priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'normal' THEN 3
                WHEN 'low' THEN 4
            END
        ")->orderBy('is_pinned', 'desc')
          ->orderBy('published_at', 'desc');
    }
}
