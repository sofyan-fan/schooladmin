// src/components/students/columns.jsx
import StatusIndicator from '@/components/shared/StatusIndicator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const createColumns = ({ onView, onEdit, onDelete }) => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select student ${row.original.firstName} ${
          row.original.lastName ?? ''
        }`}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        disabled={
          typeof row.getCanSelect === 'function' ? !row.getCanSelect() : false
        }
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
  },
  // First Name -> link to details page
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
    // Render as link -> ensure we use the student id field if present
    cell: ({ row }) => {
      const s = row.original;
      // Prefer `studentId` if the row maps it, otherwise fall back to `id`
      const studentId = s.studentId || s.id;
      return (
        <Link
          to={`/leerlingen/${studentId}`}
          className="hover:text-primary hover:underline font-medium"
          title={`Bekijk details van ${s.firstName} ${s.lastName || ''}`}
        >
          {s.firstName}
        </Link>
      );
    },
    displayName: 'voornaam',
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

  { accessorKey: 'email', header: 'Email', displayName: 'Email' },
  { accessorKey: 'className', header: 'Klas', displayName: 'Klas' },

  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusIndicator isActive={row.original.status === 'Active'} />
    ),
    displayName: 'Status',
  },

  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        {/* Keep the modal for the eye button if you like */}
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onView(row.original)}
        >
          <span className="sr-only">Snel bekijken</span>
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
