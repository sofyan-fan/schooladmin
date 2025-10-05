import assessmentApi from '@/apis/assessmentAPI';
import classAPI from '@/apis/classAPI';
import moduleAPI from '@/apis/moduleAPI';
import resultAPI from '@/apis/resultAPI';
import ManageResultsModal from '@/components/assessments/ManageResultsModal';
import AssessmentResultCard from '@/components/results/AssessmentResultCard';
import EditResultModal from '@/components/results/EditResultModal';
import ResultsFilters from '@/components/results/ResultsFilters';
// import StudentResultCard from '@/components/results/StudentResultCard';
import AssessmentsResultTable from '@/components/results/AssessmentsResultTable';
import StudentsResultTable from '@/components/results/StudentsResultTable';
import PageHeader from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import { BarChart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const ResultsPage = () => {
  const [view, setView] = useState('assessments');
  const [assessments, setAssessments] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [assessmentsLayout, setAssessmentsLayout] = useState('grid');

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
        setFilteredAssessments(enrichedAssessments);

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
        setFilteredResults(enrichedResults);
      } catch (error) {
        console.error('Error fetching results data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResultsData();
  }, []);

  const handleAssessmentCardClick = (assessment) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  const handleStudentCardClick = (result) => {
    setSelectedResult(result);
    setIsEditModalOpen(true);
  };

  const handleViewChange = (newView) => {
    if (newView) setView(newView);
  };

  const handleFilterChange = useCallback(
    ({ filteredAssessments, filteredResults }) => {
      setFilteredAssessments(filteredAssessments);
      setFilteredResults(filteredResults);
    },
    []
  );

  const handleResultSave = (updatedResult) => {
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
    setFilteredResults((prevFilteredResults) =>
      updateLogic(prevFilteredResults)
    );
  };

  const handleResultsSaved = async () => {
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
      setFilteredResults(enrichedResults);

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
      setFilteredAssessments(enrichedAssessments);
    } catch (error) {
      console.error('Error refreshing results data:', error);
    }
  };

  const renderAssessmentsView = () => {
    if (assessmentsLayout === 'table') {
      return (
        <AssessmentsResultTable
          data={filteredAssessments}
          onSelect={(assessment) => handleAssessmentCardClick(assessment)}
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

  if (loading) return <div>Loading...</div>;

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
            results={allResults}
            onFilterChange={handleFilterChange}
            classes={classes}
            assessmentsLayout={assessmentsLayout}
            onAssessmentsLayoutChange={setAssessmentsLayout}
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
