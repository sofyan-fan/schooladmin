import { addDays, setHours, setMinutes } from 'date-fns';
import format from 'date-fns/format';
import getDay from 'date-fns/getDay';
import { nl } from 'date-fns/locale';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';

import rosterAPI from '@/apis/rosterAPI';
import LessonModal from '@/components/rosters/LessonModal';
import PageHeader from '@/components/shared/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { get_classes } from '@/apis/classAPI';
import { getClassrooms } from '@/apis/classroomAPI';
import { get_subjects } from '@/apis/subjectAPI';
import { get_teachers } from '@/apis/teachersAPI';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'nl-NL': nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Helper to convert day name to number
const dayNameToNumber = (dayName) => {
  const days = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };
  return days[dayName] || 1;
};

// Custom toolbar with Dutch labels
const CustomToolbar = ({ label, onNavigate, onView, view }) => (
  <div className="rbc-toolbar">
    <div className="rbc-btn-group">
      <button type="button" onClick={() => onNavigate('PREV')}>
        Vorige
      </button>
      <button type="button" onClick={() => onNavigate('TODAY')}>
        Vandaag
      </button>
      <button type="button" onClick={() => onNavigate('NEXT')}>
        Volgende
      </button>
    </div>
    <div className="rbc-toolbar-label">{label}</div>
    <div className="rbc-btn-group">
      <button
        type="button"
        className={view === 'week' ? 'rbc-active' : ''}
        onClick={() => onView('week')}
      >
        Week
      </button>
      <button
        type="button"
        className={view === 'day' ? 'rbc-active' : ''}
        onClick={() => onView('day')}
      >
        Dag
      </button>
    </div>
  </div>
);

const TeacherRosterPage = () => {
  const { user } = useAuth();
  const [rawRosters, setRawRosters] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Supporting data for the LessonModal
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Find teacher ID - could be user.id or user.teacherId
  const teacherId = useMemo(() => {
    return user?.teacherId || user?.id;
  }, [user]);

  const fetchRosters = useCallback(async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch rosters filtered by teacher_id
      const rosters = await rosterAPI.get_rosters({ teacher_id: teacherId });
      setRawRosters(Array.isArray(rosters) ? rosters : []);
    } catch (e) {
      console.error('Failed to load teacher rosters', e);
      setError('Het lesrooster kon niet worden geladen.');
      setRawRosters([]);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  const fetchSupportingData = useCallback(async () => {
    try {
      const [classesData, subjectsData, teachersData, classroomsData] =
        await Promise.all([
          get_classes(),
          get_subjects(),
          get_teachers(),
          getClassrooms(),
        ]);

      setClasses(classesData || []);
      setSubjects(subjectsData || []);
      setTeachers(teachersData || []);
      setClassrooms(classroomsData || []);
    } catch (error) {
      console.error('Failed to fetch supporting data:', error);
      toast.error('Laden van gegevens is mislukt');
    }
  }, []);

  useEffect(() => {
    fetchRosters();
    fetchSupportingData();
  }, [fetchRosters, fetchSupportingData]);

  const events = useMemo(() => {
    if (!rawRosters || rawRosters.length === 0) return [];

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    return rawRosters.map((roster) => {
      let dayOffset;

      if (roster.day_of_week) {
        const dayNum = parseInt(roster.day_of_week);
        if (!Number.isNaN(dayNum)) {
          if (dayNum === 7) {
            dayOffset = 6;
          } else {
            dayOffset = dayNum - 1;
          }
        } else {
          const dayNumber = dayNameToNumber(roster.day_of_week);
          dayOffset = dayNumber - 1;
        }
      } else {
        dayOffset = 0;
      }

      const eventDate = addDays(weekStart, dayOffset);

      let startHour = 9;
      let startMinute = 0;
      let endHour = 10;
      let endMinute = 0;

      if (roster.start_time) {
        [startHour, startMinute] = roster.start_time.split(':').map(Number);
      } else if (roster.start) {
        const startDate = new Date(roster.start);
        startHour = startDate.getHours();
        startMinute = startDate.getMinutes();
      }

      if (roster.end_time) {
        [endHour, endMinute] = roster.end_time.split(':').map(Number);
      } else if (roster.end) {
        const endDate = new Date(roster.end);
        endHour = endDate.getHours();
        endMinute = endDate.getMinutes();
      }

      const start = setMinutes(setHours(eventDate, startHour), startMinute);
      const end = setMinutes(setHours(eventDate, endHour), endMinute);

      const subject = roster.subject || subjects.find((s) => s.id === roster.subject_id);
      const teacher = roster.teacher || teachers.find((t) => t.id === roster.teacher_id);
      const classroom = roster.classroom || classrooms.find((c) => c.id === roster.classroom_id);
      const classInfo = roster.class_layout || classes.find((c) => c.id === roster.class_id);

      return {
        id: roster.id,
        title: subject?.name || roster.title || 'Les',
        start,
        end,
        resource: {
          ...roster,
          classId: roster.class_id,
          teacherId: roster.teacher_id,
          classroomId: roster.classroom_id,
          subjectId: roster.subject_id,
          className: classInfo?.name || '',
          teacherName: teacher
            ? `${teacher.first_name} ${teacher.last_name}`
            : '',
          classroomName: classroom?.name || '',
        },
      };
    });
  }, [rawRosters, currentDate, subjects, teachers, classrooms, classes]);

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: '#10b981',
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleSelectEvent = (event) => {
    if (modalOpen) return;
    setSelectedEvent(event);
    // Let react-big-calendar finish its internal click/selection cycle first
    requestAnimationFrame(() => setModalOpen(true));
  };

  const handleSave = async () => {
    await fetchRosters();
    setModalOpen(false);
  };

  const calendarContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Rooster laden...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-center text-sm text-red-600">{error}</p>
        </div>
      );
    }

    if (!teacherId) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            Je bent niet ingelogd als docent of je account is niet correct geconfigureerd.
          </div>
        </div>
      );
    }

    if (!events.length) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            Er zijn nog geen lessen aan jou toegewezen.
          </div>
        </div>
      );
    }

    return (
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="week"
        views={['week', 'day']}
        step={30}
        showMultiDayTimes
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 18, 0, 0)}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectEvent={handleSelectEvent}
        selectable={false}
        resizable={false}
        eventPropGetter={eventStyleGetter}
        style={{ height: '100%' }}
        culture="nl-NL"
        components={{
          toolbar: CustomToolbar,
          event: ({ event }) => (
            <div className="p-1 text-xs">
              <div className="font-semibold">{event.title}</div>
              {event.resource.className && (
                <div>{event.resource.className}</div>
              )}
              {event.resource.classroomName && (
                <div>{event.resource.classroomName}</div>
              )}
            </div>
          ),
        }}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Mijn Rooster"
        icon={<CalendarDays className="size-9" />}
        description="Bekijk je lesrooster en voeg notities toe aan je lessen."
      />
      <div className="flex-1 rounded-lg bg-white p-4 shadow-sm mt-4">
        {calendarContent()}
      </div>

      <LessonModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedEvent(null);
          }
        }}
        selectedEvent={selectedEvent}
        selectedSlot={null}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
        onSave={handleSave}
      />
    </div>
  );
};

export default TeacherRosterPage;
