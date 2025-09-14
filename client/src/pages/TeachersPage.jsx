import classAPI from '@/apis/classAPI';
import teachersAPI from '@/apis/teachersAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import TeacherEditModal from '@/components/teachers/EditModal';
import TeacherViewModal from '@/components/teachers/ViewModal';
import { createColumns } from '@/components/teachers/columns';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { BookOpen, Presentation } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const NoData = (
  <TableRow>
    <TableCell colSpan={6} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <BookOpen className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">No Teachers Found</h3>
        <p className="text-muted-foreground">
          Get started by adding a new teacher.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openViewProfile, setOpenViewProfile] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teachersAPI.get_teachers();
      const mapped = Array.isArray(response)
        ? response.map((s) => ({
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            email: s.email ?? '',
            phone: s.phone ?? '',
            address: s.address ?? '',
            classId: s.class_id ?? s.class_layout?.id ?? null,
            className: s.class_layout?.name ?? '',
            registrationDate: s.created_at ?? '',
            active: s.active ?? false,
          }))
        : [];
      setTeachers(mapped);
    } catch (e) {
      console.error('Failed to load teachers', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
    (async () => {
      try {
        const cls = await classAPI.get_classes();
        setClasses(cls);
      } catch (e) {
        console.error('Failed to load classes', e);
      }
    })();
  }, [fetchTeachers]);

  const handleEdit = useCallback((record) => {
    setSelected(record);
    setOpenEditProfile(true);
  }, []);

  const handleView = useCallback((record) => {
    setSelected(record);
    setOpenViewProfile(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelected({ role: 'Teacher' });
    setOpenEditProfile(true);
  }, []);

  const handleSave = async (updated) => {
    try {
      const payload = {
        first_name: updated.firstName,
        last_name: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        active: updated.active,
      };

      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      let response;
      if (updated.id) {
        // Update existing teacher
        response = await teachersAPI.update_teacher({
          id: updated.id,
          ...payload,
        });
      } else {
        // Create new teacher
        response = await teachersAPI.add_teacher(payload);
      }

      // Assign as mentor to selected class if provided
      let className = '';
      if (typeof updated.classId !== 'undefined' && updated.classId) {
        try {
          await classAPI.assign_mentor(
            updated.classId,
            response.id || updated.id
          );
          const selectedClass = classes.find((c) => c.id === updated.classId);
          className = selectedClass?.name || '';
        } catch (err) {
          console.error('Failed to assign mentor', err);
        }
      }

      const mapped = {
        id: response.id,
        firstName: response.first_name,
        lastName: response.last_name,
        email: response.email ?? '',
        phone: response.phone ?? '',
        address: response.address ?? '',
        classId:
          updated.classId ??
          (response.class_layout ? response.class_layout.id : null),
        className:
          (className ||
            (response.class_layout ? response.class_layout.name : '')) ??
          '',
        registrationDate: response.created_at ?? '',
        active: response.active ?? false,
      };

      if (updated.id) {
        // Update existing teacher in list
        setTeachers((prev) =>
          prev.map((s) => (s.id === mapped.id ? mapped : s))
        );
      } else {
        // Add new teacher to list
        setTeachers((prev) => [...prev, mapped]);
      }

      setOpenEditProfile(false);
    } catch (e) {
      console.error('Failed to save teacher', e);
    }
  };

  const handleDelete = useCallback(
    async (id) => {
      if (!id) return;
      try {
        await teachersAPI.delete_teacher(id);
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        if (selected?.id === id) {
          setOpenEditProfile(false);
        }
      } catch (e) {
        console.error('Failed to delete teacher', e);
      }
    },
    [selected?.id]
  );

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  const table = useReactTable({
    data: teachers,
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
        title="Docenten"
        icon={<Presentation className="size-9" />}
        description="Beheer hier alle docenten."
        buttonText="Nieuwe docent"
        onAdd={handleAddNew}
      />
      <Toolbar table={table} filterColumn="firstName" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />

      <TeacherViewModal
        open={openViewProfile}
        onOpenChange={setOpenViewProfile}
        teacher={selected}
      />

      <TeacherEditModal
        open={openEditProfile}
        onOpenChange={setOpenEditProfile}
        teacher={selected || {}}
        classes={classes}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
