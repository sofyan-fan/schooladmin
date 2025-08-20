import rosterApi from '@/apis/rosters/rosterAPI';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import CreateRosterModal from '@/components/rosters/CreateRosterModal';
import EditRosterModal from '@/components/rosters/EditRosterModal';
import ViewRosterModal from '@/components/rosters/ViewRosterModal';
import { createColumns } from '@/components/rosters/columns';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NoData = (
  <TableRow>
    <TableCell colSpan={3} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <CalendarDays className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">No Rosters Found</h3>
        <p className="text-muted-foreground">
          Get started by adding a new roster.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

export default function RosterPage() {
  const [rosters, setRosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const rosterData = await rosterApi.get_rosters();
        const mappedData = (rosterData || []).map((r) => ({
          ...r,
          className: r.class?.name ?? '',
        }));
        if (mounted) setRosters(mappedData);
      } catch (e) {
        console.error('Failed to load rosters', e);
        if (mounted) setRosters([]); // Ensure rosters is an array on error
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async (data) => {
    try {
      await rosterApi.add_roster(data);
      const refreshed = await rosterApi.get_rosters();
      setRosters(
        (refreshed || []).map((r) => ({ ...r, className: r.class?.name ?? '' }))
      );
      setOpenCreate(false);
    } catch (error) {
      console.error('Failed to create roster', error);
    }
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
  };

  const handleUpdate = async (updatedRoster) => {
    try {
      const payload = {
        id: updatedRoster.id,
        classId: updatedRoster.classId,
        schedules: updatedRoster.schedules,
      };
      await rosterApi.edit_roster(payload);
      const refreshed = await rosterApi.get_rosters();
      setRosters(
        (refreshed || []).map((r) => ({ ...r, className: r.class?.name ?? '' }))
      );
      setOpenEdit(false);
    } catch (error) {
      console.error('Failed to update roster', error);
    }
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenView(true);
  };

  const handleDelete = async (id) => {
    try {
      await rosterApi.delete_roster(id);
      const refreshed = await rosterApi.get_rosters();
      setRosters(
        (refreshed || []).map((r) => ({ ...r, className: r.class?.name ?? '' }))
      );
    } catch (error) {
      console.error('Failed to delete roster', error);
    }
  };

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    []
  );

  const table = useReactTable({
    data: rosters,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <LayoutWrapper>
      <PageHeader
        title="Roosters"
        icon={<CalendarDays className="size-9" />}
        description="Beheer hier alle roosters."
        buttonText="Nieuw rooster"
        onAdd={() => setOpenCreate(true)}
      />
      <Toolbar table={table} filterColumn="className" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />
      <CreateRosterModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        onRosterCreated={handleCreate}
      />
      <EditRosterModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        roster={selected}
        onRosterUpdated={handleUpdate}
      />
      <ViewRosterModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        roster={selected}
      />
    </LayoutWrapper>
  );
}
