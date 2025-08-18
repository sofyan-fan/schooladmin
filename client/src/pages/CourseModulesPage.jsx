import subjectAPI from '@/apis/subjects/subjectAPI';
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
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import courseModuleApi from '../apis/courses/courseModuleAPI';
import { CourseModuleCard } from '../components/courses/CourseModuleCard';
import CourseModuleModal from '../components/courses/CourseModuleModal';

const CourseModulesPage = () => {
  const [courseModules, setCourseModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiError('');
      try {
        const [modulesData, subjectsData] = await Promise.all([
          courseModuleApi.get_coursemodules(),
          subjectAPI.get_subjects(),
        ]);
        setCourseModules(modulesData);
        setSubjects(subjectsData);
      } catch (e) {
        setApiError(e.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveCourseModule = async (newCourseModule) => {
    try {
      await courseModuleApi.add_coursemodule(newCourseModule);
      const data = await courseModuleApi.get_coursemodules();
      setCourseModules(data);
      setIsModalOpen(false);
      setSelectedModule(null);
    } catch (e) {
      setApiError(e.message || 'Failed to add course module.');
    }
  };

  const handleEditClick = (module) => {
    setSelectedModule(module);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (module) => {
    setSelectedModule(module);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdateCourseModule = async (updatedModule) => {
    try {
      await courseModuleApi.edit_coursemodule(updatedModule);
      const data = await courseModuleApi.get_coursemodules();
      setCourseModules(data);
      setIsEditModalOpen(false);
      setSelectedModule(null);
    } catch (e) {
      setApiError(e.message || 'Failed to update course module.');
    }
  };

  const handleViewClick = (module) => {
    if (isViewModalOpen) {
      setIsViewModalOpen(false);
    }
    setSelectedModule(module);
  };

  const handleDeleteCourseModule = async () => {
    if (!selectedModule) return;
    try {
      await courseModuleApi.delete_coursemodule(selectedModule.id);
      const data = await courseModuleApi.get_coursemodules();
      setCourseModules(data);
      setIsDeleteDialogOpen(false);
      setSelectedModule(null);
    } catch (e) {
      setApiError(e.message || 'Failed to delete course module.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-muted-foreground mt-8">
          Loading course modules...
        </div>
      );
    }

    if (apiError) {
      return <div className="text-center text-red-600 mt-8">{apiError}</div>;
    }

    if (!courseModules || courseModules.length === 0) {
      return (
        <div className="text-center text-muted-foreground mt-8">
          No course modules found. Click "Lespakket toevoegen" to create one.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courseModules.map((module) => (
          <CourseModuleCard
              key={module.id}
              module={module}
              onView={() => handleViewClick(module)}
              onEdit={() => handleEditClick(module)}
              onDelete={() => handleDeleteClick(module)}
          />
      ))}
  </div>
    );
  };

  return (
    <LayoutWrapper>
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lespakketten</h1>
            <p className="text-muted-foreground">
              Beheer en organiseer hier al uw lespakketten.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Lespakket toevoegen
          </Button>
        </div>

        <CourseModuleModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSave={handleSaveCourseModule}
          subjects={subjects}
        />

        {selectedModule && (
          <CourseModuleModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSave={handleUpdateCourseModule}
            subjects={subjects}
            module={selectedModule}
          />
        )}

        {selectedModule && (
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  course module.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCourseModule}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {renderContent()}
      </div>
    </LayoutWrapper>
  );
};

export default CourseModulesPage;
