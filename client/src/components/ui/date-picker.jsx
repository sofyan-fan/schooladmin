'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

// Helper to accept string | Date | undefined and always return Date | undefined
function toDateOrUndefined(v) {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export function DatePicker({
  value,
  onChange,
  fromYear, // optional override
  toYear, // optional override
  minDate, // optional override
  maxDate, // optional override
  placeholder = 'Select date',
  id,
  className,
  buttonClassName,
}) {
  const [open, setOpen] = React.useState(false);

  // Defaults: allow a very wide range (1900..2100) unless overridden
  const currentYear = new Date().getFullYear();
  const defaultFromYear = fromYear ?? 1900;
  const defaultToYear = toYear ?? 2100;

  // Bound dates for disabling
  const computedMinDate = minDate ?? new Date(defaultFromYear, 0, 1); // Jan 1, fromYear
  const computedMaxDate = maxDate ?? new Date(defaultToYear, 11, 31); // Dec 31, toYear

  // Default selected date: today if no value provided
  const selected = toDateOrUndefined(value) ?? new Date();

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className={cn(
              'w-full justify-between text-left font-normal bg-white',
              !selected && 'text-muted-foreground',
              buttonClassName
            )}
          >
            {selected ?? null
              ? selected.toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : placeholder}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            // shadcn (react-day-picker v9) supports "dropdown" or "dropdown-buttons" depending on your version
            captionLayout="dropdown"
            highlightToday={false}
            fromYear={defaultFromYear}
            toYear={defaultToYear}
            // Disable anything outside bounds (and future dates if your toYear < current year)
            disabled={{
              before: computedMinDate,
              after: computedMaxDate,
            }}
            onSelect={(date) => {
              // ensure we only set valid dates within range
              if (date) {
                if (date < computedMinDate || date > computedMaxDate) return;
                onChange?.(date);
              } else {
                onChange?.(undefined);
              }
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
