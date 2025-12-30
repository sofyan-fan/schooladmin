import mentorAPI from '@/apis/mentorAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { createMentorColumns } from '@/components/students/mentorColumns';
import ViewModal from '@/components/students/ViewModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { BookOpen, GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function MentorStudentsPage() {
  const [mentorClass, setMentorClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState('');

  const [selected, setSelected] = useState(null);
  const [openViewProfile, setOpenViewProfile] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

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
      setAccessError('');
      setMentorClass(null);
      try {
        const payload = await mentorAPI.get_mentor_students();
        const mc = payload?.mentor_class || null;
        const rawStudents = Array.isArray(payload?.students)
          ? payload.students
          : [];

        const mapped = rawStudents.map((s) => ({
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
          className: s.class_layout?.name ?? mc?.name ?? '',
          registrationDate: s.created_at ?? '',
          lessonPackage: s.lesson_package ?? '',
          status: s.enrollment_status ? 'Active' : 'Inactive',
        }));

        if (isMountedRef.current) {
          setMentorClass(mc);
          setStudents(mapped);
        }
      } catch (e) {
        console.error('Failed to load mentor students', e);
        const msg =
          e?.response?.data?.message ||
          'Kon je leerlingen niet laden. Mogelijk ben je geen mentor van een klas.';
        if (isMountedRef.current) {
          setStudents([]);
          setMentorClass(null);
          setAccessError(msg);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    })();
  }, []);

  const handleView = useCallback((record) => {
    setSelected(record);
    setOpenViewProfile(true);
  }, []);

  const columns = useMemo(
    () =>
      createMentorColumns({
        onView: handleView,
        detailsBasePath: '/mijn-leerlingen',
      }),
    [handleView]
  );

  const NoDataRow = (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <BookOpen className="size-12 text-gray-400" />
          <h3 className="text-xl font-semibold">Geen leerlingen gevonden</h3>
          <p className="text-muted-foreground">
            Er zijn nog geen leerlingen gekoppeld aan jouw mentorklas.
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
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: false,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Mijn leerlingen"
        icon={<GraduationCap className="size-9" />}
        description={
          mentorClass?.name
            ? `Leerlingen uit jouw mentorklas: ${mentorClass.name}`
            : 'Leerlingen uit jouw mentorklas.'
        }
      />

      {accessError ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Geen toegang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{accessError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Toolbar table={table} filterColumn="firstName" />

      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoDataRow}
      />

      <ViewModal
        open={openViewProfile}
        onOpenChange={setOpenViewProfile}
        student={selected}
        detailsBasePath="/mijn-leerlingen"
      />
    </>
  );
}



