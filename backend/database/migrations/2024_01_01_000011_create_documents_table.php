<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('target_id')->nullable()->constrained()->onDelete('cascade');
            $table->unsignedBigInteger('reportorial_submission_id')->nullable();
            $table->string('filename');
            $table->string('original_filename');
            $table->string('mime_type');
            $table->bigInteger('size')->comment('Size in bytes');
            $table->string('storage_path');
            $table->string('storage_disk')->default('local'); // local, s3, etc.
            $table->enum('document_type', [
                'MOV',
                'REPORT',
                'ATTACHMENT',
                'OPCR_TEMPLATE',
                'IPCR_TEMPLATE',
                'REPORTORIAL_DOCUMENT',
                'OTHER'
            ])->default('OTHER');
            $table->string('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->string('access_token')->nullable()->unique();
            $table->integer('download_count')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('target_id');
            $table->index('reportorial_submission_id');
            $table->index('document_type');
            $table->index('access_token');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
