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
        Class Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'mentor',
    header: 'Mentor',
    cell: ({ row }) => {
      const mentor = row.original.mentor;
      return mentor ? `${mentor.first_name} ${mentor.last_name}` : 'N/A';
    },
  },
  {
    accessorKey: 'students',
    header: 'Students',
    cell: ({ row }) => row.original.students?.length || 0,
  },
  {
    accessorKey: 'course',
    header: 'Course',
    cell: ({ row }) => {
      const course = row.original.course;
      return course ? course.name : 'N/A';
    },
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
          <span className="sr-only">View</span>
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(row.original)}
        >
          <span className="sr-only">Edit</span>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onDelete(row.original)}
        >
          <span className="sr-only">Delete</span>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
