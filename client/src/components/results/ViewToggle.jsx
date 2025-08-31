import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LayoutGrid, Table } from 'lucide-react';

const ViewToggle = ({ view, onViewChange }) => {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={onViewChange}
      variant="outline"
      className="bg-muted/50"
    >
      <ToggleGroupItem value="cards" aria-label="Card view">
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2">Cards</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <Table className="h-4 w-4" />
        <span className="ml-2">Tabel</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ViewToggle;
