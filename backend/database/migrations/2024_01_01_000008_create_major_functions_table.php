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
        Schema::create('major_functions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ipcr_id')->constrained()->onDelete('cascade');
            $table->foreignId('opcr_major_function_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->enum('category', ['CORE', 'STRATEGIC', 'SUPPORT'])->default('CORE');
            $table->decimal('weight', 5, 2)->default(0);
            $table->integer('order')->default(0);
            $table->text('description')->nullable();
            $table->decimal('subtotal_rating', 5, 2)->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('ipcr_id');
            $table->index('category');
            $table->index(['ipcr_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('major_functions');
    }
};
