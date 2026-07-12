<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;

class NotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        // Get some users
        $dean = User::where('email', 'dean.onesa@cspc.edu.ph')->first();
        $secretary = User::where('email', 'secretary.admin@cspc.edu.ph')->first();
        $chair = User::where('email', 'chair.colle@cspc.edu.ph')->first();
        $faculty = User::where('email', 'john.benosa@cspc.edu.ph')->first();

        if (!$dean || !$secretary || !$chair || !$faculty) {
            $this->command->error('Users not found. Please run UserSeeder first.');
            return;
        }

        $notifications = [
            // Faculty notifications
            [
                'user_id' => $faculty->id,
                'type' => 'IPCR_RATED',
                'title' => 'IPCR Rated',
                'message' => 'Dr. Chair Colle has rated your IPCR for Q1 2026.',
                'is_read' => false,
                'action_url' => '/my-ipcr',
                'created_at' => $now->copy()->subMinutes(30),
                'updated_at' => $now->copy()->subMinutes(30),
            ],
            [
                'user_id' => $faculty->id,
                'type' => 'MESSAGE_MENTION',
                'title' => 'You were mentioned',
                'message' => 'Dr. Chair Colle mentioned you in Computer Science Department',
                'is_read' => false,
                'metadata' => json_encode(['channel_id' => 1]),
                'action_url' => '/messages',
                'created_at' => $now->copy()->subHours(2),
                'updated_at' => $now->copy()->subHours(2),
            ],
            [
                'user_id' => $faculty->id,
                'type' => 'TARGET_DEADLINE',
                'title' => 'Target Deadline Approaching',
                'message' => 'Research Publication Target is due in 3 day(s)',
                'is_read' => false,
                'action_url' => '/my-ipcr',
                'created_at' => $now->copy()->subHours(5),
                'updated_at' => $now->copy()->subHours(5),
            ],
            [
                'user_id' => $faculty->id,
                'type' => 'ANNOUNCEMENT_POSTED',
                'title' => 'New Announcement',
                'message' => 'Faculty Meeting Reminder in General Announcements',
                'is_read' => true,
                'read_at' => $now->copy()->subDays(1),
                'action_url' => '/messages',
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(1),
            ],
            [
                'user_id' => $faculty->id,
                'type' => 'REPORTORIAL_DUE',
                'title' => 'Reportorial Requirement Due',
                'message' => 'Monthly Accomplishment Report is due on 2026-07-15',
                'is_read' => true,
                'read_at' => $now->copy()->subDays(3),
                'action_url' => '/reportorial-requirements',
                'created_at' => $now->copy()->subDays(5),
                'updated_at' => $now->copy()->subDays(3),
            ],

            // Chair notifications
            [
                'user_id' => $chair->id,
                'type' => 'IPCR_SUBMITTED',
                'title' => 'IPCR Submitted',
                'message' => 'Prof. Maria Colle has submitted their IPCR for review.',
                'is_read' => false,
                'action_url' => '/review-queue',
                'created_at' => $now->copy()->subMinutes(15),
                'updated_at' => $now->copy()->subMinutes(15),
            ],
            [
                'user_id' => $chair->id,
                'type' => 'IPCR_SUBMITTED',
                'title' => 'IPCR Submitted',
                'message' => 'Dr. John Benosa has submitted their IPCR for review.',
                'is_read' => false,
                'action_url' => '/review-queue',
                'created_at' => $now->copy()->subHours(1),
                'updated_at' => $now->copy()->subHours(1),
            ],
            [
                'user_id' => $chair->id,
                'type' => 'MESSAGE_RECEIVED',
                'title' => 'New Message',
                'message' => 'Dr. Dean Onesa: Please review the new OPCR guidelines',
                'is_read' => true,
                'read_at' => $now->copy()->subHours(3),
                'action_url' => '/messages',
                'created_at' => $now->copy()->subHours(4),
                'updated_at' => $now->copy()->subHours(3),
            ],

            // Dean notifications
            [
                'user_id' => $dean->id,
                'type' => 'IPCR_ENDORSED',
                'title' => 'IPCR Endorsed',
                'message' => 'Dr. Chair Colle has endorsed 5 IPCRs. They are ready for your review.',
                'is_read' => false,
                'action_url' => '/review-queue',
                'created_at' => $now->copy()->subMinutes(45),
                'updated_at' => $now->copy()->subMinutes(45),
            ],
            [
                'user_id' => $dean->id,
                'type' => 'REPORTORIAL_SUBMITTED',
                'title' => 'Reportorial Submitted',
                'message' => 'Computer Science Department has submitted the Monthly Report',
                'is_read' => false,
                'action_url' => '/reportorial-requirements',
                'created_at' => $now->copy()->subHours(2),
                'updated_at' => $now->copy()->subHours(2),
            ],
            [
                'user_id' => $dean->id,
                'type' => 'SYSTEM_ANNOUNCEMENT',
                'title' => 'System Maintenance',
                'message' => 'Scheduled system maintenance on July 15, 2026 from 2:00 AM to 4:00 AM',
                'is_read' => true,
                'read_at' => $now->copy()->subDays(1),
                'created_at' => $now->copy()->subDays(2),
                'updated_at' => $now->copy()->subDays(1),
            ],

            // Secretary notifications
            [
                'user_id' => $secretary->id,
                'type' => 'IPCR_SUBMITTED',
                'title' => 'IPCR Submitted',
                'message' => 'Prof. Mark Omorog has submitted their IPCR.',
                'is_read' => false,
                'action_url' => '/coordinator-queue',
                'created_at' => $now->copy()->subMinutes(20),
                'updated_at' => $now->copy()->subMinutes(20),
            ],
            [
                'user_id' => $secretary->id,
                'type' => 'DOCUMENT_SHARED',
                'title' => 'Document Shared',
                'message' => 'Dr. Dean Onesa shared OPCR 2026 Template',
                'is_read' => false,
                'action_url' => '/documents',
                'created_at' => $now->copy()->subHours(1),
                'updated_at' => $now->copy()->subHours(1),
            ],
            [
                'user_id' => $secretary->id,
                'type' => 'CHANNEL_ADDED',
                'title' => 'Added to Channel',
                'message' => "You've been added to CCS Admin",
                'is_read' => true,
                'read_at' => $now->copy()->subDays(1),
                'metadata' => json_encode(['channel_id' => 2]),
                'action_url' => '/messages',
                'created_at' => $now->copy()->subDays(3),
                'updated_at' => $now->copy()->subDays(1),
            ],
        ];

        foreach ($notifications as $notification) {
            Notification::create($notification);
        }

        $this->command->info('✅ Created ' . count($notifications) . ' sample notifications');
    }
}
