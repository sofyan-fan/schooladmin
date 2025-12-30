import StatusIndicator from '@/components/shared/StatusIndicator';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const createMentorColumns = ({ onView, detailsBasePath = '/mijn-leerlingen' } = {}) => [
  // First Name -> link to mentor details page
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
    cell: ({ row }) => {
      const s = row.original;
      const studentId = s.studentId || s.id;
      return (
        <Link
          to={`${detailsBasePath}/${studentId}`}
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

  ...(typeof onView === 'function'
    ? [
        {
          id: 'actions',
          cell: ({ row }) => (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onView(row.original)}
              >
                <span className="sr-only">Snel bekijken</span>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ),
        },
      ]
    : []),
];



