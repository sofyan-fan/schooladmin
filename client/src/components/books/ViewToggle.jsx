import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { LayoutGrid, Table } from 'lucide-react';

const ViewToggle = ({ view, onViewChange }) => {
  const activeClasses =
    'bg-green-600 text-white shadow-none data-[state=on]:!text-white hover:bg-green-700 cursor-pointer';
  const inactiveClasses = 'hover:bg-muted cursor-pointer';

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={onViewChange}
      variant="outline"
      className="p-1 shadow-none data-[variant=outline]:shadow-none"
    >
      <ToggleGroupItem
        value="table"
        aria-label="Tabel weergave"
        className={cn('px-4', view === 'table' ? activeClasses : inactiveClasses)}
      >
        <Table className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Tabel</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="cards"
        aria-label="Kaarten weergave"
        className={cn('px-4', view === 'cards' ? activeClasses : inactiveClasses)}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Kaarten</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ViewToggle;



