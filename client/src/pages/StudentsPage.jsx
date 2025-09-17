import classAPI from '@/apis/classAPI';
import studentAPI from '@/apis/studentAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { createColumns } from '@/components/students/columns';
import DeleteStudentDialog from '@/components/students/DeleteDialog';
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
import { toast } from 'sonner';

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
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openViewProfile, setOpenViewProfile] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

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
        const classesResponse = await classAPI.get_classes();
        setClasses(classesResponse);
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
              classId: s.class_id ?? s.class_layout?.id ?? null,
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
    // Show loading toast
    const loadingToast = toast.loading('Leerling wordt bijgewerkt...');

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
      class_id: updated.classId,
      // Note: course_id is not a direct field on student - it's accessed through class_layout
    };

    Object.keys(apiPayload).forEach(
      (key) => apiPayload[key] === undefined && delete apiPayload[key]
    );

    try {
      const response = await studentAPI.update_student(updated.id, apiPayload);

      // If classId was updated, fetch the class name
      let className = '';
      if (updated.classId) {
        const selectedClass = classes.find((c) => c.id === updated.classId);
        className = selectedClass?.name || '';
      }

      const updatedStudentForState = {
        id: response.id,
        firstName: response.first_name || updated.firstName,
        lastName: response.last_name || updated.lastName,
        email: response.parent_email ?? updated.email ?? '',
        parentName: response.parent_name ?? '',
        phone: response.phone ?? updated.phone ?? '',
        address: response.address ?? updated.address ?? '',
        postalCode: response.postal_code ?? updated.postalCode ?? '',
        city: response.city ?? updated.city ?? '',
        birthDate: response.birth_date ?? '',
        gender: response.gender ?? '',
        className: className || response.class_layout?.name || '',
        classId: response.class_id || updated.classId,
        registrationDate: response.created_at ?? '',
        lessonPackage: response.lesson_package ?? '',
        status:
          updated.status ||
          (response.enrollment_status ? 'Active' : 'Inactive'),
      };

      setStudents((prev) =>
        prev.map((s) =>
          s.id === updatedStudentForState.id
            ? { ...s, ...updatedStudentForState }
            : s
        )
      );

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        `${updatedStudentForState.firstName} ${updatedStudentForState.lastName} is succesvol bijgewerkt!`
      );

      // Close the modal
      setOpenEditProfile(false);
    } catch (error) {
      console.error('Failed to update student', error);
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error(
        'Er is een fout opgetreden bij het bijwerken van de leerling. Probeer het opnieuw.'
      );
    }
  };

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleDelete = (id) => {
    if (!id) return;
    setPendingDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    const studentToDelete = students.find((s) => s.id === pendingDeleteId);
    const studentName = studentToDelete
      ? `${studentToDelete.firstName} ${studentToDelete.lastName}`
      : 'Leerling';

    const loadingToast = toast.loading('Leerling wordt verwijderd...');

    try {
      await studentAPI.delete_student(pendingDeleteId);
      setStudents((prev) => prev.filter((s) => s.id !== pendingDeleteId));
      if (selected?.id === pendingDeleteId) {
        setOpenEditProfile(false);
        setOpenViewProfile(false);
      }
      toast.dismiss(loadingToast);
      toast.success(`${studentName} is succesvol verwijderd.`);
    } catch (error) {
      console.error('Failed to delete student', error);
      toast.dismiss(loadingToast);
      toast.error(
        'Er is een fout opgetreden bij het verwijderen van de leerling. Probeer het opnieuw.'
      );
    } finally {
      setOpenDeleteDialog(false);
      setPendingDeleteId(null);
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
        student={selected}
        classes={classes}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <DeleteStudentDialog
        isOpen={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        studentName={
          selected
            ? `${selected.firstName ?? ''} ${selected.lastName ?? ''}`.trim()
            : ''
        }
      />
    </>
  );
}
