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
        Schema::create('reportorial_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reportorial_requirement_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->json('allowed_file_types')->nullable(); // ['pdf', 'docx', 'xlsx']
            $table->integer('max_file_size')->nullable()->comment('Max file size in KB');
            $table->boolean('is_required')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('reportorial_requirement_id');
            $table->index('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportorial_folders');
    }
};
