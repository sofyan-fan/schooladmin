import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { LayoutGrid, Table } from 'lucide-react';

const AssessmentsLayoutToggle = ({ layout, onLayoutChange }) => {
  const activeClasses =
    'bg-green-600 text-white data-[state=on]:!text-white hover:bg-green-700 cursor-pointer';
  const inactiveClasses = 'hover:bg-muted cursor-pointer';

  return (
    <ToggleGroup
      type="single"
      value={layout}
      onValueChange={(val) => val && onLayoutChange(val)}
      variant="outline"
      className="p-1 shadow-none data-[variant=outline]:shadow-none"
    >
      <ToggleGroupItem
        value="grid"
        aria-label="Grid weergave"
        className={cn(
          'px-3',
          layout === 'grid' ? activeClasses : inactiveClasses
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="table"
        aria-label="Tabel weergave"
        className={cn(
          'px-3',
          layout === 'table' ? activeClasses : inactiveClasses
        )}
      >
        <Table className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default AssessmentsLayoutToggle;
