// src/pages/teachers/columns.jsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

export const createColumns = ({ handleView, handleEdit, handleDelete }) => [
  // Selection Column (doesn't need displayName as it won't appear in the dropdown)
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecteer alles"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecteer rij"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Data Columns
  {
    accessorKey: 'firstName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Voornaam
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    displayName: 'Voornaam', // For the dropdown
  },
  {
    accessorKey: 'lastName',
    header: 'Achternaam',
    displayName: 'Achternaam', // For the dropdown
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
    displayName: 'E-mail', // For the dropdown
  },
  {
    accessorKey: 'phone',
    header: 'Telefoon',
    displayName: 'Telefoon', // For the dropdown
  },
  {
    accessorKey: 'address',
    header: 'Adres',
    displayName: 'Adres', // For the dropdown
  },
  {
    accessorKey: 'status',
    header: 'Status',
    displayName: 'Status', // For the dropdown
    cell: ({ row }) => {
      const status = row.getValue('status');
      const dutchStatus = status === 'Active' ? 'Actief' : 'Inactief';
      return <Badge variant="outline">{dutchStatus}</Badge>;
    },
  },

  // Actions Column
  {
    id: 'actions',
    displayName: 'Acties', // For the dropdown
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menu openen</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acties</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleView(teacher)}>
              Bekijken
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(teacher)}>
              Bewerken
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(teacher.id)}
            >
              Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
