import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export default function ComboboxField({
  label,
  items = [], // [{ value: "1", label: "Math" }]
  value,
  onChange,
  placeholder = 'Selecteer',
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => String(i.value) === String(value));

  return (
    <FormItem className="w-full">
      <FormLabel>{label}</FormLabel>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between bg-white"
          >
            {selected ? selected.label : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        {/* Width aims to match trigger; falls back to a reasonable min width */}
        <PopoverContent
          align="start"
          className="p-0 min-w-[16rem] w-[min(420px,var(--radix-popover-trigger-width))]"
        >
          <Command>
            <CommandInput placeholder="Zoeken..." />
            <CommandEmpty>Geen resultaten</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {items.map((i) => (
                  <CommandItem
                    key={i.value}
                    className="data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:[&_svg]:text-primary-foreground"
                    value={`${i.label} ${i.value}`}
                    onSelect={() => {
                      onChange(String(i.value));
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 ',
                        String(value) === String(i.value)
                          ? 'opacity-100  '
                          : 'opacity-0 '
                      )}
                    />
                    {i.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <FormMessage />
    </FormItem>
  );
}
