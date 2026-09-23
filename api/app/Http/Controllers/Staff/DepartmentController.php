<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    /**
     * Return all active departments available for visit requests.
     */
    public function index(): JsonResponse
    {
        $departments = Department::query()
            ->where('status', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'description',
            ]);

        return response()->json([
            'data' => $departments,
        ]);
    }
}
