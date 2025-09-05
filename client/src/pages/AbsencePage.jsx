import rosterAPI from '@/apis/rosterAPI';
import { get_students } from '@/apis/studentAPI';
import { get_teachers } from '@/apis/teachersAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';
import DaySection from '@/components/absences/DaySection';
import EmptyState from '@/components/absences/EmptyState';
import LessonAbsenceDialog from '@/components/absences/LessonAbsenceDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const AbsencePage = () => {
  const [rosters, setRosters] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [, setLoading] = useState(false);

  // Dialog states
  const [selectedRoster, setSelectedRoster] = useState(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Student absence states
  const [studentAbsences, setStudentAbsences] = useState({});
  const [editingStudents, setEditingStudents] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rosterData, studentData, teacherData, absenceData] =
        await Promise.all([
          rosterAPI.get_rosters(),
          get_students(),
          get_teachers(),
          absenceAPI.getAllAbsences(),
        ]);

      setRosters(rosterData || []);
      setStudents(studentData || []);
      setTeachers(teacherData || []);
      setAbsences(absenceData || []);

      // Debug logging
      console.log('Loaded rosters:', rosterData);
      console.log('Loaded students:', studentData);
      console.log('Loaded teachers:', teacherData);
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
        absence.user_id === studentId &&
        absence.roster_id === rosterId &&
        new Date(absence.date).toDateString() === new Date(date).toDateString()
    );
  };

  const handleLessonClick = (roster) => {
    setSelectedRoster(roster);
    const classStudents = getClassStudents(roster);

    // Initialize student absence states
    const initialStates = {};
    classStudents.forEach((student) => {
      const existingAbsence = getStudentAbsenceForRoster(
        student.id,
        roster.id,
        selectedDate
      );
      initialStates[student.id] = {
        status: existingAbsence ? 'absent' : 'present',
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

  const dayOrder = [
    'Maandag',
    'Dinsdag',
    'Woensdag',
    'Donderdag',
    'Vrijdag',
    'Zaterdag',
    'Zondag',
  ];
  const groupedRosters = groupRostersByDay();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Afwezigheid Beheer</h1>
          <p className="text-muted-foreground mt-1">
            Beheer student afwezigheid per les. Lessen worden aangemaakt in het{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-muted-foreground underline"
              onClick={() => (window.location.href = '/rooster')}
            >
              Rooster Beheer
            </Button>
            .
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="date">Datum:</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {rosters.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6">
          {dayOrder.map((day) => {
            const dayRosters = groupedRosters[day] || [];
            if (dayRosters.length === 0) return null;

            return (
              <DaySection
                key={day}
                day={day}
                dayRosters={dayRosters}
                onLessonClick={handleLessonClick}
                getTeacherName={getTeacherName}
              />
            );
          })}
        </div>
      )}

      <LessonAbsenceDialog
        open={isLessonDialogOpen}
        onOpenChange={setIsLessonDialogOpen}
        selectedRoster={selectedRoster}
        selectedDate={selectedDate}
        getClassStudents={getClassStudents}
        getStudentName={getStudentName}
        studentAbsences={studentAbsences}
        setStudentAbsences={setStudentAbsences}
        editingStudents={editingStudents}
        setEditingStudents={setEditingStudents}
        setAbsences={setAbsences}
      />
    </div>
  );
};

export default AbsencePage;
