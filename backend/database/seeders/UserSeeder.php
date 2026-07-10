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
                'email' => 'dean@ccs.edu',
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
                'email' => 'secretary@ccs.edu',
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
                'email' => 'chair.colle@ccs.edu',
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
                'email' => 'chair.benitez@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'CHAIR',
                'department' => 'Information Technology',
                'position' => 'Department Chair',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Faculty Members
            [
                'name' => 'Dr. John Benosa',
                'first_name' => 'John',
                'last_name' => 'Benosa',
                'email' => 'john.benosa@ccs.edu',
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
                'email' => 'maria.colle@ccs.edu',
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
                'email' => 'mark.omorog@ccs.edu',
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
                'email' => 'ana.pandes@ccs.edu',
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
                'email' => 'luis.mortel@ccs.edu',
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
                'email' => 'sarah.prianes@ccs.edu',
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
                'email' => 'robert.onate@ccs.edu',
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
                'email' => 'jennifer.serrano@ccs.edu',
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
                'email' => 'michael.bagaporo@ccs.edu',
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
                'email' => 'karen.fortuno@ccs.edu',
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
                'email' => 'david.prades@ccs.edu',
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
                'email' => 'emma.lipata@ccs.edu',
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
                'email' => 'coordinator@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'COORDINATOR',
                'department' => 'Computer Science',
                'position' => 'Program Coordinator',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Test User (for easy login)
            [
                'name' => 'Test User',
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'test@ccs.edu',
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
        $this->command->info('📧 Test Accounts:');
        $this->command->info('   Dean:        dean@ccs.edu / password123');
        $this->command->info('   Secretary:   secretary@ccs.edu / password123');
        $this->command->info('   Chair:       chair.colle@ccs.edu / password123');
        $this->command->info('   Faculty:     john.benosa@ccs.edu / password123');
        $this->command->info('   Test User:   test@ccs.edu / password');
        $this->command->info('');
        $this->command->info('💡 All passwords are: password123 (except Test User: password)');
    }
}
