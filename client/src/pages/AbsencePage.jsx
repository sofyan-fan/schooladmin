import { get_classes } from '@/apis/classAPI';
import rosterAPI from '@/apis/rosterAPI';
import { get_students } from '@/apis/studentAPI';
import { get_teachers } from '@/apis/teachersAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';
import ClassSelectionDialog from '@/components/absences/ClassSelectionDialog';
import DaySection from '@/components/absences/DaySection';
import EmptyState from '@/components/absences/EmptyState';
import LessonAbsenceDialog from '@/components/absences/LessonAbsenceDialog';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { addDays, endOfWeek, format, startOfWeek, subDays } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const AbsencePage = () => {
  const [rosters, setRosters] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [, setLoading] = useState(false);

  // Dialog states
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [currentLessonDate, setCurrentLessonDate] = useState(null);
  const [isClassSelectionDialogOpen, setIsClassSelectionDialogOpen] =
    useState(false);

  // Student absence states
  const [studentAbsences, setStudentAbsences] = useState({});
  const [editingStudents, setEditingStudents] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rosterData, studentData, teacherData, classData, absenceData] =
        await Promise.all([
          rosterAPI.get_rosters(),
          get_students(),
          get_teachers(),
          get_classes(),
          absenceAPI.getAllAbsences(),
        ]);

      setRosters(rosterData || []);
      setStudents(studentData || []);
      setTeachers(teacherData || []);
      setClasses(classData || []);
      setAbsences(absenceData || []);

      // Debug logging
      console.log('Loaded rosters:', rosterData);
      console.log('Loaded students:', studentData);
      console.log('Loaded teachers:', teacherData);
      console.log('Loaded classes:', classData);
    } catch (error) {
      toast.error('Laden van gegevens mislukt');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Onbekend';
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Onbekend';
  };

  const getClassStudents = (roster) => {
    // Get students from the class that this roster belongs to
    if (roster.class_id) {
      return students.filter((student) => student.class_id === roster.class_id);
    }
    // If no specific class, return empty array since we can't determine which students should be in this lesson
    return [];
  };

  const getStudentAbsenceForRoster = (studentId, rosterId, date) => {
    return absences.find(
      (absence) =>
        absence.student_id === studentId &&
        absence.roster_id === rosterId &&
        new Date(absence.date).toDateString() === date.toDateString()
    );
  };

  const uniqueClasses = useMemo(() => {
    // Return all classes, not just those with rosters
    return classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
    }));
  }, [classes]);

  const handleLessonClick = (roster) => {
    // Calculate the actual date of the lesson
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const dayMapping = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };
    const dayIndex = dayMapping[roster.day_of_week];
    const lessonDate = addDays(weekStart, dayIndex);

    setCurrentLessonDate(lessonDate);
    setSelectedRoster(roster);
    const classStudents = getClassStudents(roster);

    // Initialize student absence states
    const initialStates = {};
    classStudents.forEach((student) => {
      const existingAbsence = getStudentAbsenceForRoster(
        student.id,
        roster.id,
        lessonDate
      );
      const status = existingAbsence
        ? existingAbsence.reason === 'Te Laat'
          ? 'late'
          : 'absent'
        : 'present';
      initialStates[student.id] = {
        status,
        reason: existingAbsence?.reason || '',
        custom_reason: '',
        absenceId: existingAbsence?.id || null,
      };
    });

    setStudentAbsences(initialStates);
    setIsLessonDialogOpen(true);
  };

  const groupRostersByDay = () => {
    // Map English day names to Dutch
    const dayMapping = {
      Monday: 'Maandag',
      Tuesday: 'Dinsdag',
      Wednesday: 'Woensdag',
      Thursday: 'Donderdag',
      Friday: 'Vrijdag',
      Saturday: 'Zaterdag',
      Sunday: 'Zondag',
    };

    const grouped = {};
    rosters.forEach((roster) => {
      const dutchDay = dayMapping[roster.day_of_week] || roster.day_of_week;
      if (!grouped[dutchDay]) {
        grouped[dutchDay] = [];
      }
      grouped[dutchDay].push(roster);
    });

    // Sort each day's rosters by time
    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    console.log('Grouped rosters by day:', grouped);
    return grouped;
  };

  const goToPreviousWeek = () => {
    setSelectedDate(subDays(selectedDate, 7));
  };

  const goToNextWeek = () => {
    setSelectedDate(addDays(selectedDate, 7));
  };

  const groupedRosters = groupRostersByDay();
  const weekDays = [
    'Maandag',
    'Dinsdag',
    'Woensdag',
    'Donderdag',
    'Vrijdag',
    'Zaterdag',
    'Zondag',
  ];

  const filteredRostersByDay = (day) => {
    const lessonsForDay = groupedRosters[day] || [];
    if (!selectedClassId) {
      return [];
    }
    return lessonsForDay.filter(
      (roster) => roster.class_layout?.id.toString() === selectedClassId
    );
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDisplay = `${format(weekStart, 'd MMM')} - ${format(
    weekEnd,
    'd MMM, yyyy'
  )}`;

  const getSelectedClassesNames = () => {
    if (!selectedClassId) return 'Selecteer een klas...';
    const selectedClass = uniqueClasses.find(
      (c) => String(c.id) === selectedClassId
    );
    return selectedClass ? selectedClass.name : 'Selecteer een klas...';
  };

  return (
    <div className="container mx-auto ">
      <PageHeader
        title="Afwezigheid Beheer"
        icon={<CalendarDays className="size-9" />}
        description="Beheer student afwezigheid per les."
      >
        <div className="flex items-center gap-4">
          <Button
            variant="outline"

            className="w-[250px] flex justify-between font-normal bg-white"
            onClick={() => setIsClassSelectionDialogOpen(true)}
          >
            {getSelectedClassesNames()}
          <ChevronDown className="h-4 w-4" />

          </Button>   

          {/* <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-48 text-center">
              {weekDisplay}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div> */}
        </div>
      </PageHeader>

      {classes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6">
          {selectedClassId ? (
            (() => {
              const hasLessons = weekDays.some((day) => {
                const lessonsForDay = filteredRostersByDay(day);
                return lessonsForDay.length > 0;
              });

              if (!hasLessons) {
                const selectedClass = uniqueClasses.find(
                  (c) => String(c.id) === selectedClassId
                );
                return (
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-semibold mb-2">
                        Geen lessen gepland
                      </h3>
                      <p className="text-muted-foreground">
                        Er zijn nog geen lessen gepland voor{' '}
                        <strong>{selectedClass?.name}</strong>. Lessen kunnen
                        worden aangemaakt in het{' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto font-normal text-muted-foreground underline"
                          onClick={() => (window.location.href = '/rooster')}
                        >
                          Rooster Beheer
                        </Button>
                        .
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return weekDays.map((day) => {
                const lessonsForDay = filteredRostersByDay(day);
                if (lessonsForDay.length === 0) return null;
                return (
                  <DaySection
                    key={day}
                    day={day}
                    dayRosters={lessonsForDay}
                    onLessonClick={handleLessonClick}
                    getTeacherName={getTeacherName}
                  />
                );
              });
            })()
          ) : (
            <Card
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setIsClassSelectionDialogOpen(true)}
            >
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">
                  Selecteer een klas
                </h3>
                <p className="text-muted-foreground">
                  Selecteer een klas om de lessen te bekijken.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <LessonAbsenceDialog
        open={isLessonDialogOpen}
        onOpenChange={setIsLessonDialogOpen}
        selectedRoster={selectedRoster}
        selectedDate={currentLessonDate}
        getClassStudents={getClassStudents}
        getStudentName={getStudentName}
        studentAbsences={studentAbsences}
        setStudentAbsences={setStudentAbsences}
        editingStudents={editingStudents}
        setEditingStudents={setEditingStudents}
        setAbsences={setAbsences}
      />
      <ClassSelectionDialog
        open={isClassSelectionDialogOpen}
        onOpenChange={setIsClassSelectionDialogOpen}
        classes={uniqueClasses}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
      />
    </div>
  );
};

export default AbsencePage;
