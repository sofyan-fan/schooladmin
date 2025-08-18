import courseApi from '@/apis/courses/courseAPI';
import moduleApi from '@/apis/modules/moduleAPI';
import { CourseCard } from '@/components/courses/CourseCard'; // You will create this
import CreateEditCourseModal from '@/components/courses/CreateEditCourseModal'; // You will create this
import ViewCourseDialog from '@/components/courses/ViewCourseDialog';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
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
import { Button } from '@/components/ui/button';
import { Layers3, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const CoursesPage = () => {
  // State for data
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]); // Needed for the create/edit modal

  // State for UI management
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [courseToView, setCourseToView] = useState(null);

  // Fetch initial data (both courses and modules)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiError('');
      try {
        // Fetch both courses and the modules needed for the form in parallel
        const [coursesData, modulesData] = await Promise.all([
          courseApi.get_courses(),
          moduleApi.get_modules(),
        ]);
        const enrichedCourses = coursesData.map((course) => ({
          ...course,
          modules: course.moduleIds
            ? course.moduleIds
                .map((id) => modulesData.find((m) => m.id === id))
                .filter(Boolean)
            : [],
        }));
        setCourses(enrichedCourses);
        setModules(modulesData);
      } catch (e) {
        setApiError(e.message || 'Kon de gegevens niet laden.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshCourses = async () => {
    try {
      const data = await courseApi.get_courses();
      // Manually enrich courses with modules, since the mock API doesn't do this by default
      const enrichedCourses = data.map((course) => ({
        ...course,
        modules: course.moduleIds
          .map((id) => modules.find((m) => m.id === id))
          .filter(Boolean), // Filter out any unfound modules
      }));
      setCourses(enrichedCourses);
    } catch (e) {
      setApiError(e.message || 'Kon de lespakketten niet vernieuwen.');
    }
  };

  // --- API Handlers ---

  const handleSaveCourse = async (courseData) => {
    // This function handles both create and update
    try {
      if (courseToEdit) {
        await courseApi.edit_course({ ...courseData, id: courseToEdit.id });
      } else {
        await courseApi.add_course(courseData);
      }
      await refreshCourses();
      // Close the relevant modal
      setIsCreateModalOpen(false);
      setCourseToEdit(null);
    } catch (e) {
      // Pass the error to the modal to display it there
      throw new Error(e.message || 'Kon het lespakket niet opslaan.');
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await courseApi.delete_course(courseToDelete.id);
      await refreshCourses();
      setCourseToDelete(null); // Close dialog on success
    } catch (e) {
      setApiError(e.message || 'Kon het lespakket niet verwijderen.');
    }
  };

  // --- UI Click Handlers ---

  const handleEditClick = (course) => setCourseToEdit(course);
  const handleDeleteClick = (course) => setCourseToDelete(course);
  const handleViewClick = (course) => setCourseToView(course);

  // --- Render Logic ---

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-muted-foreground mt-8">
          Modules worden geladen...
        </div>
      );
    }

    if (apiError && courses.length === 0) {
      return <div className="text-center text-red-600 mt-8">{apiError}</div>;
    }

    if (!courses || courses.length === 0) {
      return (
        <div className="text-center text-muted-foreground mt-8">
          Geen lespakketten gevonden. Klik op "Lespakket toevoegen" om er een te
          maken.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={() => handleEditClick(course)}
            onDelete={() => handleDeleteClick(course)}
            onView={() => handleViewClick(course)}
          />
        ))}
      </div>
    );
  };

  return (
    <LayoutWrapper>
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Layers3 className="size-9" />
              <h1 className="text-3xl font-[530] tracking-tight">
                Lespakketten
              </h1>
            </div>
            <p className="text-muted-foreground">
              Beheer de commerciële lespakketten die studenten kunnen afnemen.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Lespakket toevoegen
          </Button>
        </div>

        {apiError && courses.length > 0 && (
          <p className="text-red-600 mb-4">{apiError}</p>
        )}
        {renderContent()}
      </div>

      {/* --- Modals & Dialogs --- */}

      {/* Create or Edit Dialog */}
      {(isCreateModalOpen || courseToEdit) && (
        <CreateEditCourseModal
          open={isCreateModalOpen || !!courseToEdit}
          onOpenChange={() => {
            setIsCreateModalOpen(false);
            setCourseToEdit(null);
          }}
          onSave={handleSaveCourse}
          availableModules={modules}
          course={courseToEdit} // Pass the course object if in edit mode
        />
      )}

      {/* View Dialog */}
      <ViewCourseDialog
        open={!!courseToView}
        onOpenChange={() => setCourseToView(null)}
        course={courseToView}
      />

      {/* Delete Confirmation Dialog */}
      {courseToDelete && (
        <AlertDialog
          open={!!courseToDelete}
          onOpenChange={() => setCourseToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Weet u het zeker?</AlertDialogTitle>
              <AlertDialogDescription>
                Deze actie kan niet ongedaan worden gemaakt. Dit zal het
                lespakket '{courseToDelete.name}' permanent verwijderen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCourse}>
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </LayoutWrapper>
  );
};

export default CoursesPage;
