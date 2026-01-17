import { Check, ChevronLeft, ClipboardList, Download, Eye, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import classAPI from '@/apis/classAPI';
import courseAPI from '@/apis/courseAPI';
import resultAPI from '@/apis/resultAPI';
import EditModal from '@/components/report/EditModal';
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
import exportReportCardToPDF, { exportMultipleReportCardsToPDF } from '@/utils/exportReportCardToPDF';

const STORAGE_KEY = 'rapport_config';
const VIEW_STATE_KEY = 'rapport_view_state';

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

const loadViewStateFromStorage = () => {
  try {
    const stored = localStorage.getItem(VIEW_STATE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveViewStateToStorage = (state) => {
  try {
    localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save view state to localStorage', e);
  }
};

const RapportPageCopy = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(() => {
    const stored = loadViewStateFromStorage();
    return stored.selectedClassId || '';
  });
  const [courseModules, setCourseModules] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [reportConfigByClass, setReportConfigByClass] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState(() => {
    const stored = loadViewStateFromStorage();
    return stored.viewMode || 'config';
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);

  // Multi-select and export states
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [studentSearchId, setStudentSearchId] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const stored = loadConfigFromStorage();
    setReportConfigByClass(stored);
  }, []);

  // Persist view state to localStorage
  useEffect(() => {
    saveViewStateToStorage({ selectedClassId, viewMode });
  }, [selectedClassId, viewMode]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Restore courseModules when data is loaded and we have a stored selectedClassId
  useEffect(() => {
    if (classes.length > 0 && courses.length > 0 && selectedClassId) {
      const selectedClass = classes.find((c) => c.id.toString() === selectedClassId);
      if (selectedClass?.course_id) {
        const course = courses.find((c) => c.id === selectedClass.course_id);
        setCourseModules(course?.course_module || []);
      } else {
        setCourseModules([]);
      }
    }
  }, [classes, courses, selectedClassId]);

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

  // Student combobox items
  const studentItems = studentsInClass.map((s) => ({
    value: s.id.toString(),
    label: `${s.first_name} ${s.last_name}`,
  }));

  // Filter students based on search
  const filteredStudents = studentSearchId
    ? studentsInClass.filter((s) => s.id.toString() === studentSearchId)
    : studentsInClass;

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Clear selections when class changes
  const handleClassChangeWithReset = (classId) => {
    handleClassChange(classId);
    setSelectedStudentIds(new Set());
    setStudentSearchId('');
  };

  // Get selected students data
  const getSelectedStudents = () => {
    return studentsInClass.filter((s) => selectedStudentIds.has(s.id));
  };

  // Handle multi-export (selected students to single PDF)
  const handleMultiExport = async () => {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) return;

    setIsExporting(true);
    setShowExportDialog(false);

    try {
      // Determine school year
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const schoolYear = currentMonth >= 8
        ? `${currentYear}/${currentYear + 1}`
        : `${currentYear - 1}/${currentYear}`;

      // Prepare all students data for single PDF export
      const studentsData = selectedStudents.map((student) => {
        const studentGrades = calculateStudentGrades(student.id);
        const overallPassed = checkOverallPassed(studentGrades);
        const modulesForPDF = reportConfig.map((config) => {
          const gradeData = studentGrades[config.module_id];
          const passed = checkModulePassed(config, gradeData);
          return {
            module_name: config.module_name,
            required: config.required,
            average: gradeData?.average,
            passed: passed,
          };
        });
        return {
          student,
          modules: modulesForPDF,
          overallPassed,
          comments: '',
        };
      });

      await exportMultipleReportCardsToPDF({
        students: studentsData,
        className: selectedClass?.name || 'Onbekend',
        schoolYear,
      });

      toast.success(`${selectedStudents.length} rapport(en) succesvol geëxporteerd naar één PDF!`);
      setSelectedStudentIds(new Set());
    } catch (error) {
      console.error('Failed to export report cards:', error);
      toast.error('Exporteren van rapporten is mislukt. Probeer het opnieuw.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (studentsInClass.length === 0) return;

    setIsExporting(true);

    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const schoolYear = currentMonth >= 8
        ? `${currentYear}/${currentYear + 1}`
        : `${currentYear - 1}/${currentYear}`;

      const studentsData = studentsInClass.map((student) => {
        const studentGrades = calculateStudentGrades(student.id);
        const overallPassed = checkOverallPassed(studentGrades);
        const modulesForPDF = reportConfig.map((config) => {
          const gradeData = studentGrades[config.module_id];
          const passed = checkModulePassed(config, gradeData);
          return {
            module_name: config.module_name,
            required: config.required,
            average: gradeData?.average,
            passed: passed,
          };
        });
        return {
          student,
          modules: modulesForPDF,
          overallPassed,
          comments: '',
        };
      });

      await exportMultipleReportCardsToPDF({
        students: studentsData,
        className: selectedClass?.name || 'Onbekend',
        schoolYear,
      });

      toast.success(`Alle ${studentsInClass.length} rapporten succesvol geëxporteerd!`);
    } catch (error) {
      console.error('Failed to export all report cards:', error);
      toast.error('Exporteren van rapporten is mislukt. Probeer het opnieuw.');
    } finally {
      setIsExporting(false);
    }
  };

  // const calculateStudentGrades = (studentId) => {
  //   const studentResults = allResults.filter((r) => r.student_id === studentId);
  //   const gradesByModule = {};

  //   courseModules.forEach((mod) => {
  //     const moduleResults = studentResults.filter((r) => {
  //       const courseModuleId = r.assessment?.subject?.course_module?.id;
  //       return courseModuleId === mod.id && r.grade !== null && r.grade !== undefined;
  //     });

  //     if (moduleResults.length > 0) {
  //       let weightedSum = 0;
  //       let totalWeight = 0;

  //       moduleResults.forEach((r) => {
  //         const grade = parseFloat(r.grade || 0);
  //         const leverage = parseFloat(r.assessment?.leverage) || 1;
  //         weightedSum += grade * leverage;
  //         totalWeight += leverage;
  //       });

  //       const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
  //       gradesByModule[mod.id] = {
  //         average: Math.round(weightedAvg * 10) / 10,
  //         count: moduleResults.length,
  //       };
  //     } else {
  //       gradesByModule[mod.id] = { average: null, count: 0 };
  //     }
  //   });

  //   return gradesByModule;
  // };

  const calculateStudentGrades = (studentId) => {
    const studentResults = allResults.filter((r) => r.student_id === studentId);
    const gradesByModule = {};

    courseModules.forEach((mod) => {
      const moduleResults = getResultsForModule(studentResults, mod.id);
      gradesByModule[mod.id] = calculateWeightedAverage(moduleResults);
    });

    return gradesByModule;
  };

  const getResultsForModule = (results, moduleId) => {
    return results.filter((r) => {
      const courseModuleId = r.assessment?.subject?.course_module?.id;
      return courseModuleId === moduleId && r.grade != null;
    });
  };

  const calculateWeightedAverage = (results) => {
    if (results.length === 0) {
      return { average: null, count: 0 };
    }

    let weightedSum = 0;
    let totalWeight = 0;

    results.forEach((r) => {
      const grade = parseFloat(r.grade || 0);
      const leverage = parseFloat(r.assessment?.leverage) || 1;
      weightedSum += grade * leverage;
      totalWeight += leverage;
    });

    const average = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      average: Math.round(average * 10) / 10,
      count: results.length,
    };
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

  const handleExportReportCard = async (student, studentGrades, overallPassed, showToast = true) => {
    try {
      // Prepare modules data for PDF export
      const modulesForPDF = reportConfig.map((config) => {
        const gradeData = studentGrades[config.module_id];
        const passed = checkModulePassed(config, gradeData);

        return {
          module_name: config.module_name,
          required: config.required,
          average: gradeData?.average,
          passed: passed,
        };
      });

      // Determine school year
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const schoolYear = currentMonth >= 8
        ? `${currentYear}/${currentYear + 1}`
        : `${currentYear - 1}/${currentYear}`;

      await exportReportCardToPDF({
        student,
        className: selectedClass?.name || 'Onbekend',
        schoolYear,
        modules: modulesForPDF,
        overallPassed,
        comments: '', // Can be extended later to include teacher comments
      });

      if (showToast) {
        toast.success(`Rapport voor ${student.first_name} ${student.last_name} succesvol geëxporteerd!`);
      }
    } catch (error) {
      console.error('Failed to export report card:', error);
      if (showToast) {
        toast.error('Exporteren van rapport is mislukt. Probeer het opnieuw.');
      }
      throw error;
    }
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

        {/* Export button - shown when students are selected */}
        {viewMode === 'reportcard' && selectedStudentIds.size > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-1" />
            Exporteer ({selectedStudentIds.size})
          </Button>
        )}

        <div className="flex items-center gap-4 ml-auto">
          {/* Student search combobox and Export All button - shown in reportcard view */}
          {viewMode === 'reportcard' && studentsInClass.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                {viewMode === 'reportcard' && studentsInClass.length > 0 && (
                  <Button
                    variant="outline"
                    className="py-3"
                    onClick={handleExportAll}
                    disabled={isExporting || studentsInClass.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" strokeWidth={2} />
                    Alles exporteren
                  </Button>
                )}
                {/* <div className="text-sm text-muted-foreground">Leerling:</div> */}
                <div className="flex items-center gap-1">
                  <ComboboxField
                    items={[{ value: '', label: 'Alle leerlingen' }, ...studentItems]}
                    value={studentSearchId}
                    onChange={setStudentSearchId}
                    placeholder="Zoek leerling"
                    disabled={loading}
                    className="min-w-[200px] max-w-[280px]"
                  />

                  {studentSearchId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setStudentSearchId('')}
                      title="Wis selectie"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                </div>
              </div>

            </>
          )}

          <div className="flex items-center gap-2">
            {/* <div className="text-sm text-muted-foreground">Klas:</div> */}
            <ComboboxField
              items={classItems}
              value={selectedClassId}
              onChange={handleClassChangeWithReset}
              placeholder="Selecteer een klas"
              disabled={loading}
              className="min-w-[200px] max-w-[280px]"
            />
          </div>

        </div>
      </div>

      {!selectedClassId && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="size-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">Geen klas geselecteerd</p>
              <p className="text-sm">Selecteer een klas om de rapportconfiguratie te bekijken.</p>
            </div>
          </CardContent>
        </Card>
      )}

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
              Lespakket: {selectedClass?.course?.name || 'Onbekend'}
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
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <p>{studentsInClass.length === 0 ? 'Geen leerlingen in deze klas.' : 'Geen leerlingen gevonden.'}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student) => {
              const studentGrades = calculateStudentGrades(student.id);
              const overallPassed = checkOverallPassed(studentGrades);
              const isSelected = selectedStudentIds.has(student.id);

              return (
                <Card key={student.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                          aria-label={`Selecteer ${student.first_name} ${student.last_name}`}
                        />
                        <CardTitle className="text-lg">
                          {student.first_name} {student.last_name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleExportReportCard(student, studentGrades, overallPassed)}
                        >
                          <Download className="h-4 w-4" strokeWidth={2} />
                          {/* Exporteer PDF */}
                        </Button>
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

      {/* Export confirmation dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rapporten exporteren</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  Je gaat nu {selectedStudentIds.size} rapporten exporteren naar PDF voor:
                </p>
                <ul className="list-none list-inside space-y-1 text-sm max-h-48 overflow-y-auto">
                  {getSelectedStudents().map((student) => (
                    <li className="font-bold" key={student.id}>
                      {student.first_name} {student.last_name}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExporting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiExport} disabled={isExporting}>
              {isExporting ? 'Exporteren...' : 'Exporteren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RapportPageCopy;
