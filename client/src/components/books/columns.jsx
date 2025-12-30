// src/components/books/columns.jsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';

export const createColumns = ({ onView, onEdit, onDelete }) => [
    {
        accessorKey: 'title',
        header: ({ column }) => (
            <Button
                className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Titel
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        displayName: 'Titel',
        size: 220,
        cell: ({ row }) => (
            <div className="min-w-0">
                <div className="text-lg font-medium truncate" title={row.original?.title}>
                    {row.original?.title || '—'}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'moduleName',
        header: ({ column }) => (
            <Button
                className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Course module
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        displayName: 'Course module',
        size: 200,
        cell: ({ row }) => (
            <Badge variant="outline" className="text-sm px-2.5 py-0.5 max-w-[18rem] truncate">
                {row.original?.moduleName || '—'}
            </Badge>
        ),
    },
    {
        accessorKey: 'ownedCount',
        header: ({ column }) => (
            <Button
                className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                In bezit
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        displayName: 'In bezit',
        size: 120,
        cell: ({ row }) => (
            <div className="text-lg font-medium tabular-nums text-center">
                {row.original?.ownedCount ?? 0}
            </div>
        ),
    },
    {
        accessorKey: 'inStoreCount',
        header: ({ column }) => (
            <Button
                className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                In store
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        displayName: 'In store',
        size: 120,
        cell: ({ row }) => (
            <div className="text-lg font-medium tabular-nums text-center">
                {row.original?.inStoreCount ?? 0}
            </div>
        ),
    },
    {
        accessorKey: 'totalCount',
        header: ({ column }) => (
            <Button
                className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Totaal
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        displayName: 'Totaal',
        size: 110,
        cell: ({ row }) => (
            <div className="text-lg font-medium tabular-nums text-center">
                {row.original?.totalCount ?? 0}
            </div>
        ),
    },
    {
        id: 'actions',
        size: 110,
        cell: ({ row }) => (
            <div className="flex items-center space-x-2">
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onView?.(row.original)}
                >
                    <span className="sr-only">Bekijken</span>
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit?.(row.original)}
                >
                    <span className="sr-only">Bewerken</span>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onDelete?.(row.original.id)}
                >
                    <span className="sr-only">Verwijderen</span>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
];
