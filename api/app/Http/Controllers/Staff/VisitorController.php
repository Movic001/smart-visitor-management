<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    // Display visitors with optional search and status filtering.
    public function index(Request $request): JsonResponse
    {
        $query = Visitor::query()
            ->withCount('visits')
            ->latest();

        // Search by visitor name, phone, visitor code, or company.
        if ($request->filled('search')) {
            $search = $request->string('search')->trim();

            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('visitor_code', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        // Filter visitors by their current status.
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        // Return visitors in pages of 20 records.
        $visitors = $query->paginate(20);

        return response()->json($visitors);
    }

    // Display one visitor.
    public function show(Visitor $visitor): JsonResponse
    {
        $visitor->loadCount('visits');

        return response()->json([
            'data' => $visitor,
        ]);
    }

    // Display all previous visits for a visitor.
    public function visits(Visitor $visitor): JsonResponse
    {
        $visits = $visitor->visits()
            ->with('department')
            ->latest('visit_date')
            ->latest('visit_time')
            ->get();

        return response()->json([
            'data' => $visits,
        ]);
    }
}