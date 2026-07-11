<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // Clear existing users (optional - comment out if you want to keep existing users)
        // DB::table('users')->truncate();

        $users = [
            // Admin/Dean
            [
                'name' => 'Dr. Dean Onesa',
                'first_name' => 'Dean',
                'last_name' => 'Onesa',
                'email' => 'dean.onesa@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'DEAN',
                'department' => 'Computer Science',
                'position' => 'Dean',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Secretary
            [
                'name' => 'Ms. Secretary Admin',
                'first_name' => 'Secretary',
                'last_name' => 'Admin',
                'email' => 'secretary.admin@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'SECRETARY',
                'department' => 'Computer Science',
                'position' => 'Department Secretary',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Chairpersons
            [
                'name' => 'Dr. Chair Colle',
                'first_name' => 'Chair',
                'last_name' => 'Colle',
                'email' => 'chair.colle@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'CHAIR',
                'department' => 'Computer Science',
                'position' => 'Department Chair',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. Chair Benitez',
                'first_name' => 'Chair',
                'last_name' => 'Benitez',
                'email' => 'chair.benitez@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'CHAIR',
                'department' => 'Information Technology',
                'position' => 'Department Chair',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Faculty Members (using @cspc.edu.ph for faculty/staff)
            [
                'name' => 'Dr. John Benosa',
                'first_name' => 'John',
                'last_name' => 'Benosa',
                'email' => 'john.benosa@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Maria Colle',
                'first_name' => 'Maria',
                'last_name' => 'Colle',
                'email' => 'maria.colle@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Associate Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Mark Omorog',
                'first_name' => 'Mark',
                'last_name' => 'Omorog',
                'email' => 'mark.omorog@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Assistant Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. Ana Pandes',
                'first_name' => 'Ana',
                'last_name' => 'Pandes',
                'email' => 'ana.pandes@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Luis Mortel',
                'first_name' => 'Luis',
                'last_name' => 'Mortel',
                'email' => 'luis.mortel@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Instructor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Sarah Prianes',
                'first_name' => 'Sarah',
                'last_name' => 'Prianes',
                'email' => 'sarah.prianes@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Instructor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. Robert Onate',
                'first_name' => 'Robert',
                'last_name' => 'Onate',
                'email' => 'robert.onate@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Associate Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Jennifer Serrano',
                'first_name' => 'Jennifer',
                'last_name' => 'Serrano',
                'email' => 'jennifer.serrano@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Assistant Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Michael Bagaporo',
                'first_name' => 'Michael',
                'last_name' => 'Bagaporo',
                'email' => 'michael.bagaporo@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Instructor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Karen Fortuno',
                'first_name' => 'Karen',
                'last_name' => 'Fortuno',
                'email' => 'karen.fortuno@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Instructor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. David Prades',
                'first_name' => 'David',
                'last_name' => 'Prades',
                'email' => 'david.prades@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Emma Lipata',
                'first_name' => 'Emma',
                'last_name' => 'Lipata',
                'email' => 'emma.lipata@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Associate Professor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Coordinator
            [
                'name' => 'Dr. Coordinator Santos',
                'first_name' => 'Coordinator',
                'last_name' => 'Santos',
                'email' => 'coordinator.santos@cspc.edu.ph',
                'password' => Hash::make('password123'),
                'role' => 'COORDINATOR',
                'department' => 'Computer Science',
                'position' => 'Program Coordinator',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Test User (using @my.cspc.edu.ph for student-like accounts)
            [
                'name' => 'Test User',
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test.user@my.cspc.edu.ph',
                'password' => Hash::make('password'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Instructor',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // Insert all users
        foreach ($users as $user) {
            DB::table('users')->insert($user);
        }

        $this->command->info('✅ Created ' . count($users) . ' test users');
        $this->command->info('');
        $this->command->info('📧 Test Accounts (All passwords: password123):');
        $this->command->info('   Dean:        dean.onesa@cspc.edu.ph');
        $this->command->info('   Secretary:   secretary.admin@cspc.edu.ph');
        $this->command->info('   Chair:       chair.colle@cspc.edu.ph');
        $this->command->info('   Faculty:     john.benosa@cspc.edu.ph');
        $this->command->info('   Test User:   test.user@my.cspc.edu.ph (password: password)');
        $this->command->info('');
        $this->command->info('💡 All accounts use @cspc.edu.ph or @my.cspc.edu.ph domains');
    }
}
