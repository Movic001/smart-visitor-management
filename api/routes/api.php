<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Security\SecurityController;
use App\Http\Controllers\Staff\DashboardController;
use App\Http\Controllers\Staff\DepartmentController;
use App\Http\Controllers\Staff\VisitController;
use App\Http\Controllers\Staff\VisitorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// ==================== AUTHENTICATION ====================

// Login a Staff or Security user.
Route::post('/login', [AuthenticatedSessionController::class, 'store']);


// Logout the currently authenticated user.
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum');


// Return the currently authenticated user with their role.
Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    $user = $request->user();

    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->getRoleNames()->first(),
    ]);
});


// ==================== STAFF API ====================

// Only users with the Staff role can access these routes.
Route::middleware(['auth:sanctum', 'role:Staff'])
    ->prefix('staff')
    ->group(function () {

        // Get dashboard data for the authenticated Staff.
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Get active departments.
        Route::get('/departments', [DepartmentController::class, 'index']);

        // Visitor routes.
        Route::get('/visitors', [VisitorController::class, 'index']);
        Route::post('/visitors', [VisitorController::class, 'store']);
        Route::get('/visitors/{visitor}', [VisitorController::class, 'show']);
        Route::get('/visitors/{visitor}/visits', [VisitorController::class, 'visits']);

        // Create a new visit request.
        Route::post('/visits', [VisitController::class, 'store']);

        // Get visit history for the authenticated Staff.
        Route::get('/visits', [VisitController::class, 'index']);
    });

                // SECURITY API

// Only users with the Security role can access these routes.
Route::middleware(['auth:sanctum', 'role:Security'])
    ->prefix('security')
    ->group(function () {

        // Get dashboard data for Security.
        Route::get('/dashboard', [SecurityController::class, 'dashboard']);

        // Get all visitors and their visit information.
        Route::get('/visitors', [SecurityController::class, 'index']);

        // Search and verify a visitor.
        Route::get('/visitors/search', [SecurityController::class, 'searchVisitor']);

        // Check a visitor in.
        Route::post(
            '/visits/{visit}/check-in',
            [SecurityController::class, 'checkIn']
        );

        // Check a visitor out.
        Route::post(
            '/visits/{visit}/check-out',
            [SecurityController::class, 'checkOut']
        );
    });