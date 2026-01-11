import { Check, ChevronLeft, ClipboardList, Eye, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import classAPI from '@/apis/classAPI';
import courseAPI from '@/apis/courseAPI';
import resultAPI from '@/apis/resultAPI';
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

const loadConfigFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveConfigToStorage = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
};

const RapportPage = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [courseModules, setCourseModules] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [reportConfigByClass, setReportConfigByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState('config');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

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
      const [classesData, coursesData, resultsData] = await Promise.all([
        classAPI.get_classes(),
        courseAPI.get_courses(),
        resultAPI.get_results(),
      ]);
      setClasses(classesData || []);
      setCourses(coursesData || []);
      setAllResults(resultsData || []);
    } catch (e) {
      console.error('Failed to fetch data:', e);
      setError('Laden van gegevens is mislukt. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setViewMode('config');

    const selectedClass = classes.find((c) => c.id.toString() === classId);
    if (selectedClass?.course_id) {
      const course = courses.find((c) => c.id === selectedClass.course_id);
      setCourseModules(course?.course_module || []);
    } else {
      setCourseModules([]);
    }
  };

  const getReportConfig = () => {
    const storedConfig = reportConfigByClass[selectedClassId] || {};
    return courseModules.map((mod) => ({
      module_id: mod.id,
      module_name: mod.name,
      required: storedConfig[mod.id]?.required ?? true,
      passing_type: storedConfig[mod.id]?.passing_type || 'minimum_grade',
      minimum_grade: storedConfig[mod.id]?.minimum_grade ?? 5.5,
    }));
  };

  const reportConfig = getReportConfig();

  const updateModuleConfig = (moduleId, updates) => {
    const currentConfig = reportConfigByClass[selectedClassId] || {};
    const updatedConfig = {
      ...currentConfig,
      [moduleId]: {
        ...currentConfig[moduleId],
        ...updates,
      },
    };
    const newConfigByClass = { ...reportConfigByClass, [selectedClassId]: updatedConfig };
    setReportConfigByClass(newConfigByClass);
    saveConfigToStorage(newConfigByClass);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setIsEditModalOpen(true);
  };

  const handleSaveConfig = (savedConfig) => {
    updateModuleConfig(savedConfig.module_id, {
      required: savedConfig.required,
      passing_type: savedConfig.passing_type,
      minimum_grade: savedConfig.minimum_grade,
    });
    toast.success(`"${savedConfig.module_name}" is bijgewerkt!`);
    setIsEditModalOpen(false);
    setEditingConfig(null);
  };

  const toggleRequired = (moduleId, currentValue) => {
    updateModuleConfig(moduleId, { required: !currentValue });
  };

  const classItems = classes.map((c) => ({ value: c.id.toString(), label: c.name }));
  const selectedClass = classes.find((c) => c.id.toString() === selectedClassId);

  const studentsInClass = selectedClass?.students || [];

  const calculateStudentGrades = (studentId) => {
    const studentResults = allResults.filter((r) => r.student_id === studentId);
    const gradesByModule = {};

    courseModules.forEach((mod) => {
      const moduleResults = studentResults.filter((r) => {
        const courseModuleId = r.assessment?.subject?.course_module?.id;
        return courseModuleId === mod.id && r.grade !== null && r.grade !== undefined;
      });

      if (moduleResults.length > 0) {
        let weightedSum = 0;
        let totalWeight = 0;

        moduleResults.forEach((r) => {
          const grade = parseFloat(r.grade || 0);
          const leverage = parseFloat(r.assessment?.leverage) || 1;
          weightedSum += grade * leverage;
          totalWeight += leverage;
        });

        const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
        gradesByModule[mod.id] = {
          average: Math.round(weightedAvg * 10) / 10,
          count: moduleResults.length,
        };
      } else {
        gradesByModule[mod.id] = { average: null, count: 0 };
      }
    });

    return gradesByModule;
  };

  const checkModulePassed = (config, gradeData) => {
    if (!gradeData || gradeData.average === null) return null;
    if (config.passing_type === 'pass_fail') {
      return gradeData.average >= 5.5;
    }
    return gradeData.average >= (config.minimum_grade || 5.5);
  };

  const checkOverallPassed = (studentGrades) => {
    const requiredConfigs = reportConfig.filter((c) => c.required);
    if (requiredConfigs.length === 0) return null;

    for (const config of requiredConfigs) {
      const gradeData = studentGrades[config.module_id];
      const passed = checkModulePassed(config, gradeData);
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
        {selectedClassId && courseModules.length > 0 && (
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

      {selectedClassId && !selectedClass?.course_id && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="size-12 mx-auto mb-3 opacity-50" />
              <p>Deze klas heeft geen lespakket toegewezen.</p>
              <p className="text-sm">Wijs eerst een lespakket toe aan deze klas.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClassId && selectedClass?.course_id && viewMode === 'config' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Normering voor {selectedClass?.name}</CardTitle>
            <CardDescription>
              Lespakket: {selectedClass?.course?.name || 'Onbekend'} — Configureer de slaagnormen per module.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseModules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="size-12 mx-auto mb-3 opacity-50" />
                <p>Geen modules gevonden voor dit lespakket.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Module</th>
                    <th className="text-left py-2 font-medium text-muted-foreground w-32">Verplicht</th>
                    <th className="text-left py-2 font-medium text-muted-foreground w-40">Slagingsnorm</th>
                    <th className="text-left py-2 font-medium text-muted-foreground w-20">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {reportConfig.map((config) => (
                    <tr key={config.module_id} className="border-b last:border-b-0">
                      <td className="py-2.5 font-medium">{config.module_name}</td>
                      <td className="py-2.5">
                        <Checkbox
                          checked={config.required}
                          onCheckedChange={() => toggleRequired(config.module_id, config.required)}
                        />
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {config.passing_type === 'minimum_grade'
                          ? `Min. ${config.minimum_grade}`
                          : 'Geslaagd / Gezakt'}
                      </td>
                      <td className="py-2.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(config)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClassId && selectedClass?.course_id && viewMode === 'reportcard' && (
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
                          <th className="text-left py-2 font-medium text-muted-foreground">Module</th>
                          <th className="text-left py-2 font-medium text-muted-foreground w-32">Verplicht</th>
                          <th className="text-left py-2 font-medium text-muted-foreground w-28">Gemiddelde</th>
                          <th className="text-left py-2 font-medium text-muted-foreground w-32">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportConfig.map((config) => {
                          const gradeData = studentGrades[config.module_id];
                          const passed = checkModulePassed(config, gradeData);

                          return (
                            <tr key={config.module_id} className="border-b last:border-b-0">
                              <td className="py-2.5">{config.module_name}</td>
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

      <EditModal
        open={isEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingConfig(null);
          setIsEditModalOpen(isOpen);
        }}
        onSave={handleSaveConfig}
        config={editingConfig}
      />
    </>
  );
};

export default RapportPage;
