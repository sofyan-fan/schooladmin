import { addDays, setHours, setMinutes } from 'date-fns';
import format from 'date-fns/format';
import getDay from 'date-fns/getDay';
import { nl } from 'date-fns/locale';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';

import rosterAPI from '@/apis/rosterAPI';
import RequestHandler from '@/apis/RequestHandler';
import PageHeader from '@/components/shared/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarDays } from 'lucide-react';

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
  // react-big-calendar toolbar styles
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

const capitalizeFirst = (str) =>
  typeof str === 'string' && str.length
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : '';

const LessonReadOnlyDialog = ({ open, onOpenChange, event }) => {
  if (!event) return null;

  const resource = event.resource || {};
  const dateLabel = capitalizeFirst(
    format(event.start, 'EEEE d MMMM yyyy', { locale: nl })
  );
  const timeLabel = `${format(event.start, 'HH:mm')} - ${format(
    event.end,
    'HH:mm'
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title || 'Les'}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3 text-sm">
          <p className="text-muted-foreground">
            {dateLabel} · {timeLabel}
          </p>
          <div className="space-y-1">
            <div>
              <span className="font-medium">Vak: </span>
              <span>{resource.subject?.name || event.title || 'Onbekend'}</span>
            </div>
            <div>
              <span className="font-medium">Docent: </span>
              <span>{resource.teacherName || 'Onbekend'}</span>
            </div>
            <div>
              <span className="font-medium">Klas: </span>
              <span>{resource.className || 'Onbekend'}</span>
            </div>
            <div>
              <span className="font-medium">Lokaal: </span>
              <span>{resource.classroomName || 'Onbekend'}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StudentRosterPage = () => {
  const [rawRosters, setRawRosters] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [student, setStudent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchStudentAndRosters = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const resp = await RequestHandler.get('/auth/me/student');
      const s = resp?.data;
      setStudent(s || null);

      if (!s?.class_id) {
        setRawRosters([]);
        return;
      }

      const rosters = await rosterAPI.get_rosters({ class_id: s.class_id });
      setRawRosters(Array.isArray(rosters) ? rosters : []);
    } catch (e) {
      console.error('Failed to load student rosters', e);
      setError('Het lesrooster kon niet worden geladen.');
      setRawRosters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentAndRosters();
  }, [fetchStudentAndRosters]);

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

      const subject = roster.subject;
      const teacher = roster.teacher;
      const classroom = roster.classroom;
      const classInfo = roster.class_layout;

      return {
        id: roster.id,
        title: subject?.name || roster.title || 'Les',
        start,
        end,
        resource: {
          ...roster,
          className: classInfo?.name || '',
          teacherName: teacher
            ? `${teacher.first_name} ${teacher.last_name}`
            : '',
          classroomName: classroom?.name || '',
        },
      };
    });
  }, [rawRosters, currentDate]);

  const eventStyleGetter = () => {
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

    if (!student?.class_id) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            Je bent nog niet gekoppeld aan een klas. Neem contact op met de
            administratie om je klas te laten koppelen.
          </div>
        </div>
      );
    }

    if (!events.length) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            Er zijn nog geen lessen ingepland voor jouw klas.
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
        onSelectEvent={setSelectedEvent}
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
    );
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Mijn Rooster"
        icon={<CalendarDays className="size-9" />}
        description="Bekijk je lesrooster per week of per dag."
      />
      <div className="mt-4 flex-1 rounded-lg bg-white p-4 shadow-sm">
        {calendarContent()}
      </div>
      <LessonReadOnlyDialog
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
        event={selectedEvent}
      />
    </div>
  );
};

export default StudentRosterPage;


