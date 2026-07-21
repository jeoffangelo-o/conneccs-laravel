<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ReportorialFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'folder_id',
        'user_id',
        'name',
        'original_name',
        'file_path',
        'file_type',
        'file_size',
        'mime_type',
        'description',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    protected $appends = ['file_size_formatted', 'file_url'];

    /**
     * Get the folder that owns the file.
     */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(ReportorialFolder::class, 'folder_id');
    }

    /**
     * Get the user that uploaded the file.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get formatted file size.
     */
    public function getFileSizeFormattedAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get file URL.
     */
    public function getFileUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    /**
     * Delete file from storage when model is deleted.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($file) {
            if (Storage::exists($file->file_path)) {
                Storage::delete($file->file_path);
            }
        });
    }
}
