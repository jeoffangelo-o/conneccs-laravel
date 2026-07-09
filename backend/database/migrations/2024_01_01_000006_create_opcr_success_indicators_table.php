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
        Schema::create('opcr_success_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opcr_major_function_id')->constrained()->onDelete('cascade');
            $table->string('code')->unique(); // e.g., "1.1.1"
            $table->text('description');
            $table->text('measures');
            $table->string('target_value');
            $table->text('accountable_units'); // Comma-separated or JSON
            $table->integer('order')->default(0);
            $table->enum('kra_category', ['KRA1', 'KRA2', 'KRA3', 'KRA4', 'STRATEGIC', 'SUPPORT'])->nullable();
            $table->json('required_ratings')->nullable(); // ['Q', 'E', 'T']
            $table->timestamps();
            
            // Indexes
            $table->index('opcr_major_function_id');
            $table->index('code');
            $table->index('kra_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opcr_success_indicators');
    }
};
