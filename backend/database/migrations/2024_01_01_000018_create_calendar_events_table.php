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
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('event_type', [
                'DEADLINE',
                'MEETING',
                'TRAINING',
                'SUBMISSION',
                'EVALUATION',
                'HOLIDAY',
                'OTHER'
            ])->default('OTHER');
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->boolean('is_all_day')->default(false);
            $table->string('location')->nullable();
            $table->enum('status', ['SCHEDULED', 'COMPLETED', 'CANCELLED'])->default('SCHEDULED');
            $table->enum('visibility', ['PUBLIC', 'PRIVATE', 'DEPARTMENT'])->default('PUBLIC');
            $table->string('color')->nullable();
            $table->foreignId('related_ipcr_id')->nullable()->constrained('ipcrs')->onDelete('cascade');
            $table->foreignId('related_target_id')->nullable()->constrained('targets')->onDelete('cascade');
            $table->boolean('send_reminder')->default(true);
            $table->integer('reminder_minutes_before')->default(60);
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('event_type');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('status');
            $table->index('visibility');
            $table->index(['user_id', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};
