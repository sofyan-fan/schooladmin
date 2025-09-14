import studentAPI from '@/apis/studentAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { createColumns } from '@/components/students/columns';
import EditModal from '@/components/students/EditModal';
import ViewModal from '@/components/students/ViewModal';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NoData = (
  <TableRow>
    <TableCell colSpan={6} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <BookOpen className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">No Students Found</h3>
        <p className="text-muted-foreground">
          Get started by adding a new student.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const response = await studentAPI.get_students();
        const mapped = Array.isArray(response)
          ? response.map((s) => ({
              id: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              email: s.parent_email ?? '',
              parentName: s.parent_name ?? '',
              phone: s.phone ?? '',
              address: s.address ?? '',
              postalCode: s.postal_code ?? '',
              city: s.city ?? '',
              birthDate: s.birth_date ?? '',
              gender: s.gender ?? '',
              className: s.class_layout?.name ?? '',
              registrationDate: s.created_at ?? '',
              lessonPackage: s.lesson_package ?? '',
              status: s.enrollment_status ? 'Active' : 'Inactive',
            }))
          : [];
        if (mounted) setStudents(mapped);
      } catch (e) {
        console.error('Failed to load students', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEditProfile(true);
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenViewProfile(true);
  };

  const handleSave = async (updated) => {
    const apiPayload = {
      first_name: updated.firstName,
      last_name: updated.lastName,
      birth_date: updated.birthDate ? new Date(updated.birthDate) : undefined,
      gender: updated.gender,
      address: updated.address,
      postal_code: updated.postalCode,
      city: updated.city,
      phone: updated.phone,
      parent_name: updated.parentName,
      parent_email: updated.email,
      lesson_package: updated.lessonPackage,
      enrollment_status: updated.status === 'Active',
    };

    Object.keys(apiPayload).forEach(
      (key) => apiPayload[key] === undefined && delete apiPayload[key]
    );

    try {
      const response = await studentAPI.update_student(updated.id, apiPayload);

      const updatedStudentForState = {
        id: response.id,
        firstName: response.first_name,
        lastName: response.last_name,
        email: response.parent_email ?? '',
        parentName: response.parent_name ?? '',
        phone: response.phone ?? '',
        address: response.address ?? '',
        postalCode: response.postal_code ?? '',
        city: response.city ?? '',
        birthDate: response.birth_date ?? '',
        gender: response.gender ?? '',
        className: response.class_layout?.name ?? '',
        registrationDate: response.created_at ?? '',
        lessonPackage: response.lesson_package ?? '',
        status: response.enrollment_status ? 'Active' : 'Inactive',
      };

      setStudents((prev) =>
        prev.map((s) =>
          s.id === updatedStudentForState.id
            ? { ...s, ...updatedStudentForState }
            : s
        )
      );
      console.log('updatedStudentForState', updatedStudentForState);
    } catch (error) {
      console.error('Failed to update student', error);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    try {
      await studentAPI.delete_student(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) {
        setOpenEditProfile(false);
        setOpenViewProfile(false);
      }
    } catch (error) {
      console.error('Failed to delete student', error);
    }
  };

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
    data: students,
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
        title="Leerlingen"
        icon={<GraduationCap className="size-9" />}
        description="Beheer hier alle leerlingen."
        buttonText="Nieuwe leerling"
        onAdd={() => {}}
      />
      <Toolbar table={table} filterColumn="firstName" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />

      <ViewModal
        open={openViewProfile}
        onOpenChange={setOpenViewProfile}
        student={selected}
      />

      <EditModal
        open={openEditProfile}
        onOpenChange={setOpenEditProfile}
        user={selected}
        onSave={handleSave}
        onDelete={handleDelete}
        viewDateOnly={false}
      />
    </>
  );
}
