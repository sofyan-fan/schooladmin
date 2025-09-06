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
    accessorKey: 'start_time',
    header: 'Tijd',
    cell: ({ row }) => {
      const startTime = row.original.start_time;
      const endTime = row.original.end_time;

      if (!startTime && !endTime) {
        return <div className="text-muted-foreground text-sm">Geen tijd</div>;
      }

      const timeDisplay =
        startTime && endTime
          ? `${startTime} - ${endTime}`
          : startTime || endTime;

      return (
        <div className="font-medium text-sm" title={timeDisplay}>
          {timeDisplay}
        </div>
      );
    },
    size: 120,
    displayName: 'Tijd',
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
