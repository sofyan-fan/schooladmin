import assessmentApi from '@/apis/assessments/assessmentAPI';
import { createColumns } from '@/components/assessments/columns';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { BookCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NoData = ({ type }) => (
  <TableRow>
    <TableCell colSpan={6} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <BookCheck className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">No {type} Found</h3>
        <p className="text-muted-foreground">
          Get started by adding a new {type.toLowerCase()}.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

const AssessmentTable = ({ data, loading, columns, type }) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
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
    <div>
      <Toolbar table={table} filterColumn="name" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={<NoData type={type} />}
      />
    </div>
  );
};

export default function AssessmentsPage() {
  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [testData, examData] = await Promise.all([
          assessmentApi.get_tests(),
          assessmentApi.get_exams(),
        ]);

        // NOTE: Placeholder for fetching related data
        const mappedTests = testData.map((t) => ({
          ...t,
          class: `Class ${t.classId}`,
          subject: `Subject ${t.subjectId}`,
        }));

        const mappedExams = examData.map((e) => ({
          ...e,
          class: `Class ${e.classId}`,
          subject: `Subject ${e.subjectId}`,
        }));

        if (mounted) {
          setTests(mappedTests);
          setExams(mappedExams);
        }
      } catch (e) {
        console.error('Failed to load assessments', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const testColumns = useMemo(
    () =>
      createColumns({
        onView: () => {},
        onEdit: () => {},
        onDelete: async (id) => {
          try {
            await assessmentApi.delete_test(id);
            setTests((prev) => prev.filter((t) => t.id !== id));
          } catch (error) {
            console.error('Failed to delete test', error);
          }
        },
      }),
    []
  );

  const examColumns = useMemo(
    () =>
      createColumns({
        onView: () => {},
        onEdit: () => {},
        onDelete: async (id) => {
          try {
            await assessmentApi.delete_exam(id);
            setExams((prev) => prev.filter((e) => e.id !== id));
          } catch (error) {
            console.error('Failed to delete exam', error);
          }
        },
      }),
    []
  );

  return (
    <>
      <PageHeader
        title="Toetsen & Examens"
        icon={<BookCheck className="size-9" />}
        description="Beheer hier alle toetsen en examens."
        buttonText="Nieuwe Toets/Examen"
        onAdd={() => {}}
      />
      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        <TabsContent value="tests">
          <AssessmentTable
            data={tests}
            loading={loading}
            columns={testColumns}
            type="Tests"
          />
        </TabsContent>
        <TabsContent value="exams">
          <AssessmentTable
            data={exams}
            loading={loading}
            columns={examColumns}
            type="Exams"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
