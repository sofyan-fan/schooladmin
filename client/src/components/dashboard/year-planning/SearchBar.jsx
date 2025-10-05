import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const SearchBar = ({ table, filterColumn }) => (
  <div className="relative flex items-center w-full max-w-sm">
    <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Zoek activiteiten..."
      value={table.getColumn(filterColumn)?.getFilterValue() ?? ''}
      onChange={(event) =>
        table.getColumn(filterColumn)?.setFilterValue(event.target.value)
      }
      className="pl-10 bg-card h-9"
    />
  </div>
);

export default SearchBar;
