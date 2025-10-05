// src/components/ui/combobox.jsx
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

export default function ComboboxField({
  label,
  items = [],                // [{ value: "1", label: "Math" }]
  value,
  onChange,
  placeholder = 'Selecteer',
  error,                      // optional error text
  className,                  // optional wrapper className
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => String(i.value) === String(value));
  const id = useId();

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <Label htmlFor={id} className="mb-1.5 block">
          {label}
        </Label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn(
              'w-full justify-between bg-white',
              disabled && 'opacity-60 cursor-not-allowed'
            )}
            disabled={disabled}
            onClick={() => !disabled && setOpen((v) => !v)}
          >
            {selected ? selected.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="p-0 min-w-[16rem] w-[min(420px,var(--radix-popover-trigger-width))]"
        >
          <Command>
            <CommandInput placeholder="Zoeken..." />
            <CommandEmpty>Geen resultaten</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {items.map((i) => {
                  const isSelected = String(value) === String(i.value);
                  return (
                    <CommandItem
                      key={i.value}
                      value={`${i.label} ${i.value}`}
                      onSelect={() => {
                        onChange?.(String(i.value));
                        setOpen(false);
                      }}
                      className={cn(
                        'cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:[&_svg]:text-primary-foreground'
                      )}
                      aria-selected={isSelected}
                      role="option"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {i.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
