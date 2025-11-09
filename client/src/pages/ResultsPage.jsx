import assessmentApi from '@/apis/assessmentAPI';
import classAPI from '@/apis/classAPI';
import moduleAPI from '@/apis/moduleAPI';
import resultAPI from '@/apis/resultAPI';
import AssessmentResultCard from '@/components/results/AssessmentResultCard';
import EditResultModal from '@/components/results/EditResultModal';
import ManageResultsModal from '@/components/results/ManageResultsModal';
import ResultsFilters from '@/components/results/ResultsFilters';
// import StudentResultCard from '@/components/results/StudentResultCard';
import AssessmentsResultTable from '@/components/results/AssessmentsResultTable';
import StudentsResultTable from '@/components/results/StudentsResultTable';
import PageHeader from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import { BarChart } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ResultsPage = () => {
  const [view, setView] = useState('assessments');
  const [assessments, setAssessments] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [assessmentsLayout, setAssessmentsLayout] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    class: 'all',
    subject: 'all',
    assessment: 'all',
    gradeRange: 'all',
    status: 'all',
  });

  useEffect(() => {
    const fetchResultsData = async () => {
      setLoading(true);
      try {
        const [assessmentData, classData, resultsData, modulesData] =
          await Promise.all([
            assessmentApi.getAssessments(),
            classAPI.get_classes(),
            resultAPI.get_results(),
            moduleAPI.get_modules(),
          ]);

        setClasses(classData);

        const classesById = classData.reduce((acc, cls) => {
          acc[cls.id] = cls;
          return acc;
        }, {});

        const flattenedSubjects = modulesData.flatMap((module) =>
          module.subjects.map((subject) => ({
            id: subject.id,
            name: module.name || 'Module onbekend',
          }))
        );

        const enrichedAssessments = assessmentData.data.map((assessment) => {
          const classInfo = classesById[assessment.class_id];
          const subjectInfo = flattenedSubjects.find(
            (s) => s.id === assessment.subject_id
          );
          return {
            ...assessment,
            moduleName: subjectInfo?.name || 'Module onbekend',
            class_layout: {
              ...assessment.class_layout,
              student_count: classInfo ? classInfo.students.length : 0,
            },
          };
        });
        setAssessments(enrichedAssessments);
        // filtered lists are derived via useMemo

        const studentsById = classData
          .flatMap((c) => c.students)
          .reduce((acc, st) => {
            const studentClass = classData.find((c) => c.id === st.class_id);
            acc[st.id] = { ...st, class_layout: studentClass };
            return acc;
          }, {});
        const enrichedResults = resultsData.map((result) => ({
          ...result,
          student: studentsById[result.student_id] || result.student,
        }));
        setAllResults(enrichedResults);
        // filtered lists are derived via useMemo
      } catch (error) {
        console.error('Error fetching results data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResultsData();
  }, []);

  const handleAssessmentCardClick = useCallback((assessment) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  }, []);

  const handleStudentCardClick = useCallback((result) => {
    setSelectedResult(result);
    setIsEditModalOpen(true);
  }, []);

  const handleViewChange = useCallback((newView) => {
    if (newView) setView(newView);
  }, []);

  const handleResultSave = useCallback((updatedResult) => {
    // Instead of replacing the object, we merge the new data with the existing object
    // to preserve the nested 'student' information.
    const updateLogic = (results) =>
      results.map((r) => {
        if (r.id === updatedResult.id) {
          return {
            ...r, // Keep the old data (including the student object)
            ...updatedResult, // Overwrite with new data (like the updated grade)
          };
        }
        return r;
      });

    setAllResults((prevResults) => updateLogic(prevResults));
  }, []);

  const handleResultsSaved = useCallback(async () => {
    // Refresh the results data after saving multiple results from ManageResultsModal
    try {
      const resultsData = await resultAPI.get_results();

      const classesById = classes.reduce((acc, cls) => {
        acc[cls.id] = cls;
        return acc;
      }, {});

      const studentsById = classes
        .flatMap((c) => c.students)
        .reduce((acc, st) => {
          const studentClass = classes.find((c) => c.id === st.class_id);
          acc[st.id] = { ...st, class_layout: studentClass };
          return acc;
        }, {});

      const enrichedResults = resultsData.map((result) => ({
        ...result,
        student: studentsById[result.student_id] || result.student,
      }));

      setAllResults(enrichedResults);

      // Also update the assessments to reflect the new result counts
      const enrichedAssessments = assessments.map((assessment) => {
        const assessmentResults = enrichedResults.filter(
          (r) => r.assessment_id === assessment.id
        );
        return {
          ...assessment,
          class_layout: {
            ...assessment.class_layout,
            student_count: classesById[assessment.class_id]
              ? classesById[assessment.class_id].students.length
              : 0,
          },
          results: assessmentResults,
        };
      });

      setAssessments(enrichedAssessments);
    } catch (error) {
      console.error('Error refreshing results data:', error);
    }
  }, [classes, assessments]);

  // Derived filtering logic
  const filteredAssessments = useMemo(() => {
    if (view !== 'assessments') return assessments;
    const searchTerm = filters.search.toLowerCase();
    return assessments.filter((assessment) => {
      const matchesSearch =
        searchTerm === '' ||
        assessment.name.toLowerCase().includes(searchTerm) ||
        assessment.subject?.subject?.name.toLowerCase().includes(searchTerm);
      const matchesClass =
        filters.class === 'all' ||
        assessment.class_layout?.name === filters.class;
      const matchesSubject =
        filters.subject === 'all' ||
        assessment.subject?.subject?.name === filters.subject;
      const gradedStudents = assessment.results?.length || 0;
      const totalStudents = assessment.class_layout?.student_count || 0;
      let matchesStatus = true;
      if (filters.status === 'pending')
        matchesStatus = gradedStudents < totalStudents && gradedStudents > 0;
      else if (filters.status === 'not_started')
        matchesStatus = gradedStudents === 0;
      else if (filters.status === 'completed')
        matchesStatus = gradedStudents === totalStudents;
      return matchesSearch && matchesClass && matchesSubject && matchesStatus;
    });
  }, [assessments, filters, view]);

  const filteredResults = useMemo(() => {
    if (view !== 'students') return allResults;
    const searchTerm = filters.search.toLowerCase();
    return allResults.filter((result) => {
      const studentName =
        `${result.student.first_name} ${result.student.last_name}`.toLowerCase();
      const matchesSearch = searchTerm === '' || studentName.includes(searchTerm);
      const matchesClass =
        filters.class === 'all' ||
        result.student.class_layout?.name === filters.class;
      const matchesAssessment =
        filters.assessment === 'all' ||
        result.assessment_name === filters.assessment;
      const grade = result.grade;
      let matchesGrade = true;
      if (filters.gradeRange === 'excellent') matchesGrade = grade >= 8;
      else if (filters.gradeRange === 'good')
        matchesGrade = grade >= 6.5 && grade < 8;
      else if (filters.gradeRange === 'sufficient')
        matchesGrade = grade >= 5.5 && grade < 6.5;
      else if (filters.gradeRange === 'insufficient')
        matchesGrade = grade < 5.5;
      return matchesSearch && matchesClass && matchesAssessment && matchesGrade;
    });
  }, [allResults, filters, view]);

  const renderAssessmentsView = () => {
    if (assessmentsLayout === 'table') {
      return (
        <AssessmentsResultTable
          data={filteredAssessments}
          onSelect={handleAssessmentCardClick}
        />
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssessments.map((assessment) => (
          <AssessmentResultCard
            key={assessment.id}
            assessment={assessment}
            onSelect={() => handleAssessmentCardClick(assessment)}
          />
        ))}
      </div>
    );
  };

  const renderStudentsView = () => (
    // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    //   {filteredResults.map((result) => (
    //     <StudentResultCard
    //       key={result.id}
    //       result={result}
    //       onClick={() => handleStudentCardClick(result)}
    //     />
    //   ))}
    // </div>
    <StudentsResultTable
      data={filteredResults}
      onEditResult={handleStudentCardClick}
    />
  );

  if (loading) return <div>Laden...</div>;

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Resultaten"
          icon={<BarChart className="size-9" />}
          description="Beheer hier alle beoordelingen en hun resultaten."
          className={cn('mb-2')}
        />

        <div className="bg-transparent rounded-lg p-0">
          <ResultsFilters
            view={view}
            onViewChange={handleViewChange}
            assessments={assessments}
            classes={classes}
            assessmentsLayout={assessmentsLayout}
            onAssessmentsLayoutChange={setAssessmentsLayout}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {view === 'assessments'
              ? `${filteredAssessments.length} of ${assessments.length} assessments shown`
              : `${filteredResults.length} of ${allResults.length} results shown`}
          </div>
        </div> */}
        {/* ViewToggle is now inside ResultsFilters */}

        {view === 'assessments'
          ? renderAssessmentsView()
          : renderStudentsView()}
      </div>

      {selectedAssessment && (
        <ManageResultsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          assessment={selectedAssessment}
          onResultsSaved={handleResultsSaved}
        />
      )}

      {selectedResult && (
        <EditResultModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          result={selectedResult}
          onSave={handleResultSave}
        />
      )}
    </>
  );
};

export default ResultsPage;
