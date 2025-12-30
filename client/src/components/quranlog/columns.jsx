import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';

// Factory to create Quran Log columns. We keep it free of hooks; callers should
// pass renderer helpers via options.
export const createColumns = ({
  onView,
  onEdit,
  onDelete,
  onToggleMemo,
  formatPointShort,
  renderPointTooltip,
}) => [
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
          aria-label={`Select log ${row.original.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 36,
    },
    {
      accessorKey: 'studentLabel',
      header: ({ column }) => (
        <Button
          className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Leerling
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      displayName: 'Leerling',
      size: 260,
    },
    {
      accessorKey: 'from',
      header: ({ column }) => (
        <Button
          className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Begin
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      displayName: 'Begin',
      size: 160,
      cell: ({ row }) => {
        const raw = row.getValue('from');
        const short = formatPointShort(raw);
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-block max-w-[140px] truncate align-middle"
                title={short}
              >
                {short}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-sm break-words"
            >
              {renderPointTooltip(raw)}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'to',
      header: ({ column }) => (
        <Button
          className="hover:bg-transparent hover:text-primary text-lg px-0 has-[>svg]:px-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Einde
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      displayName: 'Einde',
      size: 160,
      cell: ({ row }) => {
        const raw = row.getValue('to');
        const short = formatPointShort(raw);
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-block max-w-[140px] truncate align-middle"
                title={short}
              >
                {short}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-sm break-words"
            >
              {renderPointTooltip(raw)}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <Button
          className="hover:bg-transparent hover:text-primary text-lg"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Datum
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      displayName: 'Datum',
      size: 160,
      cell: ({ row }) => {
        const raw = row.getValue('date');
        if (!raw) return '—';
        try {
          if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            const [y, m, d] = raw.split('-');
            return `${d}-${m}-${y}`; // dd-mm-yyyy
          }
          const d = new Date(raw);
          if (!isNaN(d.getTime())) return d.toLocaleDateString('nl-NL');
        } catch {
          // ignore
        }
        return String(raw);
      },
    },
    {
      id: 'scores',
      header: () => (
        <div className="w-full text-center text-lg font-medium">Beoordeling</div>
      ),
      displayName: 'Beoordeling',
      size: 200,
      cell: ({ row }) => {
        const isSet = (v) => v !== null && v !== undefined && v !== '';
        const fmt = (v) => (isSet(v) ? String(v) : '—');

        const n = row.original?.nourania;
        const t = row.original?.tilawa;
        const j = row.original?.tajweed;
        const h = row.original?.hifdh;

        const hasAny = [n, t, j, h].some(isSet);
        if (!hasAny) return <div className="text-center text-muted-foreground">—</div>;

        const short = `N${fmt(n)} · T${fmt(t)} · J${fmt(j)} · H${fmt(h)}`;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-block w-full text-center truncate"
                title={short}
              >
                {short}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-sm">
              <div className="text-sm leading-relaxed">
                <div>Nourania: {fmt(n)}</div>
                <div>Tilāwa: {fmt(t)}</div>
                <div>Tajwīd: {fmt(j)}</div>
                <div>Hifdh: {fmt(h)}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: 'memorized',
      header: () => <div className="w-full text-center">Afgerond</div>,
      size: 90,
      cell: ({ row }) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={Boolean(row.original.memorized)}
            aria-label="Afgerond"
            onCheckedChange={(v) => onToggleMemo?.(row.original.id, Boolean(v))}
          />
        </div>
      ),
    },
    {
      id: 'actions',
      size: 120,
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

export default createColumns;
