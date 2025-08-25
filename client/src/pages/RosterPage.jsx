import { get_classes } from '@/apis/classes/classAPI';
import { getClassrooms } from '@/apis/classrooms/classroomAPI';
import rosterAPI from '@/apis/rosters/rosterAPI';
import { get_teachers } from '@/apis/teachers/teachersAPI';
import RosterEventModal from '@/components/rosters/RosterEventModal';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useCallback, useEffect, useState } from 'react';

const SelectionPanel = ({ title, items, selectedId, onSelect }) => (
  <div className="mb-4">
    <h3 className="font-semibold mb-2 text-lg">{title}</h3>
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={item.id}
          className={`cursor-pointer p-2 rounded-md transition-colors ${
            selectedId === item.id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          onClick={() => onSelect(item.id)}
        >
          {item.name || `${item.first_name} ${item.last_name}`}
        </li>
      ))}
    </ul>
  </div>
);

export default function RosterPage() {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selection, setSelection] = useState({
    type: null,
    id: null,
  });

  const [classLayouts, setClassLayouts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const fetchRosters = useCallback(async () => {
    if (!selection.type || !selection.id) {
      setEvents([]);
      return;
    }
    try {
      const filters = {
        [`${selection.type}Id`]: selection.id,
      };
      const data = await rosterAPI.get_rosters(filters);
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch rosters:', error);
    }
  }, [selection]);

  useEffect(() => {
    fetchRosters();
  }, [fetchRosters]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [layouts, teachersData, classroomsData] = await Promise.all([
          get_classes(),
          get_teachers(),
          getClassrooms(),
        ]);
        setClassLayouts(layouts || []);
        setTeachers(teachersData || []);
        setClassrooms(classroomsData || []);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    }
    fetchData();
  }, []);

  const handleSelect = (type, id) => {
    if (selection.type === type && selection.id === id) {
      setSelection({ type: null, id: null }); // Deselect if clicking the same item
    } else {
      setSelection({ type, id });
    }
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedEvent({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
    });
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = events.find((e) => e.id.toString() === clickInfo.event.id);
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleModalSubmit = async (eventData) => {
    try {
      const payload = {
        ...eventData,
        classLayoutId: parseInt(eventData.classLayoutId, 10),
        teacherId: parseInt(eventData.teacherId, 10),
        classroomId: parseInt(eventData.classroomId, 10),
      };

      if (payload.id) {
        await rosterAPI.update_roster(payload.id, payload);
      } else {
        await rosterAPI.add_roster(payload);
      }
      fetchRosters();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleModalDelete = async (eventId) => {
    try {
      await rosterAPI.delete_roster(eventId);
      fetchRosters();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <div className="flex h-full gap-6 p-4">
      <aside className="w-1/4 max-w-xs p-4 bg-card rounded-lg shadow-sm overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Selections</h2>
        <SelectionPanel
          title="Group"
          items={classLayouts}
          selectedId={selection.type === 'classLayout' ? selection.id : null}
          onSelect={(id) => handleSelect('classLayout', id)}
        />
        <SelectionPanel
          title="Classroom"
          items={classrooms}
          selectedId={selection.type === 'classroom' ? selection.id : null}
          onSelect={(id) => handleSelect('classroom', id)}
        />
        <SelectionPanel
          title="Teacher"
          items={teachers}
          selectedId={selection.type === 'teacher' ? selection.id : null}
          onSelect={(id) => handleSelect('teacher', id)}
        />
      </aside>

      <main className="flex-1 bg-card p-4 rounded-lg shadow-sm">
        <FullCalendar
          plugins={[interactionPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay',
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
        />
      </main>

      <RosterEventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleModalSubmit}
        onDelete={handleModalDelete}
        event={selectedEvent}
      />
    </div>
  );
}
