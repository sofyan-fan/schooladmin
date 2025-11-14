import classAPI from '@/apis/classAPI';
import resultAPI from '@/apis/resultAPI';
import studentAPI from '@/apis/studentAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { createColumns } from '@/components/students/columns';
import DeleteStudentDialog from '@/components/students/DeleteDialog';
import EditModal from '@/components/students/EditModal';
import ViewModal from '@/components/students/ViewModal';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import RegisterWizardDialog from '@/pages/register/RegisterWizardDialog';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BookOpen, Download, GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [selected, setSelected] = useState(null);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openViewProfile, setOpenViewProfile] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Track mount status to avoid state updates before/after mount in async flows
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await studentAPI.get_students();
        const classesResponse = await classAPI.get_classes();
        if (isMountedRef.current) setClasses(classesResponse);
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
        if (isMountedRef.current) setStudents(mapped);
      } catch (e) {
        console.error('Failed to load students', e);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    })();
  }, []);

  const handleEdit = useCallback((record) => {
    setSelected(record);
    setOpenEditProfile(true);
  }, []);

  const handleView = useCallback((record) => {
    setSelected(record);
    setOpenViewProfile(true);
  }, []);

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

      if (isMountedRef.current) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === updatedStudentForState.id
              ? { ...s, ...updatedStudentForState }
              : s
          )
        );
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        `${updatedStudentForState.firstName} ${updatedStudentForState.lastName} is succesvol bijgewerkt!`
      );

      // Close the modal
      if (isMountedRef.current) setOpenEditProfile(false);
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

  const handleDelete = useCallback((id) => {
    if (!id) return;
    setPendingDeleteId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    const studentToDelete = students.find((s) => s.id === pendingDeleteId);
    const studentName = studentToDelete
      ? `${studentToDelete.firstName} ${studentToDelete.lastName}`
      : 'Leerling';

    const loadingToast = toast.loading('Leerling wordt verwijderd...');

    try {
      await studentAPI.delete_student(pendingDeleteId);
      if (isMountedRef.current) {
        setStudents((prev) => prev.filter((s) => s.id !== pendingDeleteId));
        if (selected?.id === pendingDeleteId) {
          setOpenEditProfile(false);
          setOpenViewProfile(false);
        }
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
      if (isMountedRef.current) {
        setOpenDeleteDialog(false);
        setPendingDeleteId(null);
      }
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

  const NoDataRow = (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <BookOpen className="size-12 text-gray-400" />
          <h3 className="text-xl font-semibold">Geen leerlingen gevonden</h3>
          <p className="text-muted-foreground">
            Begin door een nieuwe leerling toe te voegen.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  const table = useReactTable({
    data: students,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
      columnFilters,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExportSelectedResults = async () => {
    const selectedRows = table.getSelectedRowModel().rows || [];
    if (selectedRows.length === 0) return;

    const loadingToast = toast.loading('Resultaten worden verzameld...');
    try {
      const allResults = await resultAPI.get_results();

      const selectedIds = new Set(
        selectedRows.map((r) => Number(r.original.id))
      );

      const resultsByStudent = Object.create(null);
      (allResults || []).forEach((r) => {
        const sid = Number(r.student_id);
        if (!selectedIds.has(sid)) return;
        if (!resultsByStudent[sid]) resultsByStudent[sid] = [];
        resultsByStudent[sid].push(r);
      });

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'School Admin System';
      workbook.created = new Date();
      workbook.modified = new Date();

      const sanitizeSheetName = (name) => {
        const invalid = /[\\/*?:[\]]/g; // Excel invalid characters
        const trimmed = (name || '').replace(invalid, ' ').trim();
        return trimmed.length > 31
          ? trimmed.slice(0, 31)
          : trimmed || 'Leerling';
      };

      selectedRows.forEach((row) => {
        const s = row.original;
        const sid = Number(s.id);
        const results = resultsByStudent[sid] || [];

        const fullName = [s.firstName, s.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        const sheetName = sanitizeSheetName(fullName || `Student_${sid}`);
        const ws = workbook.addWorksheet(sheetName);

        ws.columns = [
          { header: 'Vak', key: 'module', width: 28 },
          { header: 'Type', key: 'type', width: 12 },
          { header: 'Naam', key: 'name', width: 36 },
          { header: 'Datum', key: 'date', width: 16 },
          { header: 'Cijfer', key: 'grade', width: 10 },
        ];

        const rows = results.map((r) => ({
          module:
            r?.assessment?.subject?.course_module?.name ||
            r?.assessment?.subject?.subject?.name ||
            '—',
          type: r?.assessment?.type === 'test' ? 'Toets' : 'Examen',
          name: r?.assessment?.name || '',
          date: r?.date ? new Date(r.date).toLocaleDateString('nl-NL') : '',
          grade: r?.grade ?? '',
        }));
        ws.addRows(rows);

        const headerRow = ws.getRow(1);
        headerRow.font = { bold: true };
        ws.views = [{ state: 'frozen', ySplit: 1 }];
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `resultaten_geselecteerde_leerlingen_${new Date().toISOString().split('T')[0]
        }.xlsx`;
      saveAs(blob, fileName);

      toast.dismiss(loadingToast);
      toast.success('Download gestart.');
    } catch (e) {
      console.error(e);
      toast.dismiss(loadingToast);
      toast.error('Kon de resultaten niet exporteren. Probeer het opnieuw.');
    }
  };

  return (
    <>
      <PageHeader
        title="Leerlingen"
        icon={<GraduationCap className="size-9" />}
        description="Beheer hier alle leerlingen."
        buttonText="Leerling Toevoegen"
        onAdd={() => setOpenCreateDialog(true)}
      />
      <Toolbar table={table} filterColumn="firstName" />
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/40 p-2">
          <div className="text-sm text-muted-foreground">
            {table.getSelectedRowModel().rows.length} geselecteerd
          </div>
          <Button onClick={handleExportSelectedResults}>
            <Download className="mr-2 h-4 w-4" />
            Download resultaten
          </Button>
        </div>
      )}
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoDataRow}
      />

      <RegisterWizardDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        title="Nieuwe Leerling Registreren"
        initialRole="student"
        lockRole
        silent
        createStudentOnly
        onSuccess={({ student }) => {
          const mapped = {
            id: student.id,
            firstName: student.first_name,
            lastName: student.last_name,
            email: student.parent_email ?? '',
            parentName: student.parent_name ?? '',
            phone: student.phone ?? '',
            address: student.address ?? '',
            postalCode: student.postal_code ?? '',
            city: student.city ?? '',
            birthDate: student.birth_date ?? '',
            gender: student.gender ?? '',
            classId: student.class_id ?? null,
            className: '',
            registrationDate: student.created_at ?? '',
            lessonPackage: student.lesson_package ?? '',
            status: student.enrollment_status ? 'Active' : 'Inactive',
          };
          setStudents((prev) => [mapped, ...prev]);
          setOpenCreateDialog(false);
          toast.success(
            `${mapped.firstName} ${mapped.lastName} is succesvol toegevoegd!`
          );
        }}
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
