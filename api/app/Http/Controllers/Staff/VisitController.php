<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class VisitController extends Controller
{
    // Display visit history for the currently authenticated Staff.
    public function index(Request $request): JsonResponse
    {
        // Get only visits created by the logged-in Staff.
        $visits = Visit::query()
            ->where('staff_id', $request->user()->id)
            ->with([
                'visitor',
                'department',
            ])
            ->latest('visit_date')
            ->latest('visit_time')
            ->get();

        return response()->json([
            'data' => $visits,
        ]);
    }

    // Create a new visit request.
    //
    // This handles both workflows:
    //
    // 1. Existing visitor:
    //    The request contains visitor_id.
    //
    // 2. New visitor:
    //    The request contains visitor details.
    //    The visitor is created first, then the visit is created.
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Existing visitor.
            'visitor_id' => [
                'nullable',
                'integer',
                'exists:visitors,id',
                'required_without:full_name',
            ],

            // New visitor details.
            'full_name' => [
                'nullable',
                'required_without:visitor_id',
                'string',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'required_without:visitor_id',
                'string',
                'max:20',
                'unique:visitors,phone',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'company_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'photo' => [
                'nullable',
                'image',
                'max:5120',
            ],

            // Visit details.
            'department_id' => [
                'required',
                'integer',
                Rule::exists('departments', 'id')
                    ->where(fn ($query) => $query->where('status', true)),
            ],

            'host_name' => [
                'required',
                'string',
                'max:255',
            ],

            'purpose' => [
                'required',
                'string',
                'max:1000',
            ],

            'visit_date' => [
                'required',
                'date',
                'after_or_equal:today',
            ],

            'visit_time' => [
                'required',
                'date_format:H:i',
            ],
        ]);

        // Create the visitor and visit inside one database transaction.
        $visit = DB::transaction(function () use ($request, $validated) {

            // Use the existing visitor when visitor_id was provided.
            if (!empty($validated['visitor_id'])) {
                $visitor = Visitor::findOrFail(
                    $validated['visitor_id']
                );
            }

            // Create a new visitor when visitor_id was not provided.
            else {
                $visitorCode = $this->generateVisitorCode();

                $photoPath = null;

                // Save the visitor photo if one was uploaded.
                if ($request->hasFile('photo')) {
                    $photoPath = $request
                        ->file('photo')
                        ->store('visitors', 'public');
                }

                // Create the visitor record.
                $visitor = Visitor::create([
                    'visitor_code' => $visitorCode,
                    'full_name' => $validated['full_name'],
                    'phone' => $validated['phone'],
                    'email' => $validated['email'] ?? null,
                    'company_name' => $validated['company_name'] ?? null,
                    'photo' => $photoPath,
                    'status' => 'Inactive',
                    'created_by' => $request->user()->id,
                ]);
            }

            // Create the visit request.
            return Visit::create([
                'visitor_id' => $visitor->id,
                'staff_id' => $request->user()->id,
                'department_id' => $validated['department_id'],
                'host_name' => $validated['host_name'],
                'purpose' => $validated['purpose'],
                'visit_date' => $validated['visit_date'],
                'visit_time' => $validated['visit_time'],
                'status' => 'Pending',
            ]);
        });

        // Load the related records before returning the response.
        $visit->load([
            'visitor',
            'department',
            'staff',
        ]);

        return response()->json([
            'message' => 'Visit request created successfully.',
            'data' => $visit,
        ], 201);
    }

    // Generate a unique visitor code.
    private function generateVisitorCode(): string
    {
        do {
            $code = 'VIS-' . strtoupper(
                str_pad(
                    (string) random_int(1, 99999),
                    5,
                    '0',
                    STR_PAD_LEFT
                )
            );
        } while (
            Visitor::where('visitor_code', $code)->exists()
        );

        return $code;
    }
}