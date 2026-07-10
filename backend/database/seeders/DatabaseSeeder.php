<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting database seeding...');
        $this->command->info('');

        // Seed test users first (channels need users to exist)
        $this->call([
            UserSeeder::class,
        ]);

        $this->command->info('');
        
        // Seed channels and channel messages (requires users to exist)
        $this->call([
            ChannelSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('✅ Database seeding completed!');
        $this->command->info('🚀 You can now login with any of the test accounts listed above');
    }
}
