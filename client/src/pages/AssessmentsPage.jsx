import assessmentApi from '@/apis/assessmentAPI';
import classAPI from '@/apis/classAPI';
import moduleAPI from '@/apis/moduleAPI';
import resultAPI from '@/apis/resultAPI';
import { createColumns } from '@/components/assessments/columns';
import CreateModal from '@/components/assessments/CreateModal';
import EditModal from '@/components/assessments/EditModal';
import ManageResultsModal from '@/components/assessments/ManageResultsModal';
import ViewModal from '@/components/assessments/ViewModal';
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

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isManageResultsModalOpen, setIsManageResultsModalOpen] =
    useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedType, setSelectedType] = useState('test');
  const [deletingAssessment, setDeletingAssessment] = useState(null);

  // States for tests table
  const [testSorting, setTestSorting] = useState([]);
  const [testColumnFilters, setTestColumnFilters] = useState([]);
  const [testColumnVisibility, setTestColumnVisibility] = useState({});
  const [testPagination, setTestPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // States for exams table
  const [examSorting, setExamSorting] = useState([]);
  const [examColumnFilters, setExamColumnFilters] = useState([]);
  const [examColumnVisibility, setExamColumnVisibility] = useState({});
  const [examPagination, setExamPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assessmentData, classData, modulesData] = await Promise.all([
        assessmentApi.getAssessments(),
        classAPI.get_classes(),
        moduleAPI.get_modules(),
      ]);

      const assessmentResponses = assessmentData.data;
      console.log('Assessment Responses', assessmentResponses);
      const tests = assessmentResponses.filter((type) => type.type === 'Test');
      const exams = assessmentResponses.filter((type) => type.type === 'Exam');

      const testData = tests || [];
      const examData = exams || [];

      const flattenedSubjects = modulesData.flatMap((module) =>
        module.subjects.map((subject) => ({
          id: subject.id, // keep the subject relation id
          name: `${subject.subject?.name || 'Vak onbekend'} - ${subject.level}`, // subject name and level
        }))
      );

      // Map class and subject names
      const mappedTests = testData.map((t) => {
        const cls = classData.find((c) => c.id === t.class_id);
        const subjectInfo = flattenedSubjects.find(
          (s) => s.id === t.subject_id
        );
        return {
          ...t,
          class: cls?.name || `Klas ${t.class_id}`,
          subject: subjectInfo?.name || `Vak ${t.subject_id}`,
          maxScore: t.maxScore || t.leverage || '—',
        };
      });

      const mappedExams = examData.map((e) => {
        const cls = classData.find((c) => c.id === e.class_id);
        const subjectInfo = flattenedSubjects.find(
          (s) => s.id === e.subject_id
        );
        return {
          ...e,
          class: cls?.name || `Klas ${e.class_id}`,
          subject: subjectInfo?.name || `Vak ${e.subject_id}`,
          maxScore: e.maxScore || e.leverage || '—',
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

  const handleManageResults = (assessment) => {
    setSelectedAssessment(assessment);
    setIsManageResultsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAssessment) return;

    try {
      // First, delete all results associated with this assessment
      const allResults = await resultAPI.get_results();
      const assessmentResults = allResults.filter(
        (result) => result.assessment_id === deletingAssessment.id
      );

      // Delete all related results first
      if (assessmentResults.length > 0) {
        await Promise.all(
          assessmentResults.map((result) => resultAPI.delete_result(result.id))
        );
      }

      // Then delete the assessment
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
      let response;
      if (assessmentData.id) {
        response = await assessmentApi.updateAssessment(
          assessmentData.id,
          assessmentData
        );
        toast.success(
          `${response.data.type === 'Test' ? 'Toets' : 'Examen'} "${
            response.data.name
          }" is bijgewerkt`
        );
      } else {
        response = await assessmentApi.createAssessment(assessmentData);
        toast.success(
          `${response.data.type} "${response.data.name}" is aangemaakt`
        );
      }

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
        onManageResults: (assessment) => handleManageResults(assessment),
      }),
    []
  );

  const examColumns = useMemo(
    () =>
      createColumns({
        onView: (assessment) => handleView(assessment, 'exam'),
        onEdit: (assessment) => handleEdit(assessment, 'exam'),
        onDelete: (assessment) => handleDelete(assessment, 'exam'),
        onManageResults: (assessment) => handleManageResults(assessment),
      }),
    []
  );

  const testsTable = useReactTable({
    data: tests,
    columns: testColumns,
    state: {
      sorting: testSorting,
      columnVisibility: testColumnVisibility,
      pagination: testPagination,
      columnFilters: testColumnFilters,
    },
    onPaginationChange: setTestPagination,
    onSortingChange: setTestSorting,
    onColumnFiltersChange: setTestColumnFilters,
    onColumnVisibilityChange: setTestColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const examsTable = useReactTable({
    data: exams,
    columns: examColumns,
    state: {
      sorting: examSorting,
      columnVisibility: examColumnVisibility,
      pagination: examPagination,
      columnFilters: examColumnFilters,
    },
    onPaginationChange: setExamPagination,
    onSortingChange: setExamSorting,
    onColumnFiltersChange: setExamColumnFilters,
    onColumnVisibilityChange: setExamColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Toetsen & Examens"
        icon={<BookCheck className="size-9" />}
        description="Beheer hier alle toetsen en examens."
        buttonText="Nieuwe Toets/Examen"
        onAdd={() => setIsCreateModalOpen(true)}
      />
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue="tests"
        className="space-y-4"
      >
        <div className="flex justify-between items-center mb-0 ">
          <TabsList className="gap-2">
            <TabsTrigger
              value="tests"
              className="px-4 py-2 hover:cursor-pointer rounded-md text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted"
            >
              Toetsen
            </TabsTrigger>
            <TabsTrigger
              value="exams"
              className="px-4 py-2 hover:cursor-pointer rounded-md text-sm font-medium transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted"
            >
              Examens
            </TabsTrigger>
          </TabsList>
          {activeTab === 'tests' ? (
            <Toolbar table={testsTable} filterColumn="name" />
          ) : (
            <Toolbar table={examsTable} filterColumn="name" />
          )}
        </div>
        <TabsContent value="tests">
          <DataTable
            table={testsTable}
            loading={loading}
            columns={testColumns}
            NoDataComponent={<NoData type="toets" />}
          />
        </TabsContent>
        <TabsContent value="exams">
          <DataTable
            table={examsTable}
            loading={loading}
            columns={examColumns}
            NoDataComponent={<NoData type="examen" />}
          />
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <CreateModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSave={handleSaveAssessment}
        />
      )}

      {/* Edit Modal */}
      <EditModal
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
      <ViewModal
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

      {/* Manage Results Modal */}
      <ManageResultsModal
        open={isManageResultsModalOpen}
        onOpenChange={setIsManageResultsModalOpen}
        assessment={selectedAssessment}
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
