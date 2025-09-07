import { useCallback, useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { toast } from 'sonner';

// APIs
import { get_classes } from '@/apis/classAPI';
import { getClassrooms } from '@/apis/classroomAPI';
import rosterAPI from '@/apis/rosterAPI';
import { get_subjects } from '@/apis/subjectAPI';
import { get_teachers } from '@/apis/teachersAPI';

// Components
import PageHeader from '@/components/shared/PageHeader';
import LessonModal from '@/components/rosters/LessonModal';
import RosterFilters from '@/components/rosters/RosterFilters';

// Styles
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '@/styles/calendar-overrides.css';

import { CalendarDays } from 'lucide-react';

// Setup date-fns localizer
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Create DnD Calendar
const DnDCalendar = withDragAndDrop(Calendar);

export default function RostersPage() {
  // Data states
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Fetch all rosters and convert to calendar events
  const fetchRosters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rosterAPI.get_rosters();
      
      // Transform roster data to calendar events
      const calendarEvents = data.map((roster) => {
        // Parse the ISO strings from the API
        const start = new Date(roster.start);
        const end = new Date(roster.end);
        
        return {
          id: roster.id,
          title: roster.subject?.name || roster.title || 'Lesson',
          start,
          end,
          resource: {
            ...roster,
            classId: roster.class_id,
            teacherId: roster.teacher_id,
            classroomId: roster.classroom_id,
            subjectId: roster.subject_id,
            className: roster.class_layout?.name,
            teacherName: roster.teacher ? 
              `${roster.teacher.first_name} ${roster.teacher.last_name}` : '',
            classroomName: roster.classroom?.name,
          },
        };
      });
      
      setEvents(calendarEvents);
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

  // Filter events based on selected filters
  const filteredEvents = events.filter((event) => {
    const { classIds, teacherIds, classroomIds } = filters;
    const resource = event.resource;

    if (classIds.length > 0 && !classIds.includes(resource.classId)) {
      return false;
    }
    if (teacherIds.length > 0 && !teacherIds.includes(resource.teacherId)) {
      return false;
    }
    if (classroomIds.length > 0 && !classroomIds.includes(resource.classroomId)) {
      return false;
    }
    
    return true;
  });

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
    setModalOpen(true);
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      const updatedEvent = {
        ...event.resource,
        id: event.id,
        start: start.toISOString(),
        end: end.toISOString(),
      };

      await rosterAPI.update_roster(updatedEvent);
      
      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, start, end }
            : e
        )
      );
      
      toast.success('Schedule updated successfully');
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('Failed to update schedule');
      fetchRosters(); // Refresh on error
    }
  };

  // Handle event resize
  const handleEventResize = async ({ event, start, end }) => {
    try {
      const updatedEvent = {
        ...event.resource,
        id: event.id,
        start: start.toISOString(),
        end: end.toISOString(),
      };

      await rosterAPI.update_roster(updatedEvent);
      
      // Update local state
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, start, end }
            : e
        )
      );
      
      toast.success('Duration updated successfully');
    } catch (error) {
      console.error('Failed to resize event:', error);
      toast.error('Failed to update duration');
      fetchRosters(); // Refresh on error
    }
  };

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
    <div className="flex flex-col h-full p-6 space-y-6">
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
      />

      <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-muted-foreground">Roosters laden...</div>
          </div>
        ) : (
          <DnDCalendar
            localizer={localizer}
            events={filteredEvents}
            defaultView="week"
            views={['week', 'day']}
            step={30}
            showMultiDayTimes
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 18, 0, 0)}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            selectable
            resizable
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}
            components={{
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
        onOpenChange={setModalOpen}
        selectedEvent={selectedEvent}
        selectedSlot={selectedSlot}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
        onSave={fetchRosters}
      />
    </div>
  );
}