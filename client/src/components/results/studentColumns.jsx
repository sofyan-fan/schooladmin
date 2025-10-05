'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowUpDown, Edit } from 'lucide-react';

const getGradeColor = (grade) => {
  if (grade >= 8) return 'bg-green-100 text-green-800';
  if (grade >= 6.5) return 'bg-blue-100 text-blue-800';
  if (grade >= 5.5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export const createStudentResultColumns = ({ onEdit }) => [
  {
    accessorKey: 'student',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-lg"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Leerling
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { student } = row.original;
      if (!student) return 'Onbekende leerling';
      const studentName = `${student.first_name} ${student.last_name}`;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={`https://api.dicebear.com/8.x/initials/svg?seed=${studentName}`}
            />
            <AvatarFallback>
              {student.first_name?.[0]}
              {student.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span>{studentName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'class',
    header: 'Klas',
    cell: ({ row }) =>
      row.original.student.class_layout?.name || 'Onbekende klas',
  },
  {
    accessorKey: 'assessment_name',
    header: 'Beoordeling',
    cell: ({ row }) => {
      const assessment = row.original.assessment;
      return assessment ? assessment.name : 'Onbekende beoordeling';
    },
  },
  {
    accessorKey: 'grade',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="hover:bg-transparent hover:text-primary text-lg"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Cijfer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const { grade } = row.original;
      return (
        <Badge className={`${getGradeColor(grade)} font-semibold`}>
          {grade.toFixed(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Datum',
    cell: ({ row }) => format(new Date(row.original.date), 'PPP'),
  },
  {
    id: 'actions',
    header: 'Acties',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => onEdit(row.original)}
      >
        <Edit className="h-4 w-4" />
        <span className="sr-only">Resultaat bewerken</span>
      </Button>
    ),
  },
];
