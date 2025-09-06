import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

const Toolbar = ({ table, filterColumn }) => (
  <div className="flex items-center mb-4 space-x-2">
    <Input
      placeholder={`Filter by ${filterColumn}...`}
      value={table.getColumn(filterColumn)?.getFilterValue() ?? ''}
      onChange={(event) =>
        table.getColumn(filterColumn)?.setFilterValue(event.target.value)
      }
      className="max-w-sm bg-card"
    />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Columns <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.columnDef.displayName ?? column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export default Toolbar;
