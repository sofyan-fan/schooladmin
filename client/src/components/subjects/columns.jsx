import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import ActionCell from './ActionCell';
import TruncatedListCell from './TruncatedListCell';

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
      <div className="font-medium truncate" title={row.getValue('name')}>
        {row.getValue('name')}
      </div>
    ),
    size: 250,
    displayName: 'Subject',
  },
  {
    accessorKey: 'levels',
    header: 'Levels',
    cell: ({ row }) => {
      const levels = row.original.levels;
      return <TruncatedListCell items={levels} />;
    },
    size: 250,
    displayName: 'Levels',
  },
  {
    accessorKey: 'materials',
    header: 'Materials',
    cell: ({ row }) => {
      const materials = row.original.materials;
      return <TruncatedListCell items={materials} />;
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
