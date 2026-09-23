<?php

namespace App\Filament\Resources\Visits\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class VisitInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('visitor.full_name')
                    ->label('Visitor Name'),

                TextEntry::make('visitor.visitor_code')
                    ->label('Visitor Code'),

                TextEntry::make('visitor.phone')
                    ->label('Visitor Phone'),

                TextEntry::make('visitor.email')
                    ->label('Visitor Email')
                    ->placeholder('-'),

                TextEntry::make('visitor.company_name')
                    ->label('Company')
                    ->placeholder('-'),

                TextEntry::make('staff.name')
                    ->label('Staff'),

                TextEntry::make('department.name')
                    ->label('Department'),

                TextEntry::make('host_name')
                    ->label('Host / Person Being Visited'),

                TextEntry::make('purpose')
                    ->label('Purpose'),

                TextEntry::make('visit_date')
                    ->label('Visit Date')
                    ->date('M d, Y'),

                TextEntry::make('visit_time')
                    ->label('Visit Time')
                    ->time('h:i A'),

                TextEntry::make('status')
                    ->label('Status')
                    ->badge(),

                TextEntry::make('check_in_at')
                    ->label('Check-in Time')
                    ->dateTime('M d, Y h:i A')
                    ->placeholder('-'),

                TextEntry::make('checkedInBy.name')
                    ->label('Checked-in By')
                    ->placeholder('-'),

                TextEntry::make('check_out_at')
                    ->label('Check-out Time')
                    ->dateTime('M d, Y h:i A')
                    ->placeholder('-'),

                TextEntry::make('checkedOutBy.name')
                    ->label('Checked-out By')
                    ->placeholder('-'),

                TextEntry::make('created_at')
                    ->label('Request Created')
                    ->dateTime('M d, Y h:i A'),

                TextEntry::make('updated_at')
                    ->label('Last Updated')
                    ->dateTime('M d, Y h:i A'),
            ]);
    }
}