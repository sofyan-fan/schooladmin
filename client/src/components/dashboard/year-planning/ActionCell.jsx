import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

const ActionCell = ({ row, onEdit, onDelete }) => (
  <div className="flex items-start space-x-2">
    <Button
      variant="ghost"
      className="h-8 w-8 p-0 rounded-full"
      style={{ color: '#8BC34A' }}
      onClick={() => onEdit(row.original)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'rgba(139, 195, 74, 0.12)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'transparent')
      }
    >
      <span className="sr-only">Edit</span>
      <Pencil className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      className="h-8 w-8 p-0 rounded-full"
      style={{ color: '#F2994A' }}
      onClick={() => onDelete(row.original)}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = 'rgba(242, 153, 74, 0.12)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = 'transparent')
      }
    >
      <span className="sr-only">Delete</span>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

export default ActionCell;
