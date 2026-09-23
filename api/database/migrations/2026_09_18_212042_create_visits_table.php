<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->id();

            // Visitor
            $table->foreignId('visitor_id')
                ->constrained('visitors')
                ->cascadeOnDelete();

            // Staff member who created the visit request
            $table->foreignId('staff_id')
                ->constrained('users')
                ->restrictOnDelete();

            // Department being visited
            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete();

            // Person the visitor is coming to see
            $table->string('host_name');

            // Reason for the visit
            $table->string('purpose');

            // Scheduled visit
            $table->date('visit_date');
            $table->time('visit_time');

            // Visit lifecycle
            $table->enum('status', [
                'Pending',
                'Approved',
                'Rejected',
                'Checked-In',
                'Completed',
                'Cancelled',
            ])->default('Pending');

            // Security check-in / check-out
            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();

            // Security officer who performed the actions
            $table->foreignId('checked_in_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('checked_out_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};