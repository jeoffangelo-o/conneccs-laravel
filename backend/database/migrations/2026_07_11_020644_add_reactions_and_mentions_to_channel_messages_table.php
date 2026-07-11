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
        Schema::table('channel_messages', function (Blueprint $table) {
            // Add mentioned_users column to store user IDs of mentioned users
            $table->json('mentioned_users')->nullable()->after('attachments');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('channel_messages', function (Blueprint $table) {
            $table->dropColumn('mentioned_users');
        });
    }
};
