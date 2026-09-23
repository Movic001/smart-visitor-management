<?php

namespace App\Filament\Resources\Visits\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TimePicker;
use Filament\Schemas\Schema;

class VisitForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('visitor_id')
                    ->relationship('visitor', 'id')
                    ->required(),
                Select::make('staff_id')
                    ->relationship('staff', 'name')
                    ->required(),
                Select::make('department_id')
                    ->relationship('department', 'name')
                    ->required(),
                TextInput::make('host_name')
                    ->required(),
                TextInput::make('purpose')
                    ->required(),
                DatePicker::make('visit_date')
                    ->required(),
                TimePicker::make('visit_time')
                    ->required(),
                Select::make('status')
                    ->options([
            'Pending' => 'Pending',
            'Approved' => 'Approved',
            'Rejected' => 'Rejected',
            'Checked-In' => 'Checked  in',
            'Completed' => 'Completed',
            'Cancelled' => 'Cancelled',
        ])
                    ->default('Pending')
                    ->required(),
                DateTimePicker::make('check_in_at'),
                DateTimePicker::make('check_out_at'),
                TextInput::make('checked_in_by')
                    ->numeric(),
                TextInput::make('checked_out_by')
                    ->numeric(),
            ]);
    }
}
