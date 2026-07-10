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
        Schema::create('channels', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "General", "CCS Department", "IT Faculty"
            $table->text('description')->nullable();
            $table->enum('type', ['GENERAL', 'DEPARTMENT', 'DIRECT', 'ANNOUNCEMENT'])->default('GENERAL');
            $table->string('icon')->nullable(); // Icon name for the channel
            $table->string('color')->nullable(); // Color hex code for the channel
            $table->boolean('is_private')->default(false); // If true, only members can access
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('type');
            $table->index('is_private');
            $table->index('created_at');
        });

        Schema::create('channel_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')->constrained('channels')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['ADMIN', 'MEMBER'])->default('MEMBER'); // Admin can manage channel
            $table->timestamp('last_read_at')->nullable(); // For unread count
            $table->boolean('is_muted')->default(false);
            $table->timestamps();
            
            // Unique constraint - user can only be in channel once
            $table->unique(['channel_id', 'user_id']);
            
            // Indexes
            $table->index('channel_id');
            $table->index('user_id');
            $table->index(['channel_id', 'user_id']);
        });

        Schema::create('channel_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('channel_id')->constrained('channels')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Message sender
            $table->text('content');
            $table->foreignId('reply_to_id')->nullable()->constrained('channel_messages')->onDelete('set null'); // For threading
            $table->json('attachments')->nullable(); // Array of file URLs or document IDs
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_edited')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('channel_id');
            $table->index('user_id');
            $table->index('created_at');
            $table->index(['channel_id', 'created_at']);
            $table->index('is_pinned');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channel_messages');
        Schema::dropIfExists('channel_members');
        Schema::dropIfExists('channels');
    }
};
