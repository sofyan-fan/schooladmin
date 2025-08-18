import { Button } from '@/components/ui/button';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';

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

export const getColumns = (onEdit, onDelete) => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 text-lg hover:bg-transparent hover:text-primary"
      >
        Subject
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
    size: 400,
    displayName: 'Subject',
  },
  {
    accessorKey: 'levels',
    header: 'Levels',
    cell: ({ row }) => {
      const levels = row.original.levels;
      return Array.isArray(levels) && levels.length > 0
        ? levels.map((l) => l.level).join(', ')
        : 'N/A';
    },
    size: 250,
    displayName: 'Levels',
  },
  {
    accessorKey: 'materials',
    header: 'Materials',
    cell: ({ row }) => {
      const materials = row.original.materials;
      return Array.isArray(materials) && materials.length > 0
        ? materials.map((m) => m.material).join(', ')
        : 'N/A';
    },
    size: 250,
    displayName: 'Materials',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <ActionCell row={row} onEdit={onEdit} onDelete={onDelete} />
    ),
    size: 100,
    enableSorting: false,
    enableHiding: false,
  },
];
