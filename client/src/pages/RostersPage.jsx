import classAPI from '@/apis/classes/classAPI';
import classroomAPI from '@/apis/classrooms/classroomAPI';
import rosterAPI from '@/apis/rosters/rosterAPI';
import teachersAPI from '@/apis/teachers/teachersAPI';
import RosterEventModal from '@/components/rosters/RosterEventModal';
import PageHeader from '@/components/shared/PageHeader';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { CalendarDays } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function RostersPage() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [activeFilter, setActiveFilter] = useState({ type: null, id: null });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [draftEvent, setDraftEvent] = useState(null);

  // Load selection lists
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [g, t, r] = await Promise.all([
          classAPI.get_classes(),
          teachersAPI.get_teachers(),
          classroomAPI.get_classrooms(),
        ]);
        if (mounted) {
          setGroups(g || []);
          setTeachers(t || []);
          setClassrooms(r || []);
        }
      } catch (e) {
        console.error('Failed to load selection lists', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (activeFilter.type === 'group')
        filters.classLayoutId = activeFilter.id;
      if (activeFilter.type === 'teacher') filters.teacherId = activeFilter.id;
      if (activeFilter.type === 'classroom')
        filters.classroomId = activeFilter.id;
      const data = await rosterAPI.get_rosters(filters);
      setEvents(
        (data || []).map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          extendedProps: {
            classLayoutId: e.classLayoutId ?? null,
            teacherId: e.teacherId ?? null,
            classroomId: e.classroomId ?? null,
          },
        }))
      );
    } catch (e) {
      console.error('Failed to load roster events', e);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const selectionLists = useMemo(
    () => [
      {
        key: 'group',
        label: 'Group',
        items: groups.map((g) => ({ id: g.id, label: g.name })),
      },
      {
        key: 'classroom',
        label: 'Classroom',
        items: classrooms.map((c) => ({ id: c.id, label: c.name })),
      },
      {
        key: 'teacher',
        label: 'Teacher',
        items: teachers.map((t) => ({
          id: t.id,
          label:
            [t.first_name, t.last_name].filter(Boolean).join(' ') || t.email,
        })),
      },
    ],
    [groups, classrooms, teachers]
  );

  const handleDateSelect = (selectInfo) => {
    setDraftEvent({
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      classLayoutId: activeFilter.type === 'group' ? activeFilter.id : null,
      teacherId: activeFilter.type === 'teacher' ? activeFilter.id : null,
      classroomId: activeFilter.type === 'classroom' ? activeFilter.id : null,
    });
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const { event } = clickInfo;
    setDraftEvent({
      id: Number(event.id),
      title: event.title,
      start: event.start?.toISOString(),
      end: event.end?.toISOString(),
      classLayoutId: event.extendedProps.classLayoutId ?? null,
      teacherId: event.extendedProps.teacherId ?? null,
      classroomId: event.extendedProps.classroomId ?? null,
    });
    setModalOpen(true);
  };

  const saveEvent = async (payload) => {
    if (draftEvent?.id) {
      await rosterAPI.update_roster({ id: draftEvent.id, ...payload });
    } else {
      await rosterAPI.add_roster(payload);
    }
    setModalOpen(false);
    setDraftEvent(null);
    fetchEvents();
  };

  const deleteEvent = async (initial) => {
    if (!initial?.id) return;
    await rosterAPI.delete_roster(initial.id);
    setModalOpen(false);
    setDraftEvent(null);
    fetchEvents();
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Roosters"
        icon={<CalendarDays className="size-9" />}
        description="Plan lessen interactief in de kalender."
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 space-y-6">
          {selectionLists.map((list) => (
            <div key={list.key}>
              <h3 className="text-sm font-semibold mb-2">{list.label}</h3>
              <div className="space-y-1">
                {list.items.map((item) => {
                  const isActive =
                    activeFilter.type === list.key &&
                    activeFilter.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setActiveFilter(
                          isActive
                            ? { type: null, id: null }
                            : { type: list.key, id: item.id }
                        )
                      }
                      className={`w-full text-left px-3 py-2 rounded-md border transition ${
                        isActive
                          ? 'bg-accent border-accent-foreground/20'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="md:col-span-3">
          {!activeFilter.type ? (
            <div className="h-[70vh] flex items-center justify-center border rounded-md">
              <p className="text-muted-foreground">
                Selecteer links een Group, Classroom of Teacher.
              </p>
            </div>
          ) : (
            <FullCalendar
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              selectable
              selectMirror
              editable={false}
              events={events}
              select={handleDateSelect}
              eventClick={handleEventClick}
              height="70vh"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay',
              }}
            />
          )}
        </div>
      </div>

      <RosterEventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialEvent={draftEvent}
        onSave={saveEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
