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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('name');
            $table->string('first_name')->nullable();
            $table->string('last_name');
            $table->enum('role', [
                'FACULTY',
                'SECRETARY',
                'COORDINATOR',
                'DEAN',
                'CHAIR',
                'VPAA',
                'ADMIN'
            ])->default('FACULTY');
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->enum('coordinator_type', ['RESEARCH', 'EXTENSION'])->nullable();
            $table->boolean('is_active')->default(true);
            $table->string('avatar_url')->nullable();
            $table->string('phone')->nullable();
            $table->text('bio')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('profile_picture')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('email');
            $table->index('role');
            $table->index('department');
            $table->index('is_active');
            $table->index(['role', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
