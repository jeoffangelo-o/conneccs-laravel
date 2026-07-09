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
        Schema::create('reportorial_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reportorial_folder_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED'])->default('DRAFT');
            $table->text('remarks')->nullable();
            $table->text('feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->boolean('is_late')->default(false);
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('reportorial_folder_id');
            $table->index('user_id');
            $table->index('status');
            $table->index(['user_id', 'status']);
            $table->index('submitted_at');
            
            // Unique constraint: one submission per user per folder
            $table->unique(['reportorial_folder_id', 'user_id'], 'unique_folder_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportorial_submissions');
    }
};
