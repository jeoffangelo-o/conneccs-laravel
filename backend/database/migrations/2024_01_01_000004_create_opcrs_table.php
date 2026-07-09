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
        Schema::create('opcrs', function (Blueprint $table) {
            $table->id();
            $table->string('college_name');
            $table->string('year', 10);
            $table->enum('period', ['MIDYEAR', 'YEAR_END'])->default('MIDYEAR');
            $table->enum('status', ['DRAFT', 'ACTIVE', 'ARCHIVED'])->default('DRAFT');
            $table->date('target_submission_deadline')->nullable();
            $table->date('accomplishment_submission_deadline')->nullable();
            $table->json('settings')->nullable(); // Additional OPCR settings
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['year', 'period']);
            $table->index('status');
            $table->unique(['college_name', 'year', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opcrs');
    }
};
