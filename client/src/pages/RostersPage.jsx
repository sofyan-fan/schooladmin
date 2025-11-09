import { addDays, setHours, setMinutes } from 'date-fns';
import format from 'date-fns/format';
import getDay from 'date-fns/getDay';
import { nl } from 'date-fns/locale';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { toast } from 'sonner';

// APIs
import { get_classes } from '@/apis/classAPI';
import { getClassrooms } from '@/apis/classroomAPI';
import rosterAPI from '@/apis/rosterAPI';
import { get_subjects } from '@/apis/subjectAPI';
import { get_teachers } from '@/apis/teachersAPI';

// Components
import CreateLessonModal from '@/components/rosters/CreateLessonModal';
import LessonModal from '@/components/rosters/LessonModal';
import RosterFilters from '@/components/rosters/RosterFilters';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';

// Styles
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { CalendarDays } from 'lucide-react';

// Setup date-fns localizer for Dutch
const locales = {
  'nl-NL': nl,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday = 1
  getDay,
  locales,
});

// Create DnD Calendar
const DnDCalendar = withDragAndDrop(Calendar);

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

// Helper to convert number to day name
const numberToDayName = (num) => {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  // Adjust for our 1-7 (Mon-Sun) to 0-6 (Sun-Sat) conversion
  if (num === 7) return 'Sunday';
  return days[num] || 'Monday';
};

