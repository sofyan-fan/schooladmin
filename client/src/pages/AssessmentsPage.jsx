import assessmentApi from '@/apis/assessmentAPI';
import classAPI from '@/apis/classAPI';
import subjectAPI from '@/apis/subjectAPI';
import { createColumns } from '@/components/assessments/columns';
// import CreateAssessmentModal from '@/components/assessments/CreateAssessmentModal';
import CreateAssessmentWizard from '@/components/assessments/CreateAssessmentWizard';
import EditAssessmentModal from '@/components/assessments/EditAssessmentModal';
import ViewAssessmentModal from '@/components/assessments/ViewAssessmentModal';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { toast } from 'sonner';

const NoData = ({ type }) => (
  <TableRow>
    <TableCell colSpan={6} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <BookCheck className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">Geen {type} gevonden</h3>
        <p className="text-muted-foreground">
          Voeg een nieuwe {type.toLowerCase()} toe om te beginnen.
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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedType, setSelectedType] = useState('test');
  const [deletingAssessment, setDeletingAssessment] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assessmentData, classData, subjectData] = await Promise.all([
        assessmentApi.getAssessments(),
        classAPI.get_classes(),
        subjectAPI.get_subjects(),
      ]);

      const testData = assessmentData.tests || [];
      const examData = assessmentData.exams || [];
      // Map class and subject names
      const mappedTests = testData.map((t) => {
        const cls = classData.find((c) => c.id === t.classId);
        const subject = subjectData.find((s) => s.id === t.subjectId);
        return {
          ...t,
          class: cls?.name || `Class ${t.classId}`,
          subject: subject?.name || `Subject ${t.subjectId}`,
        };
      });

      console.log('testdata', testData);

      const mappedExams = examData.map((e) => {
        const cls = classData.find((c) => c.id === e.classId);
        const subject = subjectData.find((s) => s.id === e.subjectId);
        return {
          ...e,
          class: cls?.name || `Class ${e.classId}`,
          subject: subject?.name || `Subject ${e.subjectId}`,
        };
      });

      setTests(mappedTests);
      setExams(mappedExams);
    } catch (e) {
      console.error('Failed to load assessments', e);
      toast.error('Laden van toetsen en examens mislukt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleView = (assessment, type) => {
    setSelectedAssessment(assessment);
    setSelectedType(type);
    setIsViewModalOpen(true);
  };

  const handleEdit = (assessment, type) => {
    setSelectedAssessment(assessment);
    setSelectedType(type);
    setIsEditModalOpen(true);
  };

  const handleDelete = (assessment, type) => {
    setSelectedAssessment(assessment);
    setSelectedType(type);
    setDeletingAssessment(assessment);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAssessment) return;

    try {
      if (selectedType === 'test') {
        await assessmentApi.deleteTest(deletingAssessment.id);
        setTests((prev) => prev.filter((t) => t.id !== deletingAssessment.id));
        toast.success(`Toets "${deletingAssessment.name}" is verwijderd`);
      } else {
        await assessmentApi.deleteExam(deletingAssessment.id);
        setExams((prev) => prev.filter((e) => e.id !== deletingAssessment.id));
        toast.success(`Examen "${deletingAssessment.name}" is verwijderd`);
      }
    } catch (error) {
      console.error('Failed to delete assessment', error);
      toast.error('Verwijderen mislukt. Probeer het opnieuw.');
    } finally {
      setDeletingAssessment(null);
      setSelectedAssessment(null);
    }
  };

  const handleSaveAssessment = async (assessmentData) => {
    try {
      const savedAssessment = await assessmentApi.createAssessment(
        assessmentData
      );
      toast.success(
        `${savedAssessment.type} "${savedAssessment.name}" is aangemaakt`
      );

      // We need to refetch class/subject to map names
      // Or we can be smart about it and pass them along from the form
      // For now, let's just refetch for simplicity.
      await fetchData();
    } catch (error) {
      console.error('Failed to save assessment', error);
      toast.error('Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedAssessment(null);
    }
  };

  const testColumns = useMemo(
    () =>
      createColumns({
        onView: (assessment) => handleView(assessment, 'test'),
        onEdit: (assessment) => handleEdit(assessment, 'test'),
        onDelete: (assessment) => handleDelete(assessment, 'test'),
      }),
    []
  );

  const examColumns = useMemo(
    () =>
      createColumns({
        onView: (assessment) => handleView(assessment, 'exam'),
        onEdit: (assessment) => handleEdit(assessment, 'exam'),
        onDelete: (assessment) => handleDelete(assessment, 'exam'),
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
        onAdd={() => setIsCreateModalOpen(true)}
      />
      <Tabs defaultValue="tests">
        <TabsList>
          <TabsTrigger value="tests">Toetsen</TabsTrigger>
          <TabsTrigger value="exams">Examens</TabsTrigger>
        </TabsList>
        <TabsContent value="tests">
          <AssessmentTable
            data={tests}
            loading={loading}
            columns={testColumns}
            type="toets"
          />
        </TabsContent>
        <TabsContent value="exams" className="bg-primary text-white">
          <AssessmentTable
            data={exams}
            loading={loading}
            columns={examColumns}
            type="examen"
          />
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <CreateAssessmentWizard
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSave={handleSaveAssessment}
        />
      )}

      {/* Edit Modal */}
      <EditAssessmentModal
        open={isEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedAssessment(null);
          }
          setIsEditModalOpen(isOpen);
        }}
        onSave={handleSaveAssessment}
        assessment={selectedAssessment}
        type={selectedType}
      />

      {/* View Modal */}
      <ViewAssessmentModal
        open={isViewModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedAssessment(null);
          }
          setIsViewModalOpen(isOpen);
        }}
        assessment={selectedAssessment}
        type={selectedType}
      />

      {/* Delete Confirmation Dialog */}
      {deletingAssessment && (
        <AlertDialog
          open={!!deletingAssessment}
          onOpenChange={() => {
            setDeletingAssessment(null);
            setSelectedAssessment(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
              <AlertDialogDescription>
                Deze actie kan niet ongedaan worden gemaakt. Dit verwijdert de
                {selectedType === 'test' ? ' toets' : ' examen'} "
                {deletingAssessment.name}" definitief.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeletingAssessment(null);
                  setSelectedAssessment(null);
                }}
              >
                Annuleren
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
