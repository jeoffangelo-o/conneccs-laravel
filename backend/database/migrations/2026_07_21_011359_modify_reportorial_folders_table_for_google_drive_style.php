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
        Schema::table('reportorial_folders', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['reportorial_requirement_id']);
            
            // Drop old columns
            $table->dropColumn([
                'reportorial_requirement_id',
                'allowed_file_types',
                'max_file_size',
                'is_required',
                'deleted_at'
            ]);
            
            // Add new columns for Google Drive style
            $table->string('icon')->default('fileText')->after('name');
            $table->string('color')->default('#f4c430')->after('icon');
            $table->boolean('is_active')->default(true)->after('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reportorial_folders', function (Blueprint $table) {
            // Remove new columns
            $table->dropColumn(['icon', 'color', 'is_active']);
            
            // Restore old columns
            $table->foreignId('reportorial_requirement_id')->constrained()->onDelete('cascade');
            $table->json('allowed_file_types')->nullable();
            $table->integer('max_file_size')->nullable();
            $table->boolean('is_required')->default(true);
            $table->softDeletes();
        });
    }
};
