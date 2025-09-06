import moduleApi from '@/apis/moduleAPI';
import subjectAPI from '@/apis/subjectAPI';
import ViewCourseModuleDialog from '@/components/coursemodules/ViewCourseModuleDialog';
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
import { toast } from 'sonner';
const normalizeSubjects = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((s) => ({
    ...s,
    levels: (s.levels || []).map((lvl, i) => {
      if (lvl && typeof lvl === 'object') {
        // Handle Prisma structure: { id, level, subject_id }
        const id = String(lvl.id ?? i);
        const label = String(lvl.level ?? lvl.name ?? lvl.label ?? id);
        return { id, label };
      }
      return { id: String(lvl), label: String(lvl) };
    }),
    materials: (s.materials || []).map((mat, i) => {
      if (mat && typeof mat === 'object') {
        // Handle Prisma structure: { id, material, subject_id }
        const id = String(mat.id ?? i);
        const label = String(mat.material ?? mat.name ?? mat.title ?? id);
        return { id, label };
      }
      return { id: String(mat), label: String(mat) };
    }),
  }));
};

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
        subjectId: s.subject_id, // Use the correct field name from backend
        subjectName:
          s.subject?.name || subjectMap[s.subject_id] || 'Onbekend vak',
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

        const normalizedSubjects = normalizeSubjects(subjectsData);

        setModules(
          enrichModulesWithSubjectNames(modulesData, normalizedSubjects)
        );
        setSubjects(normalizedSubjects);
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
      setModules(enrichModulesWithSubjectNames(data, subjects)); // subjects already normalized
    } catch (e) {
      setApiError(e.message || 'Kon de modules niet vernieuwen.');
    }
  };

  // --- API Handlers ---

  const handleCreateModule = async (moduleData) => {
    try {
      await moduleApi.add_module(moduleData);
      toast.success(`"${moduleData.name}" is toegevoegd!`);
      await refreshModules();
      setIsCreateModalOpen(false);
    } catch (e) {
      toast.error(e.message || 'Kon de module niet aanmaken.');
      throw new Error(e.message || 'Kon de module niet aanmaken.');
    }
  };

  const handleEditModule = async (moduleData) => {
    try {
      await moduleApi.update_module({ ...moduleData, id: moduleToEdit.id });
      toast.success(`"${moduleData.name}" is bijgewerkt!`);
      await refreshModules();
      setModuleToEdit(null);
    } catch (e) {
      toast.error(e.message || 'Kon de module niet bijwerken.');
      throw new Error(e.message || 'Kon de module niet bijwerken.');
    }
  };

  const handleDeleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await moduleApi.delete_module(moduleToDelete.id);
      toast.success(`"${moduleToDelete.name}" is verwijderd!`);
      await refreshModules();
      setModuleToDelete(null); // Close dialog on success
    } catch (e) {
      toast.error(e.message || 'Kon de module niet verwijderen.');
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
    <>
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
    </>
  );
};

export default ModulesPage;
