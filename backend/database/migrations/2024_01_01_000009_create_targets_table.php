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
        Schema::create('targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('major_function_id')->constrained()->onDelete('cascade');
            $table->foreignId('opcr_success_indicator_id')->nullable()->constrained()->onDelete('set null');
            $table->string('code');
            $table->text('description');
            $table->text('measures');
            $table->string('target_value');
            
            // Status and workflow
            $table->enum('status', [
                'DRAFT',
                'SUBMITTED',
                'ENDORSED',
                'RATED',
                'APPROVED',
                'APPROVED_OVERRIDE',
                'INCOMPLETE',
                'RETURNED'
            ])->default('DRAFT');
            
            $table->enum('kra_type', [
                'KRA1',
                'KRA2',
                'KRA3',
                'KRA4',
                'STRATEGIC',
                'SUPPORT'
            ])->nullable();
            
            $table->json('required_ratings')->nullable(); // ['Q', 'E', 'T']
            
            // Faculty self-assessment
            $table->text('actual_accomplishments')->nullable();
            $table->string('actual_value')->nullable();
            $table->integer('self_rating_q')->nullable()->comment('1-5 scale');
            $table->integer('self_rating_e')->nullable()->comment('1-5 scale');
            $table->integer('self_rating_t')->nullable()->comment('1-5 scale');
            $table->decimal('self_rating_avg', 5, 2)->nullable();
            $table->json('mov_file_urls')->nullable(); // Array of file URLs
            
            // Coordinator verification (for KRA2/KRA3)
            $table->text('coordinator_note')->nullable();
            $table->foreignId('coordinator_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('coordinator_verified_at')->nullable();
            
            // Secretary rating
            $table->integer('secretary_q')->nullable()->comment('1-5 scale');
            $table->integer('secretary_e')->nullable()->comment('1-5 scale');
            $table->integer('secretary_t')->nullable()->comment('1-5 scale');
            $table->decimal('secretary_rating_avg', 5, 2)->nullable();
            $table->foreignId('secretary_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('secretary_rated_at')->nullable();
            
            // Dean rating (override)
            $table->integer('dean_q')->nullable()->comment('1-5 scale');
            $table->integer('dean_e')->nullable()->comment('1-5 scale');
            $table->integer('dean_t')->nullable()->comment('1-5 scale');
            $table->decimal('dean_rating_avg', 5, 2)->nullable();
            $table->text('dean_remarks')->nullable();
            $table->foreignId('dean_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('dean_reviewed_at')->nullable();
            
            // Official rating (locked after approval)
            $table->integer('official_q')->nullable()->comment('Final Q rating');
            $table->integer('official_e')->nullable()->comment('Final E rating');
            $table->integer('official_t')->nullable()->comment('Final T rating');
            $table->decimal('official_rating_avg', 5, 2)->nullable();
            
            // Return/rejection notes
            $table->text('return_note')->nullable();
            $table->enum('returned_by', ['COORDINATOR', 'SECRETARY', 'DEAN'])->nullable();
            $table->text('incomplete_note')->nullable();
            
            // Submission tracking
            $table->timestamp('submitted_at')->nullable();
            $table->boolean('is_late')->default(false);
            
            // Order within major function
            $table->integer('order')->default(0);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('major_function_id');
            $table->index('opcr_success_indicator_id');
            $table->index('status');
            $table->index('kra_type');
            $table->index(['major_function_id', 'status']);
            $table->index(['kra_type', 'status']);
            $table->index('coordinator_id');
            $table->index('secretary_id');
            $table->index('dean_id');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('targets');
    }
};
