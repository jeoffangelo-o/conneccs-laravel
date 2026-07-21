<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportorialFolder extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'icon',
        'color',
        'description',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Get the files for the folder.
     */
    public function files(): HasMany
    {
        return $this->hasMany(ReportorialFile::class, 'folder_id');
    }

    /**
     * Get files count for the folder.
     */
    public function getFilesCountAttribute(): int
    {
        return $this->files()->count();
    }

    /**
     * Get unique contributors count.
     */
    public function getContributorsCountAttribute(): int
    {
        return $this->files()->distinct('user_id')->count('user_id');
    }

    /**
     * Scope to get only active folders.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by custom order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order')->orderBy('name');
    }
}
