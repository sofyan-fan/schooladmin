import DataTable from '@/components/shared/Table';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Calendar, FileDown, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { getColumns } from './columns';

const NoData = (
  <TableRow>
    <TableCell colSpan={4} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Calendar className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">Geen activiteiten gevonden</h3>
        <p className="text-muted-foreground">
          Voeg je eerste activiteit toe aan de jaarplanning.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

const YearPlanningTable = ({
  items,
  onEditClick,
  onDeleteClick,
  onAddClick,
  onExportClick,
  loading = false,
}) => {
  const columns = useMemo(
    () => getColumns(onEditClick, onDeleteClick),
    [onEditClick, onDeleteClick]
  );

  const table = useReactTable({
    data: items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar with Add and Export buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            className="bg-primary text-white hover:bg-primary/90"
            onClick={onAddClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Activiteit toevoegen
          </Button>
          <Button variant="outline" size="sm" onClick={onExportClick}>
            <FileDown className="h-4 w-4 mr-2" />
            Exporteren
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />
    </div>
  );
};

export default YearPlanningTable;
