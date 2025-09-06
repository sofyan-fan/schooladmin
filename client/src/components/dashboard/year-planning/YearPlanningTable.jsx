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
import SearchBar from './SearchBar';
import YearPlanningDataTable from './YearPlanningDataTable';

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
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar with Search and Action buttons */}
      <div className="flex items-center justify-between">
        {/* Search/Filter Toolbar */}
        <div className="flex items-center w-full justify-between space-x-4">
          <SearchBar table={table} filterColumn="name" />
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-white hover:bg-primary/90 text-base"
              onClick={onAddClick}
            >
              <Plus className="size-[1.5rem] mr-2" />
              Toevoegen
            </Button>
            <Button variant="outline" size="sm" onClick={onExportClick} className="hover:text-white text-base">
              <FileDown className="size-[1.5rem] mr-2" />
              Exporteren
            </Button>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <YearPlanningDataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />
    </div>
  );
};

export default YearPlanningTable;
