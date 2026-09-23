<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // Display dashboard data for the authenticated Staff.
    public function index(Request $request): JsonResponse
    {
        $staffId = $request->user()->id;

        // Count all visits scheduled for today.
        $todayVisits = Visit::query()
            ->where('staff_id', $staffId)
            ->whereDate('visit_date', today());

        // Count pending visit requests.
        $pendingRequests = Visit::query()
            ->where('staff_id', $staffId)
            ->where('status', 'Pending')
            ->count();

        // Count visitors currently inside.
        $activeVisitors = Visit::query()
            ->where('staff_id', $staffId)
            ->where('status', 'Checked-In')
            ->count();

        // Count visits completed today.
        $completedToday = Visit::query()
            ->where('staff_id', $staffId)
            ->whereDate('visit_date', today())
            ->where('status', 'Completed')
            ->count();

        // Count today's visits that have checked in.
        $checkedInToday = Visit::query()
            ->where('staff_id', $staffId)
            ->whereDate('visit_date', today())
            ->whereNotNull('check_in_at')
            ->count();

        // Get the latest five visit requests for this Staff.
        $recentVisits = Visit::query()
            ->where('staff_id', $staffId)
            ->with([
                'visitor',
                'department',
            ])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'stats' => [
                    'today_visits' => $todayVisits->count(),
                    'pending_requests' => $pendingRequests,
                    'active_visitors' => $activeVisitors,
                    'completed_today' => $completedToday,
                ],

                'today_summary' => [
                    'expected' => $todayVisits->count(),
                    'checked_in' => $checkedInToday,
                    'currently_inside' => $activeVisitors,
                ],

                'recent_visits' => $recentVisits,
            ],
        ]);
    }
}