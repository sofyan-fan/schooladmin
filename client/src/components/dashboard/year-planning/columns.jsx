import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import ActionCell from './ActionCell';

export const getColumns = (onEdit, onDelete) => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 text-lg hover:bg-transparent hover:text-primary"
      >
        Activiteit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium truncate" title={row.getValue('name')}>
        {row.getValue('name')}
      </div>
    ),
    size: 300,
    displayName: 'Activiteit',
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4 text-lg hover:bg-transparent hover:text-primary"
      >
        Datum
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('date');
      const formattedDate = date
        ? new Date(date).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : '';
      return (
        <div className="font-medium" title={formattedDate}>
          {formattedDate}
        </div>
      );
    },
    size: 200,
    displayName: 'Datum',
  },
  {
    accessorKey: 'description',
    header: 'Beschrijving',
    cell: ({ row }) => {
      const description = row.getValue('description');
      return (
        <div className="max-w-[200px] truncate" title={description || ''}>
          {description || 'Geen beschrijving'}
        </div>
      );
    },
    size: 250,
    displayName: 'Beschrijving',
  },
  {
    id: 'actions',
    header: 'Acties',
    cell: ({ row }) => (
      <ActionCell row={row} onEdit={onEdit} onDelete={onDelete} />
    ),
    size: 100,
    enableSorting: false,
    enableHiding: false,
  },
];
