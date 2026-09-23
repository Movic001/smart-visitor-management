<?php

namespace App\Http\Controllers\Security;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    /**
     * Security dashboard.
     */
    public function dashboard(): JsonResponse
    {
        $todayVisits = Visit::query()
            ->whereDate('visit_date', today());

        $checkedInToday = Visit::query()
            ->whereDate('visit_date', today())
            ->whereNotNull('check_in_at')
            ->count();

        $activeVisitors = Visit::query()
            ->where('status', 'Checked-In')
            ->count();

        $completedToday = Visit::query()
            ->whereDate('visit_date', today())
            ->where('status', 'Completed')
            ->count();

        $recentVisits = Visit::query()
            ->whereDate('visit_date', today())
            ->with([
                'visitor',
                'department',
                'staff',
                'checkedInBy',
                'checkedOutBy',
            ])
            ->latest('visit_time')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'stats' => [
                    'today_visits' => $todayVisits->count(),
                    'checked_in_today' => $checkedInToday,
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

    /**
     * Display all visitors with their visit history.
     */
    public function index(): JsonResponse
    {
        $visitors = Visitor::query()
            ->with([
                'visits' => function ($query) {
                    $query
                        ->with([
                            'staff:id,name',
                            'department:id,name',
                            'checkedInBy:id,name',
                            'checkedOutBy:id,name',
                        ])
                        ->orderByDesc('visit_date')
                        ->orderByDesc('visit_time');
                },
            ])
            ->latest('created_at')
            ->get();

        $totalVisitors = $visitors->count();

        $totalVisits = $visitors->sum(function ($visitor) {
            return $visitor->visits->count();
        });

        $currentlyInside = $visitors->sum(function ($visitor) {
            return $visitor->visits
                ->where('status', 'Checked-In')
                ->count();
        });

        $completedVisits = $visitors->sum(function ($visitor) {
            return $visitor->visits
                ->where('status', 'Completed')
                ->count();
        });

        return response()->json([
            'data' => $visitors,

            'stats' => [
                'total_visitors' => $totalVisitors,
                'total_visits' => $totalVisits,
                'currently_inside' => $currentlyInside,
                'completed_visits' => $completedVisits,
            ],
        ]);
    }

    /**
     * Search for a visitor.
     *
     * Security can search by:
     * - Name
     * - Phone
     * - Visitor code
     * - Company
     */
    public function searchVisitor(Request $request): JsonResponse
    {
        $request->validate([
            'search' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $search = trim(
            $request->string('search')->toString()
        );

        $visitor = Visitor::query()
            ->where(function ($query) use ($search) {
                $query
                    ->where(
                        'full_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'visitor_code',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'company_name',
                        'like',
                        "%{$search}%"
                    );
            })
            ->first();

        if (!$visitor) {
            return response()->json([
                'found' => false,
                'message' => 'Visitor not found.',
            ], 404);
        }

        $visits = $visitor->visits()
            ->with([
                'department',
                'staff',
                'checkedInBy',
                'checkedOutBy',
            ])
            ->orderByDesc('visit_date')
            ->orderByDesc('visit_time')
            ->get();

        /*
         * Find this visitor's visit scheduled for today.
         *
         * There is no approval workflow.
         * A Pending visit created by Staff is immediately
         * available to Security for today's check-in.
         */
        $todayVisit = $visits->first(function ($visit) {
            return $visit->visit_date->toDateString()
                === today()->toDateString();
        });

        return response()->json([
            'found' => true,

            'visitor' => [
                'id' => $visitor->id,
                'visitor_code' => $visitor->visitor_code,
                'full_name' => $visitor->full_name,
                'phone' => $visitor->phone,
                'email' => $visitor->email,
                'company_name' => $visitor->company_name,
                'photo' => $visitor->photo,
                'status' => $visitor->status,
            ],

            'today_visit' => $todayVisit,

            'visits' => $visits,
        ]);
    }

    /**
     * Check a visitor in.
     *
     * V1 workflow:
     *
     * Pending -> Checked-In
     *
     * Security does not approve the visit.
     */
    public function checkIn(
        Request $request,
        Visit $visit
    ): JsonResponse {
        /*
         * A visit must still be Pending.
         */
        if ($visit->status !== 'Pending') {
            return response()->json([
                'message' =>
                    'Only pending visits can be checked in.',
            ], 422);
        }

        /*
         * Security can only check in visitors
         * whose visit is scheduled for today.
         */
        if (
            $visit->visit_date->toDateString()
            !== today()->toDateString()
        ) {
            return response()->json([
                'message' =>
                    'Only visits scheduled for today can be checked in.',
            ], 422);
        }

        /*
         * Prevent duplicate check-in.
         */
        if ($visit->check_in_at) {
            return response()->json([
                'message' =>
                    'This visitor has already been checked in.',
            ], 422);
        }

        /*
         * The authenticated Security user is recorded
         * automatically by the backend.
         *
         * React does NOT send the Security user ID.
         */
        $visit->update([
            'status' => 'Checked-In',
            'check_in_at' => now(),
            'checked_in_by' => $request->user()->id,
        ]);

        $visit->load([
            'visitor',
            'department',
            'staff',
            'checkedInBy',
            'checkedOutBy',
        ]);

        return response()->json([
            'message' =>
                'Visitor checked in successfully.',

            'data' => $visit,
        ]);
    }

    /**
     * Check a visitor out.
     *
     * V1 workflow:
     *
     * Checked-In -> Completed
     */
    public function checkOut(
        Request $request,
        Visit $visit
    ): JsonResponse {
        /*
         * Only visitors currently inside can be checked out.
         */
        if ($visit->status !== 'Checked-In') {
            return response()->json([
                'message' =>
                    'Only checked-in visitors can be checked out.',
            ], 422);
        }

        /*
         * Prevent duplicate check-out.
         */
        if ($visit->check_out_at) {
            return response()->json([
                'message' =>
                    'This visitor has already been checked out.',
            ], 422);
        }

        /*
         * Record the authenticated Security user.
         */
        $visit->update([
            'status' => 'Completed',
            'check_out_at' => now(),
            'checked_out_by' => $request->user()->id,
        ]);

        $visit->load([
            'visitor',
            'department',
            'staff',
            'checkedInBy',
            'checkedOutBy',
        ]);

        /*
         * After checkout, the visitor profile becomes inactive.
         *
         * The visitor record itself is NOT deleted.
         * Future visits can still reuse this visitor.
         */
        $visit->visitor->update([
            'status' => 'Inactive',
        ]);

        return response()->json([
            'message' =>
                'Visitor checked out successfully.',

            'data' => $visit,
        ]);
    }
}