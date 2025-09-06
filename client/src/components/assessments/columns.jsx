// src/components/assessments/columns.jsx
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown, ClipboardList, Eye, Pencil, Trash2 } from 'lucide-react';

export const createColumns = ({
  onView,
  onEdit,
  onDelete,
  onManageResults,
}) => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-sm font-medium"
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-sm font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Klas
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[180px]">{row.getValue('class')}</div>
    ),
  },
  {
    accessorKey: 'subject', // contains subject name and level
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-sm font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Vak
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    size: 280,
    cell: ({ row }) => {
      const value = row.getValue('subject') ?? '';
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              title={value}
              className="inline-block max-w-[280px] truncate align-middle"
            >
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="max-w-sm break-words"
          >
            {value}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-sm font-medium"
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-sm font-medium"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Weging
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const score = row.getValue('maxScore');
      return <span className="font-mono">{score || '—'}</span>;
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
          onClick={() => onManageResults(row.original)}
        >
          <span className="sr-only">Resultaten beheren</span>
          <ClipboardList className="h-4 w-4" />
        </Button>
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
