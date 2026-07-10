<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ChannelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // Create General Channel for CCS Department
        $generalChannelId = DB::table('channels')->insertGetId([
            'name' => 'General',
            'description' => 'General discussions for all CCS faculty and staff',
            'type' => 'GENERAL',
            'icon' => 'people',
            'color' => '#f4c430',
            'is_private' => false,
            'created_by' => 1, // Assuming admin user ID is 1
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Create CCS Department Channel
        $departmentChannelId = DB::table('channels')->insertGetId([
            'name' => 'CCS Department',
            'description' => 'Official channel for College of Computer Studies department matters',
            'type' => 'DEPARTMENT',
            'icon' => 'briefcase',
            'color' => '#8B4513',
            'is_private' => false,
            'created_by' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Create Announcements Channel
        $announcementsChannelId = DB::table('channels')->insertGetId([
            'name' => 'Announcements',
            'description' => 'Important announcements and updates from administration',
            'type' => 'ANNOUNCEMENT',
            'icon' => 'megaphone',
            'color' => '#ef4444',
            'is_private' => false,
            'created_by' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Get all users from CCS department
        $ccsUsers = DB::table('users')
            ->whereNotNull('id')
            ->get();

        // Add all CCS users as members to all channels
        $channelMembers = [];
        foreach ($ccsUsers as $user) {
            // General channel
            $channelMembers[] = [
                'channel_id' => $generalChannelId,
                'user_id' => $user->id,
                'role' => $user->id == 1 ? 'ADMIN' : 'MEMBER', // First user is admin
                'last_read_at' => $now,
                'is_muted' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Department channel
            $channelMembers[] = [
                'channel_id' => $departmentChannelId,
                'user_id' => $user->id,
                'role' => $user->id == 1 ? 'ADMIN' : 'MEMBER',
                'last_read_at' => $now,
                'is_muted' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            // Announcements channel
            $channelMembers[] = [
                'channel_id' => $announcementsChannelId,
                'user_id' => $user->id,
                'role' => $user->id == 1 ? 'ADMIN' : 'MEMBER',
                'last_read_at' => $now,
                'is_muted' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('channel_members')->insert($channelMembers);

        // Add some sample messages to General channel
        $sampleMessages = [
            [
                'channel_id' => $generalChannelId,
                'user_id' => 1,
                'content' => 'Welcome to the CCS General channel! This is where we can have casual discussions.',
                'attachments' => null,
                'is_pinned' => true,
                'is_edited' => false,
                'edited_at' => null,
                'created_at' => $now->copy()->subHours(24),
                'updated_at' => $now->copy()->subHours(24),
            ],
            [
                'channel_id' => $generalChannelId,
                'user_id' => 2,
                'content' => 'Good morning everyone! Looking forward to collaborating with all of you.',
                'attachments' => null,
                'is_pinned' => false,
                'is_edited' => false,
                'edited_at' => null,
                'created_at' => $now->copy()->subHours(12),
                'updated_at' => $now->copy()->subHours(12),
            ],
            [
                'channel_id' => $generalChannelId,
                'user_id' => 3,
                'content' => 'Has anyone finished their IPCR targets for this semester?',
                'attachments' => null,
                'is_pinned' => false,
                'is_edited' => false,
                'edited_at' => null,
                'created_at' => $now->copy()->subHours(6),
                'updated_at' => $now->copy()->subHours(6),
            ],
        ];

        DB::table('channel_messages')->insert($sampleMessages);

        // Add sample messages to Department channel
        $departmentMessages = [
            [
                'channel_id' => $departmentChannelId,
                'user_id' => 1,
                'content' => 'Welcome to the CCS Department official channel. All department-related discussions should happen here.',
                'attachments' => null,
                'is_pinned' => true,
                'is_edited' => false,
                'edited_at' => null,
                'created_at' => $now->copy()->subHours(20),
                'updated_at' => $now->copy()->subHours(20),
            ],
            [
                'channel_id' => $departmentChannelId,
                'user_id' => 1,
                'content' => 'Reminder: Faculty meeting scheduled for next Monday at 2 PM.',
                'attachments' => null,
                'is_pinned' => false,
                'is_edited' => false,
                'edited_at' => null,
                'created_at' => $now->copy()->subHours(4),
                'updated_at' => $now->copy()->subHours(4),
            ],
        ];

        DB::table('channel_messages')->insert($departmentMessages);

        // Add sample announcement
        $announcementMessages = [
            [
                'channel_id' => $announcementsChannelId,
                'user_id' => 1,
                'content' => '📢 Important: IPCR submission deadline is approaching. Please ensure all targets are completed by end of month.',
                'attachments' => null,
                'is_pinned' => true,
                'is_edited' => false,
                'edited_at' => null,
                'created_at' => $now->copy()->subHours(2),
                'updated_at' => $now->copy()->subHours(2),
            ],
        ];

        DB::table('channel_messages')->insert($announcementMessages);

        $this->command->info('✅ Channels created successfully!');
        $this->command->info("   - General channel with {$ccsUsers->count()} members");
        $this->command->info("   - CCS Department channel with {$ccsUsers->count()} members");
        $this->command->info("   - Announcements channel with {$ccsUsers->count()} members");
        $this->command->info('✅ Sample messages added to channels');
    }
}
