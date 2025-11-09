// src/pages/teachers/columns.jsx
import StatusIndicator from '@/components/shared/StatusIndicator';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const createColumns = ({ onView, onEdit, onDelete }) => [
  {
    accessorKey: 'firstName',
    header: ({ column }) => (
      <Button
        className="hover:bg-transparent hover:text-primary text-lg"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Voornaam
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'voornaam',
    cell: ({ row }) => {
      const t = row.original;
      return (
        <Link
          to={`/docenten/${t.id}`}
          className="text-primary hover:underline"
          title="Bekijk details"
        >
          {t.firstName}
        </Link>
      );
    },
  },
  {
    accessorKey: 'lastName',
    header: ({ column }) => (
      <Button
        className="hover:bg-transparent hover:text-primary text-lg"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Achternaam
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Achternaam',
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
    displayName: 'E-mail',
  },
  {
    accessorKey: 'className',
    header: 'Klas',
    displayName: 'Klas',
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => <StatusIndicator isActive={row.original.active} />,
    displayName: 'Status',
  },
  {
    id: 'actions',
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
          className="h-8 w-8 p-0"
          onClick={() => onDelete(row.original.id)}
        >
          <span className="sr-only">Verwijderen</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
