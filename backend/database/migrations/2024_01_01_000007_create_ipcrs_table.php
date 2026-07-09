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
        Schema::create('ipcrs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('opcr_id')->nullable()->constrained()->onDelete('set null');
            $table->string('period'); // MIDYEAR, YEAR_END
            $table->string('year', 10);
            
            // Status tracking
            $table->enum('status', [
                'IN_PROGRESS',
                'SUBMITTED',
                'UNDER_REVIEW',
                'APPROVED',
                'RETURNED',
                'COMPLETED'
            ])->default('IN_PROGRESS');
            
            $table->enum('current_phase', [
                'TARGET_SETTING',
                'TARGET_ACCOMPLISHMENT',
                'EVALUATION',
                'COMPLETED'
            ])->default('TARGET_SETTING');
            
            $table->enum('overall_status', [
                'NOT_STARTED',
                'SUBMITTED',
                'UNDER_REVIEW',
                'APPROVED',
                'RETURNED'
            ])->nullable();
            
            // Ratings
            $table->decimal('final_rating', 5, 2)->nullable();
            $table->string('adjectival_rating')->nullable();
            
            // Targets period
            $table->enum('targets_period', ['MIDYEAR', 'YEAR_END'])->default('MIDYEAR');
            
            // Special flags
            $table->boolean('is_dean_ipcr')->default(false);
            $table->boolean('external_vpaa_flag')->default(false);
            
            // Approval workflow
            $table->foreignId('noted_by_chair_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by_dean_id')->nullable()->constrained('users')->onDelete('set null');
            $table->boolean('verified_by_vpaa')->default(false);
            
            // Timestamps for workflow
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('submitted_to_vpaa_at')->nullable();
            $table->timestamp('dean_approved_at')->nullable();
            $table->timestamp('chair_noted_at')->nullable();
            $table->timestamp('vpaa_verified_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('user_id');
            $table->index('opcr_id');
            $table->index('status');
            $table->index('current_phase');
            $table->index(['user_id', 'period', 'year']);
            $table->index(['year', 'period']);
            $table->index('is_dean_ipcr');
            
            // Ensure one IPCR per user per period
            $table->unique(['user_id', 'period', 'year'], 'unique_user_period_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ipcrs');
    }
};
