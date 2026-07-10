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
                'email' => 'dean@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'DEAN',
                'department' => 'Computer Science',
                'position' => 'Dean',
                'employee_id' => 'EMP001',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            
            // Secretary
            [
                'name' => 'Ms. Secretary Admin',
                'email' => 'secretary@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'SECRETARY',
                'department' => 'Computer Science',
                'position' => 'Department Secretary',
                'employee_id' => 'EMP002',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Chairpersons
            [
                'name' => 'Dr. Chair Colle',
                'email' => 'chair.colle@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'CHAIR',
                'department' => 'Computer Science',
                'position' => 'Department Chair',
                'employee_id' => 'EMP003',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. Chair Benitez',
                'email' => 'chair.benitez@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'CHAIR',
                'department' => 'Information Technology',
                'position' => 'Department Chair',
                'employee_id' => 'EMP004',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Faculty Members
            [
                'name' => 'Dr. John Benosa',
                'email' => 'john.benosa@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Professor',
                'employee_id' => 'EMP005',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Maria Colle',
                'email' => 'maria.colle@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Associate Professor',
                'employee_id' => 'EMP006',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Mark Omorog',
                'email' => 'mark.omorog@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Assistant Professor',
                'employee_id' => 'EMP007',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. Ana Pandes',
                'email' => 'ana.pandes@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Professor',
                'employee_id' => 'EMP008',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Luis Mortel',
                'email' => 'luis.mortel@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Instructor',
                'employee_id' => 'EMP009',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Sarah Prianes',
                'email' => 'sarah.prianes@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Instructor',
                'employee_id' => 'EMP010',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. Robert Onate',
                'email' => 'robert.onate@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Associate Professor',
                'employee_id' => 'EMP011',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Jennifer Serrano',
                'email' => 'jennifer.serrano@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Assistant Professor',
                'employee_id' => 'EMP012',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Michael Bagaporo',
                'email' => 'michael.bagaporo@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Instructor',
                'employee_id' => 'EMP013',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Karen Fortuno',
                'email' => 'karen.fortuno@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Instructor',
                'employee_id' => 'EMP014',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dr. David Prades',
                'email' => 'david.prades@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Professor',
                'employee_id' => 'EMP015',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Prof. Emma Lipata',
                'email' => 'emma.lipata@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'FACULTY',
                'department' => 'Information Technology',
                'position' => 'Associate Professor',
                'employee_id' => 'EMP016',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Coordinator
            [
                'name' => 'Dr. Coordinator Santos',
                'email' => 'coordinator@ccs.edu',
                'password' => Hash::make('password123'),
                'role' => 'COORDINATOR',
                'department' => 'Computer Science',
                'position' => 'Program Coordinator',
                'employee_id' => 'EMP017',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // Test User (for easy login)
            [
                'name' => 'Test User',
                'email' => 'test@ccs.edu',
                'password' => Hash::make('password'),
                'role' => 'FACULTY',
                'department' => 'Computer Science',
                'position' => 'Instructor',
                'employee_id' => 'EMP999',
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
