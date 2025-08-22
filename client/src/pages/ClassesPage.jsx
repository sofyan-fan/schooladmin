import classApi from '@/apis/classes/classAPI';
import { createColumns } from '@/components/classes/columns';
import CreateClassModal from '@/components/classes/CreateClassModal';
import EditClassModal from '@/components/classes/EditClassModal';
import ViewClassModal from '@/components/classes/ViewClassModal';
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
import { Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NoData = (
  <TableRow>
    <TableCell colSpan={5} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Users className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">No Classes Found</h3>
        <p className="text-muted-foreground">
          Get started by adding a new class.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const classData = await classApi.get_classes();
      setClasses(classData);
    } catch (e) {
      console.error('Failed to load classes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (newClass) => {
    await classApi.add_class(newClass);
    fetchData();
  };

  const handleUpdate = async (updatedClass) => {
    await classApi.edit_class(updatedClass);
    fetchData();
  };

  const handleDelete = async (id) => {
    await classApi.delete_class(id);
    fetchData();
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenView(true);
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
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
    data: classes,
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
    <>
      <PageHeader
        title="Klassen"
        icon={<Users className="size-9" />}
        description="Beheer hier alle klassen."
        buttonText="Nieuwe klas"
        onAdd={() => setOpenCreate(true)}
      />
      <Toolbar table={table} filterColumn="name" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />

      <ViewClassModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        classData={selected}
      />
      <CreateClassModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSave={handleCreate}
      />
      <EditClassModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        onSave={handleUpdate}
        classData={selected}
      />
    </>
  );
}
