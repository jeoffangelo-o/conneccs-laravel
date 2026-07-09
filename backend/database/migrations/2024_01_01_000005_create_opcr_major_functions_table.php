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
        Schema::create('opcr_major_functions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opcr_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->enum('category', ['CORE', 'STRATEGIC', 'SUPPORT'])->default('CORE');
            $table->decimal('weight', 5, 2)->default(0);
            $table->integer('order')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('opcr_id');
            $table->index(['opcr_id', 'category']);
            $table->index('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opcr_major_functions');
    }
};
