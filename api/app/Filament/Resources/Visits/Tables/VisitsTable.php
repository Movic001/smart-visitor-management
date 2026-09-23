<?php

namespace App\Filament\Resources\Visits\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class VisitsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('visitor.full_name')
                    ->label('Visitor')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('visitor.visitor_code')
                    ->label('Visitor Code')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('staff.name')
                    ->label('Staff')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('department.name')
                    ->label('Department')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('host_name')
                    ->label('Host')
                    ->searchable(),

                TextColumn::make('purpose')
                    ->label('Purpose')
                    ->searchable(),

                TextColumn::make('visit_date')
                    ->label('Visit Date')
                    ->date('M d, Y')
                    ->sortable(),

                TextColumn::make('visit_time')
                    ->label('Visit Time')
                    ->time('h:i A')
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'Pending' => 'warning',
                        'Approved' => 'info',
                        'Checked-In' => 'success',
                        'Completed' => 'gray',
                        'Rejected' => 'danger',
                        'Cancelled' => 'danger',
                        default => 'gray',
                    }),

                TextColumn::make('check_in_at')
                    ->label('Check-in')
                    ->dateTime('M d, Y h:i A')
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('checkedInBy.name')
                    ->label('Checked-in By')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('check_out_at')
                    ->label('Check-out')
                    ->dateTime('M d, Y h:i A')
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('checkedOutBy.name')
                    ->label('Checked-out By')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M d, Y h:i A')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->dateTime('M d, Y h:i A')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'Pending' => 'Pending',
                        'Approved' => 'Approved',
                        'Rejected' => 'Rejected',
                        'Checked-In' => 'Checked-In',
                        'Completed' => 'Completed',
                        'Cancelled' => 'Cancelled',
                    ]),

                SelectFilter::make('department_id')
                    ->label('Department')
                    ->relationship('department', 'name'),

                SelectFilter::make('staff_id')
                    ->label('Staff')
                    ->relationship('staff', 'name'),

                SelectFilter::make('visitor_id')
                    ->label('Visitor')
                    ->relationship('visitor', 'full_name'),

                SelectFilter::make('checked_in_by')
                    ->label('Checked-in By')
                    ->relationship('checkedInBy', 'name'),

                SelectFilter::make('checked_out_by')
                    ->label('Checked-out By')
                    ->relationship('checkedOutBy', 'name'),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}