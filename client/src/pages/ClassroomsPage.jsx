import classroomAPI from '@/apis/classroomAPI';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Building } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { createColumns } from '@/components/classrooms/columns';
import CreateClassroomModal from '@/components/classrooms/CreateClassroomModal';
import DeleteClassroomModal from '@/components/classrooms/DeleteClassroomModal';
import EditClassroomModal from '@/components/classrooms/EditClassroomModal';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { TableCell, TableRow } from '@/components/ui/table';

const NoData = (
  <TableRow>
    <TableCell colSpan={5} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Building className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">Geen lokalen gevonden</h3>
        <p className="text-muted-foreground">
          Begin door een nieuw lokaal toe te voegen.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const classroomsData = await classroomAPI.getClassrooms();
      setClassrooms(classroomsData);
    } catch (e) {
      console.error('Failed to load classrooms', e);
      toast.error('Laden van lokalen is mislukt.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const handleCreate = async (newClassroom) => {
    try {
      const created = await classroomAPI.addClassroom(newClassroom);
      setClassrooms((prev) => [...prev, created]);
      toast.success('Lokaal succesvol aangemaakt.');
    } catch (e) {
      // Check if it's a duplicate name error
      if (e.response?.data?.error?.includes('already exists')) {
        toast.error(
          'Een lokaal met deze naam bestaat al. Kies een andere naam.'
        );
      } else {
        toast.error(
          e.response?.data?.error ||
            e.message ||
            'Kon het lokaal niet aanmaken.'
        );
      }
      throw e;
    }
  };

  const handleUpdate = async (updatedClassroom) => {
    try {
      const updated = await classroomAPI.updateClassroom(updatedClassroom);
      setClassrooms((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      toast.success('Lokaal succesvol bijgewerkt.');
      setOpenEdit(false);
    } catch (e) {
      // Check if it's a duplicate name error
      if (e.response?.data?.error?.includes('already exists')) {
        toast.error(
          'Een lokaal met deze naam bestaat al. Kies een andere naam.'
        );
      } else {
        toast.error(
          e.response?.data?.error ||
            e.message ||
            'Kon het lokaal niet bijwerken.'
        );
      }
      throw e;
    }
  };

  const handleDelete = async () => {
    try {
      await classroomAPI.deleteClassroom(selected.id);
      setClassrooms((prev) => prev.filter((c) => c.id !== selected.id));
      toast.success('Lokaal succesvol verwijderd.');
      setOpenDelete(false);
    } catch (e) {
      toast.error(e.message || 'Kon het lokaal niet verwijderen.');
    }
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
  };

  const handleDeleteClick = (record) => {
    setSelected(record);
    setOpenDelete(true);
  };

  const columns = useMemo(
    () =>
      createColumns({
        onEdit: handleEdit,
        onDelete: (record) => handleDeleteClick(record),
      }),
    []
  );

  const table = useReactTable({
    data: classrooms,
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
        title="Lokalen"
        icon={<Building className="size-9" />}
        description="Beheer hier alle lokalen."
        buttonText="Nieuw lokaal"
        onAdd={() => setOpenCreate(true)}
      />
      <Toolbar table={table} filterColumn="name" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />
      <CreateClassroomModal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        onSave={handleCreate}
      />
      <EditClassroomModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        onSave={handleUpdate}
        classroom={selected}
      />
      <DeleteClassroomModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onDelete={handleDelete}
      />
    </>
  );
};

export default ClassroomsPage;
