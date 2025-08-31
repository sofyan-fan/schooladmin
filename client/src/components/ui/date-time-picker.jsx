'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronDownIcon, Clock } from 'lucide-react';
import * as React from 'react';

// Helper to accept string | Date | undefined and always return Date | undefined
function toDateOrUndefined(v) {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export function DateTimePicker({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  fromYear,
  toYear,
  minDate,
  maxDate,
  className,
}) {
  const [open, setOpen] = React.useState(false);

  // Defaults for event dates: current year -1 to +5
  const currentYear = new Date().getFullYear();
  const defaultFromYear = fromYear ?? currentYear - 1;
  const defaultToYear = toYear ?? currentYear + 5;

  // Bound dates for disabling
  const computedMinDate = minDate ?? new Date(defaultFromYear, 0, 1);
  const computedMaxDate = maxDate ?? new Date(defaultToYear, 11, 31);

  const selectedDate = toDateOrUndefined(date);

  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      {/* Date Picker */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-picker" className="text-sm font-medium">
          Datum
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-full hover:bg-transparent hover:border-primary justify-start font-normal h-10 px-3"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {selectedDate
                ? selectedDate.toLocaleDateString('nl-NL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : 'DD-MM-YYYY'}
              <ChevronDownIcon className="ml-auto h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              fromYear={defaultFromYear}
              toYear={defaultToYear}
              disabled={{
                before: computedMinDate,
                after: computedMaxDate,
              }}
              onSelect={(date) => {
                if (date) {
                  if (date < computedMinDate || date > computedMaxDate) return;
                  onDateChange?.(date);
                } else {
                  onDateChange?.(undefined);
                }
                setOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Start Time Picker */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="start-time" className="text-sm font-medium">
          Startijd
        </Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="time"
            id="start-time"
            value={startTime || ''}
            onChange={(e) => onStartTimeChange?.(e.target.value)}
            className="bg-background h-10 pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2"
          />
        </div>
      </div>

      {/* End Time Picker */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="end-time" className="text-sm font-medium">
          Eindtijd
        </Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            type="time"
            id="end-time"
            value={endTime || ''}
            onChange={(e) => onEndTimeChange?.(e.target.value)}
            className="bg-background h-10 pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2"
          />
        </div>
      </div>
    </div>
  );
}
