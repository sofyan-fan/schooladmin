// src/components/assessments/columns.jsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';

export const createColumns = ({ onView, onEdit, onDelete }) => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        className="hover:bg-transparent hover:text-primary text-lg"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Naam
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'class',
    header: 'Klas',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('class')}</Badge>,
  },
  {
    accessorKey: 'subject',
    header: 'Vak',
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue('subject')}</Badge>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        className="hover:bg-transparent hover:text-primary"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Datum
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('date');
      if (!date) return '—';
      try {
        return format(parseISO(date), 'dd MMM yyyy');
      } catch {
        return date;
      }
    },
  },
  {
    accessorKey: 'maxScore',
    header: 'Max. score',
    cell: ({ row }) => {
      const score = row.getValue('maxScore');
      return <span className="font-mono">{score || '—'}</span>;
    },
  },
  {
    accessorKey: 'duration',
    header: 'Duur',
    cell: ({ row }) => {
      const duration = row.getValue('duration');
      return duration ? `${duration} min` : '—';
    },
  },
  {
    id: 'actions',
    header: 'Acties',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onView(row.original)}
        >
          <span className="sr-only">Bekijken</span>
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(row.original)}
        >
          <span className="sr-only">Bewerken</span>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(row.original)}
        >
          <span className="sr-only">Verwijderen</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
