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
import ActionCell from './ActionCell';
import { getColumns } from './columns';
import SearchBar from './SearchBar';
import YearPlanningDataTable from './YearPlanningDataTable';
const YearPlanningTable = ({
  items,
  onEditClick,
  onDeleteClick,
  onAddClick,
  onExportClick,
  loading = false,
  readOnly = false,
}) => {
  const columns = useMemo(
    () => getColumns(onEditClick, onDeleteClick, { readOnly }),
    [onEditClick, onDeleteClick, readOnly]
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
        pageSize: 4,
      },
    },
  });

  const NoData = (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-48 text-center">
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

  const rows = table.getRowModel().rows;

  const renderMobileContent = () => {
    if (loading) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Laden...
        </div>
      );
    }

    if (!rows || rows.length === 0) {
      return (
        <div className="py-10">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <Calendar className="size-10 text-gray-400" />
            <h3 className="text-lg font-semibold">Geen activiteiten gevonden</h3>
            <p className="text-sm text-muted-foreground">
              Voeg je eerste activiteit toe aan de jaarplanning.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {rows.map((row) => {
          const item = row.original || {};

          // Format date similar to the table column
          const rawDate = item.date;
          let formattedDate = '';
          if (rawDate) {
            try {
              formattedDate = new Date(rawDate).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
            } catch {
              formattedDate = rawDate;
            }
          }

          const startTime = item.start_time;
          const endTime = item.end_time;
          let timeDisplay = '';
          if (startTime && endTime) {
            timeDisplay = `${startTime} - ${endTime}`;
          } else if (startTime || endTime) {
            timeDisplay = startTime || endTime;
          }

          return (
            <div
              key={row.id}
              className="rounded-lg border bg-card/60 px-3 py-2 flex flex-col gap-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm text-foreground break-words">
                  {item.name || 'Activiteit'}
                </div>
                {formattedDate && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formattedDate}
                  </span>
                )}
              </div>
              {timeDisplay && (
                <div className="text-xs text-muted-foreground">{timeDisplay}</div>
              )}
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {item.description}
                </p>
              )}
              {!readOnly && (
                <div className="pt-1">
                  <ActionCell
                    row={row}
                    onEdit={onEditClick}
                    onDelete={onDeleteClick}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMobilePagination = () => {
    if (table.getPageCount() <= 1) return null;

    return (
      <div className="mt-3 flex items-center justify-end space-x-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ga naar eerste pagina</span>
            <span aria-hidden="true">&laquo;</span>
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Ga naar vorige pagina</span>
            <span aria-hidden="true">&lsaquo;</span>
          </Button>

          <div className="flex w-[110px] items-center justify-center text-xs font-medium">
            Pagina {table.getState().pagination.pageIndex + 1} van{' '}
            {table.getPageCount()}
          </div>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ga naar volgende pagina</span>
            <span aria-hidden="true">&rsaquo;</span>
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Ga naar laatste pagina</span>
            <span aria-hidden="true">&raquo;</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar with Search and Action buttons */}
      <h1 className="text-2xl font-semibold">Jaarplanning</h1>
      {/* Toolbar: search + actions, responsive for mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search/Filter Toolbar */}
        <div className="w-full sm:max-w-md">
          <SearchBar table={table} filterColumn="name" />
        </div>
        {!readOnly && (
          <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-white hover:bg-primary/90 text-sm sm:text-base w-full sm:w-auto justify-center"
              onClick={onAddClick}
            >
              <Plus className="size-4 mr-2 sm:size-[1.5rem]" />
              Toevoegen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportClick}
              className="hover:text-regular text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <FileDown className="size-4 mr-2 sm:size-[1.5rem]" />
              Exporteren
            </Button>
          </div>
        )}
      </div>

      {/* Mobile: stacked cards */}
      <div className="block md:hidden">
        {renderMobileContent()}
        {renderMobilePagination()}
      </div>

      {/* Tablet & desktop: table */}
      <div className="hidden md:block">
        <YearPlanningDataTable
          table={table}
          loading={loading}
          columns={columns}
          NoDataComponent={NoData}
        />
      </div>
    </div>
  );
};

export default YearPlanningTable;
