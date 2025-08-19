import moduleApi from '@/apis/modules/moduleAPI';
import subjectAPI from '@/apis/subjects/subjectAPI';
import ViewCourseModuleDialog from '@/components/coursemodules/ViewCourseModuleDialog';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import CreateModal from '@/components/modules/CreateModal';
import EditModal from '@/components/modules/EditModal';
import { ModuleCard } from '@/components/modules/ModuleCard'; // Note the organized path
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
import { Component, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

const ModulesPage = () => {
  // State for data, loading, and errors
  const [modules, setModules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Simplified state management for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [moduleToView, setModuleToView] = useState(null);
  const [moduleToEdit, setModuleToEdit] = useState(null);
  const [moduleToDelete, setModuleToDelete] = useState(null);

  // --- Data Enrichment ---
  const enrichModulesWithSubjectNames = (modules, subjects) => {
    if (!Array.isArray(modules) || !Array.isArray(subjects)) return [];

    const subjectMap = subjects.reduce((acc, subject) => {
      acc[subject.id] = subject.name;
      return acc;
    }, {});

    return modules.map((module) => ({
      ...module,
      subjects: (module.subjects || []).map((s) => ({
        ...s,
        subjectId: s.subjectId, // Ensure subjectId is consistently used
        subjectName: subjectMap[s.subjectId] || 'Onbekend vak',
      })),
    }));
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiError('');
      try {
        const [modulesData, subjectsData] = await Promise.all([
          moduleApi.get_modules(),
          subjectAPI.get_subjects(),
        ]);
        setModules(enrichModulesWithSubjectNames(modulesData, subjectsData));
        setSubjects(subjectsData);
      } catch (e) {
        setApiError(e.message || 'Kon de gegevens niet laden.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshModules = async () => {
    try {
      const data = await moduleApi.get_modules();
      setModules(enrichModulesWithSubjectNames(data, subjects));
    } catch (e) {
      setApiError(e.message || 'Kon de modules niet vernieuwen.');
    }
  };

  // --- API Handlers ---

  const handleCreateModule = async (moduleData) => {
    try {
      await moduleApi.add_module(moduleData);
      await refreshModules();
      setIsCreateModalOpen(false);
    } catch (e) {
      throw new Error(e.message || 'Kon de module niet aanmaken.');
    }
  };

  const handleEditModule = async (moduleData) => {
    try {
      await moduleApi.edit_module({ ...moduleData, id: moduleToEdit.id });
      await refreshModules();
      setModuleToEdit(null);
    } catch (e) {
      throw new Error(e.message || 'Kon de module niet bijwerken.');
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await moduleApi.delete_module(moduleToDelete.id);
      await refreshModules();
      setModuleToDelete(null); // Close dialog on success
    } catch (e) {
      setApiError(e.message || 'Kon de module niet verwijderen.');
    }
  };

  // --- UI Click Handlers ---

  const handleViewClick = (module) => setModuleToView(module);
  const handleEditClick = (module) => setModuleToEdit(module);
  const handleDeleteClick = (module) => setModuleToDelete(module);

  // --- Render Logic ---

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center text-muted-foreground mt-8">
          Modules worden geladen...
        </div>
      );
    }

    if (apiError) {
      return <div className="text-center text-red-600 mt-8">{apiError}</div>;
    }

    if (!modules || modules.length === 0) {
      return (
        <div className="text-center text-muted-foreground mt-8">
          Geen modules gevonden. Klik op "Module toevoegen" om er een te maken.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard
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
      <div className="container mx-auto ">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Component className="size-9" />
              <h1 className="text-3xl font-[530] tracking-tight">Modules</h1>
            </div>
            <p className="text-muted-foreground">
              Beheer en organiseer hier alle modules.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Module toevoegen
          </Button>
        </div>

        {renderContent()}
      </div>

      {/* --- Modals & Dialogs --- */}

      <CreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSave={handleCreateModule}
        subjects={subjects}
      />

      <EditModal
        open={!!moduleToEdit}
        onOpenChange={() => setModuleToEdit(null)}
        onSave={handleEditModule}
        subjects={subjects}
        module={moduleToEdit}
      />

      {/* View Dialog */}
      <ViewCourseModuleDialog
        open={!!moduleToView}
        onOpenChange={() => setModuleToView(null)}
        module={moduleToView}
      />

      {/* Delete Confirmation Dialog */}
      {moduleToDelete && (
        <AlertDialog
          open={!!moduleToDelete}
          onOpenChange={() => setModuleToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Weet u het zeker?</AlertDialogTitle>
              <AlertDialogDescription>
                Deze actie kan niet ongedaan worden gemaakt. Dit zal het module
                permanent verwijderen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteModule}>
                Verwijderen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </LayoutWrapper>
  );
};

export default ModulesPage;
