<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ReportorialFolder;

class ReportorialFolderSeeder extends Seeder
{
    public function run(): void
    {
        $folders = [
            ['name' => 'LETTER OF INTENT', 'icon' => 'fileText', 'color' => '#f4c430', 'order' => 1],
            ['name' => 'PERMIT TO TEACH', 'icon' => 'fileText', 'color' => '#88a050', 'order' => 2],
            ['name' => 'WORKLOAD SCHEDULE OF FACULTY', 'icon' => 'calendar', 'color' => '#5b8fc7', 'order' => 3],
            ['name' => 'APPROVED SYLLABUS', 'icon' => 'book', 'color' => '#e89850', 'order' => 4],
            ['name' => 'CLASS MONITORING CHECKLIST', 'icon' => 'checkSquare', 'color' => '#58987f', 'order' => 5],
            ['name' => 'COMPUTATION OF MIDTERM GRADES', 'icon' => 'barChart', 'color' => '#f4d03f', 'order' => 6],
            ['name' => 'LIST OF DROPPED STUDENT', 'icon' => 'userX', 'color' => '#d05050', 'order' => 7],
            ['name' => 'CLASS OBSERVATION', 'icon' => 'eye', 'color' => '#6ba3d8', 'order' => 8],
            ['name' => 'APPROVED TOS W/ Test Question & KEY to correction', 'icon' => 'clipboardCheck', 'color' => '#a8c070', 'order' => 9],
            ['name' => 'APPROVED RUBRIC OF ASSESSMENT W/ ATTACHED PROBLEM/ SAMPLE OUTPUT', 'icon' => 'award', 'color' => '#e6b422', 'order' => 10],
            ['name' => 'SIAS GRADE SHEET', 'icon' => 'fileText', 'color' => '#78b8a0', 'order' => 11],
            ['name' => 'LIST OF TOP TEN', 'icon' => 'trendingUp', 'color' => '#f4c430', 'order' => 12],
            ['name' => 'DELIQUENCY REPORT', 'icon' => 'alertCircle', 'color' => '#e07070', 'order' => 13],
            ['name' => 'DEAN\'S & PRESIDENT LIST', 'icon' => 'star', 'color' => '#f4d03f', 'order' => 14],
            ['name' => 'APPROVED CLASS RECORD', 'icon' => 'book', 'color' => '#88a050', 'order' => 15],
        ];

        foreach ($folders as $folder) {
            ReportorialFolder::updateOrCreate(
                ['name' => $folder['name']],
                $folder
            );
        }

        $this->command->info('Reportorial folders seeded successfully!');
    }
}
