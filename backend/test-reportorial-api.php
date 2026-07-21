<?php

// Test script to verify reportorial API works
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\ReportorialFolder;

echo "===========================================\n";
echo "Testing Reportorial API\n";
echo "===========================================\n\n";

// Check folders in database
$folderCount = ReportorialFolder::count();
echo "1. Folders in database: {$folderCount}\n";

$activeFolders = ReportorialFolder::where('is_active', true)->count();
echo "2. Active folders: {$activeFolders}\n";

// Get first 3 folders
echo "\n3. First 3 folders:\n";
ReportorialFolder::orderBy('order')->limit(3)->get()->each(function($f) {
    echo "   - ID: {$f->id}, Name: {$f->name}, Active: " . ($f->is_active ? 'Yes' : 'No') . "\n";
});

// Test the controller method directly
echo "\n4. Testing controller method:\n";
$controller = new \App\Http\Controllers\Api\ReportorialController();
$response = $controller->getFolders();
$data = json_decode($response->getContent(), true);
echo "   - Success: " . ($data['success'] ? 'Yes' : 'No') . "\n";
echo "   - Folder count returned: " . count($data['data']) . "\n";

if (count($data['data']) > 0) {
    echo "\n5. First folder details:\n";
    $first = $data['data'][0];
    echo "   - ID: {$first['id']}\n";
    echo "   - Name: {$first['name']}\n";
    echo "   - Icon: {$first['icon']}\n";
    echo "   - Color: {$first['color']}\n";
    echo "   - Files Count: {$first['filesCount']}\n";
}

echo "\n===========================================\n";
echo "Test Complete!\n";
echo "===========================================\n";
