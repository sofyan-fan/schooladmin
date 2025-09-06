// src/pages/teachers/columns.jsx
import StatusIndicator from '@/components/shared/StatusIndicator';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';

export const createColumns = ({ onView, onEdit, onDelete }) => [
  {
    accessorKey: 'firstName',
    header: ({ column }) => (
      <Button
        className="hover:bg-transparent hover:text-primary text-lg"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        First Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: ({ column }) => (
      <Button
        className="hover:bg-transparent hover:text-primary text-lg"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Last Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Last Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    displayName: 'Email',
  },
  {
    accessorKey: 'className',
    header: 'Class',
    displayName: 'Class',
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
          <span className="sr-only">View</span>
          <Eye className="h-4 w-4" />
        </Button>
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
          onClick={() => onDelete(row.original.id)}
        >
          <span className="sr-only">Delete</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
