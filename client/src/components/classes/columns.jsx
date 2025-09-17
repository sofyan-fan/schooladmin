// src/components/classes/columns.jsx
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';

export const createColumns = ({ onView, onEdit, onDelete }) => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        type="button"
        className="hover:bg-transparent hover:text-primary text-lg"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Klasnaam
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Klasnaam',
  },
  {
    accessorKey: 'mentor',
    header: 'Mentor',
    cell: ({ row }) => {
      const mentor = row.original.mentor;
      return mentor ? `${mentor.first_name} ${mentor.last_name}` : 'n.v.t.';
    },
    displayName: 'Mentor',
  },
  {
    accessorKey: 'students',
    header: 'Studenten',
    cell: ({ row }) => row.original.students?.length || 0,
    displayName: 'Studenten',
  },
  {
    accessorKey: 'course',
    header: 'Lespakket',
    cell: ({ row }) => {
      const course = row.original.course;
      return course ? course.name : 'n.v.t.';
    },
    displayName: 'Lespakket',
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onView(row.original)}
        >
          <span className="sr-only">Bekijken</span>
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(row.original)}
        >
          <span className="sr-only">Bewerken</span>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onDelete(row.original)}
        >
          <span className="sr-only">Verwijderen</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
    displayName: 'Acties',
  },
];
