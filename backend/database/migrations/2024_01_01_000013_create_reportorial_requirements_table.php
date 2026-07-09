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
        Schema::create('reportorial_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('frequency', ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMESTRAL', 'ANNUAL', 'ONE_TIME'])->default('MONTHLY');
            $table->date('due_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'ARCHIVED'])->default('ACTIVE');
            $table->enum('target_role', ['ALL', 'FACULTY', 'SECRETARY', 'COORDINATOR', 'DEAN', 'CHAIR'])->default('ALL');
            $table->string('target_department')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->json('settings')->nullable(); // Additional settings
            $table->integer('reminder_days_before')->default(3);
            $table->boolean('auto_reminder')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('status');
            $table->index('due_date');
            $table->index('target_role');
            $table->index('target_department');
            $table->index(['status', 'due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportorial_requirements');
    }
};
