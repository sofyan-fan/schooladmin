import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

const ActionCell = ({ row, onEdit, onDelete }) => (
  <div className="flex items-start space-x-2">
    <Button
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={() => onEdit(row.original)}
    >
      <span className="sr-only">Edit</span>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      className="h-8 w-8 p-0"
      onClick={() => onDelete(row.original)}
    >
      <span className="sr-only">Delete</span>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

export default ActionCell;
