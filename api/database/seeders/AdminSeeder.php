<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
        ]);

        $admin = User::firstOrCreate(
            [
                'email' => 'admin@smartvisitor.com',
            ],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('Password@12345'),
            ]
        );

        $admin->assignRole($adminRole);
    }
}