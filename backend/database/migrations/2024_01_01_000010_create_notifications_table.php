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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', [
                'IPCR_SUBMITTED',
                'IPCR_ENDORSED',
                'IPCR_RATED',
                'IPCR_APPROVED',
                'IPCR_RETURNED',
                'IPCR_INCOMPLETE',
                'IPCR_OVERRIDE',
                'MESSAGE_RECEIVED',
                'REPORTORIAL_DUE',
                'REPORTORIAL_SUBMITTED',
                'ANNOUNCEMENT_POSTED',
                'SYSTEM_ANNOUNCEMENT',
                'TARGET_DEADLINE',
                'ACCOMPLISHMENT_DEADLINE'
            ]);
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->foreignId('related_ipcr_id')->nullable()->constrained('ipcrs')->onDelete('cascade');
            $table->foreignId('related_target_id')->nullable()->constrained('targets')->onDelete('cascade');
            $table->foreignId('related_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->json('metadata')->nullable(); // Additional context data
            $table->string('action_url')->nullable(); // Deep link URL
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('user_id');
            $table->index('type');
            $table->index('is_read');
            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
            $table->index('related_ipcr_id');
            $table->index('related_target_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
