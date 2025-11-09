import {
  addDays,
  format,
  getDay,
  parse,
  setHours,
  setMinutes,
  startOfWeek,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { toast } from 'sonner';

import LessonModal from '@/components/rosters/LessonModal';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import classAPI from '@/apis/classAPI';
import classroomAPI from '@/apis/classroomAPI';
import rosterAPI from '@/apis/rosterAPI';
import subjectAPI from '@/apis/subjectAPI';
import teachersAPI from '@/apis/teachersAPI';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const DnDCalendar = withDragAndDrop(Calendar);
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

// Custom toolbar for a static weekly view
const CustomToolbar = () => (
  <div className="rbc-toolbar">
    <div className="rbc-toolbar-label">Weekrooster</div>
    <div className="rbc-btn-group">
      <button type="button" className="rbc-active">
        Week
      </button>
    </div>
  </div>
);

// Placeholder for when no class is selected
const SchedulePlaceholder = () => (
  <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/40">
    <div className="text-center">
      <GraduationCap className="mx-auto size-12 text-muted-foreground/80" />
      <p className="mt-4 font-semibold text-muted-foreground">
        Selecteer een klas
      </p>
      <p className="text-sm text-muted-foreground/60">
        Zodra een klas is geselecteerd, wordt hier het weekrooster weergegeven.
      </p>
    </div>
  </div>
);

const ClassSchedulePage = () => {
  const [rosters, setRosters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date()); // Static date for a generic week view

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const eventsCacheRef = useRef([]);

  const fetchRosters = useCallback(async () => {
    try {
      const rostersData = await rosterAPI.get_rosters();
      setRosters(rostersData);
    } catch (error) {
      console.error('Failed to fetch rosters:', error);
      toast.error('Opnieuw laden van rooster is mislukt');
    }
  }, []);

  // Fetch all necessary data
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [
          rostersData,
          classesData,
          subjectsData,
          teachersData,
          classroomsData,
        ] = await Promise.all([
          rosterAPI.get_rosters(),
          classAPI.get_classes(),
          subjectAPI.get_subjects(),
          teachersAPI.get_teachers(),
          classroomAPI.getClassrooms(),
        ]);

        setRosters(rostersData);
        setClasses(classesData);
        setSubjects(subjectsData);
        setTeachers(teachersData);
        setClassrooms(classroomsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Laden van roostergegevens is mislukt');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Transform raw roster data into calendar events
  const events = useMemo(() => {
    if (!rosters || rosters.length === 0 || !selectedClassId) return [];

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    return rosters
      .filter((roster) => String(roster.class_id) === selectedClassId)
      .map((roster) => {
        // Convert day to offset - prioritize day_of_week field over ISO dates
        let dayOffset;

        if (roster.day_of_week) {
          const dayNum = parseInt(roster.day_of_week);
          if (!isNaN(dayNum)) {
            // It's a number as string like "1", "2", etc
            // Server sends 1-7 where 1=Monday, 7=Sunday
            if (dayNum === 7) {
              dayOffset = 6; // Sunday
            } else {
              dayOffset = dayNum - 1; // Monday=0, Tuesday=1, etc.
            }
          } else {
            // It's a day name like "Monday"
            const dayNameToNum = {
              Monday: 1,
              Tuesday: 2,
              Wednesday: 3,
              Thursday: 4,
              Friday: 5,
              Saturday: 6,
              Sunday: 7,
            };
            const num = dayNameToNum[roster.day_of_week] || 1;
            dayOffset = num - 1;
          }
        } else {
          dayOffset = 0; // Default to Monday
        }

        const eventDate = addDays(weekStart, dayOffset);

        const [startHour, startMinute] = roster.start_time
          .split(':')
          .map(Number);
        const [endHour, endMinute] = roster.end_time.split(':').map(Number);

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
          title: subject?.name || 'Onbekend vak',
          start,
          end,
          resource: {
            teacher: teacher
              ? `${teacher.first_name} ${teacher.last_name}`
              : 'Geen docent',
            classroom: classroom?.name || 'Geen lokaal',
            classId: roster.class_id,
            className: classInfo?.name || 'Onbekende klas',
            subjectId: roster.subject_id,
            teacherId: roster.teacher_id,
            classroomId: roster.classroom_id,
          },
          isDraggable: true,
        };
      });
  }, [
    rosters,
    selectedClassId,
    subjects,
    teachers,
    classrooms,
    classes,
    currentDate,
  ]);

  // Keep cache in sync only when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      eventsCacheRef.current = events;
    }
  }, [events, isModalOpen]);

  // Check for conflicts
  const checkConflicts = useCallback(
    (start, end, excludeId = null) => {
      const dayNum = getDay(start);
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const dayOfWeek = days[dayNum];
      const startTime = format(start, 'HH:mm');
      const endTime = format(end, 'HH:mm');

      return rosters.filter((roster) => {
        if (excludeId && roster.id === excludeId) return false;
        if (roster.day_of_week !== dayOfWeek) return false;

        const rosterStart = roster.start_time;
        const rosterEnd = roster.end_time;

        // Check for time overlap
        return startTime < rosterEnd && endTime > rosterStart;
      });
    },
    [rosters]
  );

  // Choose which list to render
  const eventsForCalendar = isModalOpen ? eventsCacheRef.current : events;

  // Handle slot selection for new lesson
  const handleSelectSlot = useCallback(
    ({ start, end }) => {
      if (!selectedClassId) {
        toast.error('Selecteer eerst een klas');
        return;
      }

      // Check for conflicts
      const conflicts = checkConflicts(start, end);
      const classConflict = conflicts.find(
        (c) => String(c.class_id) === selectedClassId
      );

      if (classConflict) {
        toast.error(
          'Dit tijdslot conflicteert met een bestaande les voor deze klas'
        );
        return;
      }

      setSelectedSlot({ start, end });
      setSelectedEvent(null);
      setIsModalOpen(true);
    },
    [selectedClassId, checkConflicts]
  );

  // Handle event selection for editing
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setIsModalOpen(true);
  }, []);

  // Handle drag and drop
  const handleEventDrop = useCallback(
    async ({ event, start, end }) => {
      // Check for conflicts
      const conflicts = checkConflicts(start, end, event.id);
      const hasConflict = conflicts.some(
        (c) =>
          c.teacher_id === event.resource.teacherId ||
          c.classroom_id === event.resource.classroomId ||
          String(c.class_id) === selectedClassId
      );

      if (hasConflict) {
        toast.error('Kan les niet verplaatsen - conflicteert met bestaand rooster');
        return;
      }

      try {
        const dayNum = getDay(start);
        const days = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayOfWeek = days[dayNum];
        await rosterAPI.update_roster({
          id: event.id,
          day_of_week: dayOfWeek,
          start_time: format(start, 'HH:mm'),
          end_time: format(end, 'HH:mm'),
          class_id: event.resource.classId,
          subject_id: event.resource.subjectId,
          teacher_id: event.resource.teacherId,
          classroom_id: event.resource.classroomId,
        });

        toast.success('Les succesvol opnieuw ingepland');
        await fetchRosters();
      } catch (error) {
        console.error('Failed to update lesson:', error);
        toast.error('Opnieuw inplannen van les is mislukt');
      }
    },
    [selectedClassId, checkConflicts, fetchRosters]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    async ({ event, start, end }) => {
      // Check for conflicts
      const conflicts = checkConflicts(start, end, event.id);
      const hasConflict = conflicts.some(
        (c) =>
          c.teacher_id === event.resource.teacherId ||
          c.classroom_id === event.resource.classroomId ||
          String(c.class_id) === selectedClassId
      );

      if (hasConflict) {
        toast.error('Kan les niet van duur veranderen - conflicteert met bestaand rooster');
        return;
      }

      try {
        const dayNum2 = getDay(start);
        const days2 = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayOfWeek2 = days2[dayNum2];
        await rosterAPI.update_roster({
          id: event.id,
          day_of_week: dayOfWeek2,
          start_time: format(start, 'HH:mm'),
          end_time: format(end, 'HH:mm'),
          class_id: event.resource.classId,
          subject_id: event.resource.subjectId,
          teacher_id: event.resource.teacherId,
          classroom_id: event.resource.classroomId,
        });

        toast.success('Lesduur bijgewerkt');
        await fetchRosters();
      } catch (error) {
        console.error('Failed to resize lesson:', error);
        toast.error('Bijwerken van lesduur is mislukt');
      }
    },
    [selectedClassId, checkConflicts, fetchRosters]
  );

  // Custom event styling
  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: 'var(--primary)',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  // Custom event component
  const CustomEvent = ({ event }) => (
    <div className="p-1 text-xs">
      <div className="font-semibold">{event.title}</div>
      <div className="opacity-90">{event.resource.teacher}</div>
      <div className="opacity-90">{event.resource.classroom}</div>
    </div>
  );

  // Get selected class info
  const selectedClass = classes.find((c) => String(c.id) === selectedClassId);

  return (
    <>
      <PageHeader
        title="Lesrooster per Klas"
        icon={<GraduationCap className="size-9" />}
        description="Beheer het wekelijks terugkerende rooster voor een specifieke klas"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Selecteer een Klas</CardTitle>
          <CardDescription>
            Kies een klas om het weekrooster te bekijken en te beheren. Alle
            lessen zijn wekelijks terugkerende evenementen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecteer een klas" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .filter((cls) => cls.id != null)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedClass && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {isLoading ? 'Laden...' : `${events.length} lessen ingepland`}
                </Badge>
                <Badge variant="secondary">Wekelijks terugkerend</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Weekrooster {selectedClass ? `voor ${selectedClass.name}` : ''}
          </CardTitle>
          <CardDescription>
            {selectedClassId
              ? 'Sleep om te herschikken, pas de grootte aan om de duur aan te passen, of klik op lege plekken om nieuwe lessen toe te voegen. Wijzigingen zijn van toepassing op alle toekomstige weken.'
              : 'Selecteer een klas om het rooster te bekijken en te beheren.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedClassId ? (
            <DnDCalendar
              localizer={localizer}
              events={eventsForCalendar}
              defaultView="week"
              views={['week']}
              step={60}
              showMultiDayTimes
              min={new Date(0, 0, 0, 8, 0, 0)}
              max={new Date(0, 0, 0, 18, 0, 0)}
              date={currentDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              selectable
              resizable
              draggableAccessor="isDraggable"
              eventPropGetter={eventStyleGetter}
              culture="nl-NL"
              components={{
                toolbar: CustomToolbar,
                event: CustomEvent,
              }}
              className="h-[600px]"
            />
          ) : (
            <SchedulePlaceholder />
          )}
        </CardContent>
      </Card>

      <LessonModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            // Clear selection when modal is closed
            setSelectedEvent(null);
            setSelectedSlot(null);
          }
        }}
        selectedEvent={selectedEvent}
        selectedSlot={selectedSlot}
        classes={classes.filter((c) => String(c.id) === selectedClassId)}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
        onSave={async () => {
          await fetchRosters();
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default ClassSchedulePage;
