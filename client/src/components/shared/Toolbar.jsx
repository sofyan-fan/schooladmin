import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

const Toolbar = ({ table, filterColumn }) => {
  const column = table.getColumn(filterColumn);
  const displayName = column?.columnDef?.displayName ?? filterColumn;

  return (
    <div className="flex items-center mb-4 space-x-2">
      <Input
        placeholder={`Zoek op ${displayName}`}
        value={column?.getFilterValue() ?? ''}
        onChange={(event) => column?.setFilterValue(event.target.value)}
        className="max-w-sm bg-card placeholder:italic"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Kolommen <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {col.columnDef.displayName ?? col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Toolbar;
