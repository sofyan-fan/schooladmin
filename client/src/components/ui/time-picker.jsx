import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

// parse "HH:mm" or "H:mm" into minutes, return null if invalid
const toMinutes = (t) => {
  if (!t) return null;
  const [hs = '', ms = ''] = t.split(':');
  const h = Number(hs);
  const m = Number(ms);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const fromMinutes = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
};

export default function TimePicker({
  value = '',
  onChange,
  step = 10,
  startHour = 0,
  endHour = 23,
  className,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const [contentW, setContentW] = useState(280);
  const listRef = useRef(null);

  // match popover width to the input
  useLayoutEffect(() => {
    if (!open || !inputRef.current) return;
    const w = inputRef.current.offsetWidth;
    setContentW(Math.max(220, Math.min(w, 360)));
  }, [open]);

  // generate all stepped times
  const times = useMemo(() => {
    const arr = [];
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += step) arr.push(`${pad(h)}:${pad(m)}`);
    }
    return arr;
  }, [startHour, endHour, step]);

  // include current value if valid but off-step
  const listTimes = useMemo(() => {
    const set = new Set(times);
    const mins = toMinutes(value);
    if (mins != null) set.add(fromMinutes(mins));
    return Array.from(set).sort((a, b) => toMinutes(a) - toMinutes(b));
  }, [times, value]);

  // scroll the selected button into view
  const scrollToSelected = () => {
    if (!open || !listRef.current || !value) return;
    const list = listRef.current;
    const el = list.querySelector(`[data-time="${value}"]`);
    if (!el) return;
    const target =
      el.offsetTop - list.clientHeight / 2 + el.clientHeight / 2;
    list.scrollTop = Math.max(0, target);
  };

  // run after popover opens
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      scrollToSelected();
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, value, listTimes]);

  // typing: normalize on blur
  const handleChange = (e) => onChange?.(e.target.value);
  const handleBlur = () => {
    const mins = toMinutes(value?.trim());
    if (mins == null) return;
    const fixed = fromMinutes(mins);
    if (fixed !== value) onChange?.(fixed);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') setOpen(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className="relative w-full" onClick={() => setOpen(true)}>
          <Input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            placeholder="HH:mm"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            className={cn(
              'pr-9 tabular-nums bg-white shadow-xs border border-gray-200 hover:cursor-pointer',
              className
            )}
          />
          <Clock className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-0 rounded-lg overflow-hidden shadow-lg"
        style={{ width: contentW }}
      >
        <div
          ref={listRef}
          className="
            max-h-72 overflow-y-auto bg-popover
            [scrollbar-gutter:stable]
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-foreground/15
            hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25
          "
          onWheelCapture={(e) => e.stopPropagation()}
          onTouchMoveCapture={(e) => e.stopPropagation()}
        >
          {listTimes.map((t) => {
            const selected = t === value;
            return (
              <button
                key={t}
                data-time={t}
                type="button"
                aria-selected={selected}
                onClick={() => {
                  onChange?.(t);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-2 py-2 text-center text-base tabular-nums hover:bg-accent/10',
                  selected && 'bg-primary text-white hover:bg-primary/90'
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
