import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

const Toolbar = ({ table, filterColumn, filterPlaceholder, useGlobalFilter, rightActions }) => {
  const column = filterColumn ? table.getColumn(filterColumn) : null;
  const displayName = column?.columnDef?.displayName ?? filterColumn;

  // Determine placeholder text
  const placeholder = filterPlaceholder ?? (displayName ? `Zoek op ${displayName}` : 'Zoeken...');

  // Determine filter value and onChange handler based on filter mode
  const filterValue = useGlobalFilter
    ? (table.getState().globalFilter ?? '')
    : (column?.getFilterValue() ?? '');

  const handleFilterChange = (event) => {
    if (useGlobalFilter) {
      table.setGlobalFilter(event.target.value);
    } else {
      column?.setFilterValue(event.target.value);
    }
  };

  return (
    <div className="flex items-center mb-4 space-x-2">
      <Input
        placeholder={placeholder}
        value={filterValue}
        onChange={handleFilterChange}
        className="max-w-sm bg-card placeholder:italic"
      />
      <div className="ml-auto flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white">
              Kolommen <ChevronDown className="ml-2 h-4 w-4 " />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize cursor-pointer hover:text-white hover:bg-primary data-[highlighted]:text-white data-[highlighted]:bg-primary"
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                >
                  {col.columnDef.displayName ?? col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {rightActions}
      </div>
    </div>
  );
};

export default Toolbar;