export default function RostersPage() {
  // Data states
  const [rawRosters, setRawRosters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter states
  const [filters, setFilters] = useState({
    classIds: [],
    teacherIds: [],
    classroomIds: [],
  });

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const eventsCacheRef = useRef([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch all rosters and store raw data
  const fetchRosters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rosterAPI.get_rosters();
      setRawRosters(data);
    } catch (error) {
      console.error('Failed to fetch rosters:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch supporting data
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
      toast.error('Failed to load data');
    }
  }, []);

  useEffect(() => {
    fetchRosters();
    fetchSupportingData();
  }, [fetchRosters, fetchSupportingData]);

  // Transform raw roster data into calendar events for the current week view
  const transformedEvents = useMemo(() => {
    if (!rawRosters || rawRosters.length === 0) return [];

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    return rawRosters.map((roster) => {
      // Extract day of week - prioritize day_of_week field over ISO dates
      let dayOffset;

      if (roster.day_of_week) {
        // Check if it's a number as string like "1", "2", etc
        const dayNum = parseInt(roster.day_of_week);
        if (!isNaN(dayNum)) {
          // It's a number - server sends 1-7 where 1=Monday, 7=Sunday
          // We need 0-6 where 0=Monday, 6=Sunday for our week starting Monday
          if (dayNum === 7) {
            dayOffset = 6; // Sunday
          } else {
            dayOffset = dayNum - 1; // Monday=0, Tuesday=1, etc.
          }
        } else {
          // It's a day name like "Monday"
          const dayNumber = dayNameToNumber(roster.day_of_week);
          dayOffset = dayNumber - 1; // Convert to 0-based offset from Monday
        }
      } else {
        // Default to Monday if we can't determine
        dayOffset = 0;
      }

      const eventDate = addDays(weekStart, dayOffset);

      // Parse times
      let startHour = 9,
        startMinute = 0;
      let endHour = 10,
        endMinute = 0;

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

      // Use nested data from server if available, otherwise look up from arrays
      const subject =
        roster.subject || subjects.find((s) => s.id === roster.subject_id);
      const teacher =
        roster.teacher || teachers.find((t) => t.id === roster.teacher_id);
      const classroom =
        roster.classroom ||
        classrooms.find((c) => c.id === roster.classroom_id);
      const classInfo =
        roster.class_layout || classes.find((c) => c.id === roster.class_id);

      return {
        id: roster.id,
        title: subject?.name || roster.title || 'Lesson',
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

  // Filter events based on selected filters
  const filteredEvents = transformedEvents.filter((event) => {
    const { classIds, teacherIds, classroomIds } = filters;
    const resource = event.resource;

    // Compare numeric IDs directly (filters use numbers from RosterFilters)
    if (classIds.length > 0 && !classIds.includes(resource.classId)) {
      return false;
    }
    if (teacherIds.length > 0 && !teacherIds.includes(resource.teacherId)) {
      return false;
    }
    if (
      classroomIds.length > 0 &&
      !classroomIds.includes(resource.classroomId)
    ) {
      return false;
    }

    return true;
  });

  useEffect(() => {
    if (filteredEvents && filteredEvents.length) {
      eventsCacheRef.current = filteredEvents;
    }
  }, [filteredEvents, modalOpen]);

  // choose which list to render
  const eventsForCalendar =
    modalOpen && eventsCacheRef.current && eventsCacheRef.current.length
      ? eventsCacheRef.current
      : filteredEvents;

  // Handle slot selection (for creating new events)
  const handleSelectSlot = ({ start, end }) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setModalOpen(true);
  };

  // Handle event selection (for editing)
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    // Let rbc finish its internal click/selection cycle first
    requestAnimationFrame(() => setModalOpen(true));
  };

  // Handle save from modal
  const handleSave = async () => {
    await fetchRosters();
    setModalOpen(false);
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      const dayOfWeek = start.getDay() === 0 ? 7 : start.getDay();
      const updatedEvent = {
        id: event.id,
        class_id: event.resource.classId,
        subject_id: event.resource.subjectId,
        teacher_id: event.resource.teacherId,
        classroom_id: event.resource.classroomId,
        day_of_week: numberToDayName(dayOfWeek),
        start_time: format(start, 'HH:mm'),
        end_time: format(end, 'HH:mm'),
      };

      await rosterAPI.update_roster(updatedEvent);
      await fetchRosters();
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  // Handle event resize
  const handleEventResize = async ({ event, start, end }) => {
    try {
      const dayOfWeek = start.getDay() === 0 ? 7 : start.getDay();
      const updatedEvent = {
        id: event.id,
        class_id: event.resource.classId,
        subject_id: event.resource.subjectId,
        teacher_id: event.resource.teacherId,
        classroom_id: event.resource.classroomId,
        day_of_week: numberToDayName(dayOfWeek),
        start_time: format(start, 'HH:mm'),
        end_time: format(end, 'HH:mm'),
      };

      await rosterAPI.update_roster(updatedEvent);
      await fetchRosters();
      toast.success('Duration updated successfully');
    } catch (error) {
      console.error('Failed to resize event:', error);
      toast.error('Failed to update duration');
    }
  };
  const calendarKey = modalOpen ? 'locked' : 'live';

  // Custom event style
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: '#10b981',
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
    };
    return { style };
  };

  return (
    <div className="flex flex-col h-full ">
      <PageHeader
        title="Rooster Beheer"
        icon={<CalendarDays className="size-9" />}
        description="Beheer het lesrooster interactief met drag & drop"
      />

      <RosterFilters
        classes={classes}
        teachers={teachers}
        classrooms={classrooms}
        filters={filters}
        onFiltersChange={setFilters}
        rightAction={
          <Button onClick={() => setCreateModalOpen(true)}>Les Inplannen</Button>
        }
      />

      <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-muted-foreground">Roosters laden...</div>
          </div>
        ) : (
          <DnDCalendar
            key={calendarKey}
            localizer={localizer}
            events={eventsForCalendar}
            defaultView="week"
            views={['week', 'day']}
            step={30}
            showMultiDayTimes
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 18, 0, 0)}
            date={currentDate}
            onNavigate={setCurrentDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={!modalOpen ? handleEventDrop : undefined}
            onEventResize={!modalOpen ? handleEventResize : undefined}
            selectable={!modalOpen}
            resizable={!modalOpen}
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}
            culture="nl-NL"
            components={{
              toolbar: CustomToolbar,
              event: ({ event }) => (
                <div className="p-1 text-xs">
                  <div className="font-semibold">{event.title}</div>
                  {event.resource.teacherName && (
                    <div>{event.resource.teacherName}</div>
                  )}
                  {event.resource.classroomName && (
                    <div>{event.resource.classroomName}</div>
                  )}
                </div>
              ),
            }}
          />
        )}
      </div>

      <LessonModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedEvent(null);
            setSelectedSlot(null);
            eventsCacheRef.current = filteredEvents; // sync to latest
          }
        }}
        selectedEvent={selectedEvent}
        selectedSlot={selectedSlot}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
        onSave={handleSave}
      />
      <CreateLessonModal
        open={createModalOpen}
        onOpenChange={(open) => setCreateModalOpen(open)}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
        onSave={handleSave}
      />
    </div>
  );
}
