// src/components/results/assessmentsTableColumns.jsx
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';

export const createAssessmentsColumns = () => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-lg font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Naam
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Naam',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'moduleName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-lg font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Module
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Module',
    cell: ({ row }) => (
      <span className="truncate max-w-[220px]">
        {row.getValue('moduleName') || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'class',
    accessorFn: (row) => row.class_layout?.name ?? '',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-lg font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Klas
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Klas',
    cell: ({ row }) => (
      <span className="truncate max-w-[160px]">
        {row.getValue('class') || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-lg font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Datum
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Datum',
    cell: ({ row }) => {
      const date = row.getValue('date');
      if (!date) return '—';
      try {
        return format(parseISO(date), 'dd MMM yyyy');
      } catch {
        try {
          return format(new Date(date), 'dd MMM yyyy');
        } catch {
          return String(date);
        }
      }
    },
  },
  {
    id: 'progress',
    header: 'Voortgang',
    cell: ({ row }) => {
      const graded = row.original.results?.length || 0;
      const total = row.original.class_layout?.student_count || 0;
      return (
        <span className="font-mono">
          {graded} / {total}
        </span>
      );
    },
  },
];
