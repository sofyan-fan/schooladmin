import { Check, ChevronLeft, ClipboardList, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import classAPI from '@/apis/classAPI';
import resultAPI from '@/apis/resultAPI';
import subjectAPI from '@/apis/subjectAPI';
import CreateModal from '@/components/report/CreateModal';
import DeleteDialog from '@/components/report/DeleteDialog';
import EditModal from '@/components/report/EditModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import ComboboxField from '@/components/ui/combobox';

const STORAGE_KEY = 'rapport_config';

// Helper to load config from localStorage
const loadConfigFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Helper to save config to localStorage
const saveConfigToStorage = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
};

const RapportPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [reportConfigByClass, setReportConfigByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View mode: 'config' or 'reportcard'
  const [viewMode, setViewMode] = useState('config');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [deletingConfig, setDeletingConfig] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadConfigFromStorage();
    setReportConfigByClass(stored);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [classesData, subjectsData, resultsData] = await Promise.all([
        classAPI.get_classes(),
        subjectAPI.get_subjects(),
        resultAPI.get_results(),
      ]);
      setClasses(classesData || []);
      setSubjects(subjectsData || []);
      setAllResults(resultsData || []);
    } catch {
      setError('Laden van gegevens is mislukt. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setViewMode('config');
  };

  // Get config for selected class
  const reportConfig = reportConfigByClass[selectedClassId] || [];

  // Update config for a class and persist to localStorage
  const updateReportConfig = (classId, newConfig) => {
    const updated = { ...reportConfigByClass, [classId]: newConfig };
    setReportConfigByClass(updated);
    saveConfigToStorage(updated);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setIsEditModalOpen(true);
  };

  const handleDelete = (config) => {
    setDeletingConfig(config);
  };

  const handleSaveConfig = (savedConfig) => {
    const currentConfig = reportConfigByClass[selectedClassId] || [];
    const exists = currentConfig.find((c) => c.id === savedConfig.id);
    let newConfig;
    if (exists) {
      toast.success(`"${savedConfig.subject_name}" is bijgewerkt!`);
      newConfig = currentConfig.map((c) => (c.id === savedConfig.id ? savedConfig : c));
    } else {
      toast.success(`"${savedConfig.subject_name}" is toegevoegd!`);
      newConfig = [...currentConfig, savedConfig];
    }
    updateReportConfig(selectedClassId, newConfig);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingConfig(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingConfig) return;
    const currentConfig = reportConfigByClass[selectedClassId] || [];
    const newConfig = currentConfig.filter((c) => c.id !== deletingConfig.id);
    updateReportConfig(selectedClassId, newConfig);
    toast.success(`"${deletingConfig.subject_name}" is verwijderd!`);
    setDeletingConfig(null);
  };

  const existingSubjectIds = reportConfig.map((c) => c.subject_id);
  const classItems = classes.map((c) => ({ value: c.id.toString(), label: c.name }));
  const selectedClass = classes.find((c) => c.id.toString() === selectedClassId);

  // Get students in selected class
  const studentsInClass = selectedClass?.students || [];

  // Calculate average grade per subject for a student
  const calculateStudentGrades = (studentId) => {
    const studentResults = allResults.filter((r) => r.student_id === studentId);
    const gradesBySubject = {};

    reportConfig.forEach((config) => {
      const subjectResults = studentResults.filter(
        (r) => r.subject_id === config.subject_id && r.grade !== null && r.grade !== undefined
      );
      if (subjectResults.length > 0) {
        const sum = subjectResults.reduce((acc, r) => acc + parseFloat(r.grade || 0), 0);
        const avg = sum / subjectResults.length;
        gradesBySubject[config.subject_id] = {
          average: Math.round(avg * 10) / 10,
          count: subjectResults.length,
        };
      } else {
        gradesBySubject[config.subject_id] = { average: null, count: 0 };
      }
    });

    return gradesBySubject;
  };

  // Check if student passed a subject based on config
  const checkSubjectPassed = (config, gradeData) => {
    if (!gradeData || gradeData.average === null) return null; // No grade yet
    if (config.passing_type === 'pass_fail') {
      return gradeData.average >= 5.5; // Default threshold for pass/fail
    }
    return gradeData.average >= (config.minimum_grade || 5.5);
  };

  // Check if student passed overall (all required subjects)
  const checkOverallPassed = (studentGrades) => {
    const requiredConfigs = reportConfig.filter((c) => c.required);
    if (requiredConfigs.length === 0) return null;

    for (const config of requiredConfigs) {
      const gradeData = studentGrades[config.subject_id];
      const passed = checkSubjectPassed(config, gradeData);
      if (passed === null || passed === false) return passed === null ? null : false;
    }
    return true;
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardList className="size-9" />
        <h1 className="text-3xl font-[530]">Rapport</h1>
      </div>

      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-100 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {/* Class Selection */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="text-sm text-muted-foreground">Klas:</div>
        <ComboboxField
          items={classItems}
          value={selectedClassId}
          onChange={handleClassChange}
          placeholder="Selecteer een klas"
          disabled={loading}
          className="min-w-[200px] max-w-[280px]"
        />
        {selectedClassId && reportConfig.length > 0 && (
          <Button
            variant={viewMode === 'reportcard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'config' ? 'reportcard' : 'config')}
          >
            {viewMode === 'config' ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Bekijk Rapporten
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Terug naar Configuratie
              </>
            )}
          </Button>
        )}
      </div>

      {/* Config View */}
      {selectedClassId && viewMode === 'config' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">Normering voor {selectedClass?.name}</CardTitle>
              <CardDescription>Configureer welke vakken vereist zijn om te slagen.</CardDescription>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Vak Toevoegen
            </Button>
          </CardHeader>
          <CardContent>
            {reportConfig.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="size-12 mx-auto mb-3 opacity-50" />
                <p>Nog geen vakken geconfigureerd.</p>
                <p className="text-sm">Voeg vakken toe om de rapport configuratie te starten.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reportConfig.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between rounded-lg border p-3 bg-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox checked={config.required} disabled className="pointer-events-none" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{config.subject_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {config.passing_type === 'minimum_grade'
                            ? `Min. ${config.minimum_grade}`
                            : 'Geslaagd / Gezakt'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(config)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(config)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Card View */}
      {selectedClassId && viewMode === 'reportcard' && (
        <div className="space-y-6">
          {studentsInClass.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <p>Geen leerlingen in deze klas.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            studentsInClass.map((student) => {
              const studentGrades = calculateStudentGrades(student.id);
              const overallPassed = checkOverallPassed(studentGrades);

              return (
                <Card key={student.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {student.first_name} {student.last_name}
                      </CardTitle>
                      <Badge
                        variant={
                          overallPassed === true
                            ? 'default'
                            : overallPassed === false
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {overallPassed === true ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Geslaagd
                          </>
                        ) : overallPassed === false ? (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Niet Geslaagd
                          </>
                        ) : (
                          'Onvolledig'
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-muted-foreground">Vak</th>
                          <th className="text-left py-2 font-medium text-muted-foreground w-32">Verplicht voor jaar</th>
                          <th className="text-left py-2 font-medium text-muted-foreground w-28">Gemiddelde</th>
                          <th className="text-left py-2 font-medium text-muted-foreground w-32">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportConfig.map((config) => {
                          const gradeData = studentGrades[config.subject_id];
                          const passed = checkSubjectPassed(config, gradeData);

                          return (
                            <tr key={config.id} className="border-b last:border-b-0">
                              <td className="py-2.5">{config.subject_name}</td>
                              <td className="py-2.5">
                                <Checkbox checked={config.required} disabled className="pointer-events-none" />
                              </td>
                              <td className="py-2.5 font-medium">
                                {gradeData?.average !== null ? gradeData.average : '-'}
                              </td>
                              <td className="py-2.5">
                                {passed === true ? (
                                  <span className="text-emerald-600">Behaald</span>
                                ) : passed === false ? (
                                  <span className="text-red-600">Niet behaald</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      <CreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSave={handleSaveConfig}
        subjects={subjects}
        existingSubjectIds={existingSubjectIds}
      />

      <EditModal
        open={isEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingConfig(null);
          setIsEditModalOpen(isOpen);
        }}
        onSave={handleSaveConfig}
        config={editingConfig}
      />

      <DeleteDialog
        isOpen={!!deletingConfig}
        onClose={() => setDeletingConfig(null)}
        onConfirm={handleConfirmDelete}
        subjectName={deletingConfig?.subject_name}
      />
    </>
  );
};

export default RapportPage;
