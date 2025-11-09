import { addDays, setHours, setMinutes } from 'date-fns';
import format from 'date-fns/format';
import getDay from 'date-fns/getDay';
import { nl } from 'date-fns/locale';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
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
import ExportDialog from '@/utils/ExportDialog';
import exportScheduleToPDF from '@/utils/exportScheduleToPDF';

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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Fetch all rosters and store raw data
  const fetchRosters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rosterAPI.get_rosters();
      setRawRosters(data);
    } catch (error) {
      console.error('Failed to fetch roosters:', error);
      toast.error('Laden van roosters is mislukt');
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
      toast.error('Laden van gegevens is mislukt');
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

  // Build transformed events anchored to a specific date (for export)
  const buildEventsForAnchorDate = useCallback(
    (anchorDate) => {
      if (!rawRosters || rawRosters.length === 0) return [];
      const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
      return rawRosters.map((roster) => {
        let dayOffset;
        if (roster.day_of_week) {
          const dayNum = parseInt(roster.day_of_week);
          if (!isNaN(dayNum)) {
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
            teacherName: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
            classroomName: classroom?.name || '',
          },
        };
      });
    },
    [rawRosters, subjects, teachers, classrooms, classes]
  );

  // Build events for a sliding window starting at startDate (numDays length)
  const buildEventsForWindow = useCallback(
    (startDate, numDays) => {
      if (!rawRosters || rawRosters.length === 0) return [];
      const startDayNum = (startDate.getDay() === 0 ? 7 : startDate.getDay()); // 1..7 (Mon..Sun)
      const windowEnd = addDays(startDate, Math.max(0, (numDays || 1) - 1));

      return rawRosters
        .map((roster) => {
          // Determine roster day number 1..7 (Mon..Sun)
          let rosterDayNum;
          if (roster.day_of_week) {
            const dn = parseInt(roster.day_of_week);
            if (!isNaN(dn)) {
              rosterDayNum = dn === 0 ? 7 : dn;
            } else {
              rosterDayNum = dayNameToNumber(roster.day_of_week) || 1;
            }
          } else {
            rosterDayNum = 1;
          }
          // Offset within the sliding window [0..6]
          const offset = (rosterDayNum - startDayNum + 7) % 7;
          const eventDate = addDays(startDate, offset);
          // Ensure within window
          if (eventDate < startDate || eventDate > windowEnd) return null;

          // Parse times
          let startHour = 9,
            startMinute = 0;
          let endHour = 10,
            endMinute = 0;
          if (roster.start_time) {
            [startHour, startMinute] = roster.start_time.split(':').map(Number);
          } else if (roster.start) {
            const startDateObj = new Date(roster.start);
            startHour = startDateObj.getHours();
            startMinute = startDateObj.getMinutes();
          }
          if (roster.end_time) {
            [endHour, endMinute] = roster.end_time.split(':').map(Number);
          } else if (roster.end) {
            const endDateObj = new Date(roster.end);
            endHour = endDateObj.getHours();
            endMinute = endDateObj.getMinutes();
          }
          const start = setMinutes(setHours(eventDate, startHour), startMinute);
          const end = setMinutes(setHours(eventDate, endHour), endMinute);

          // Resolve related entities
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
        })
        .filter(Boolean);
    },
    [rawRosters, subjects, teachers, classrooms, classes]
  );

  const applyCurrentFilters = useCallback(
    (events) => {
      const { classIds, teacherIds, classroomIds } = filters;
      return events.filter((event) => {
        const resource = event.resource;
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
    },
    [filters]
  );

  const getEventsForScope = useCallback(
    (scope, anchorDate) => {
      if (scope === 'day') {
        const all = buildEventsForWindow(anchorDate, 1);
        return applyCurrentFilters(all);
      }
      // week: sliding window starting at selected date
      const all = buildEventsForWindow(anchorDate, 7);
      return applyCurrentFilters(all);
    },
    [applyCurrentFilters, buildEventsForWindow]
  );

  const exportDayScheduleToPDF = useCallback((events, anchorDate) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = { top: 16, right: 12, bottom: 16, left: 12 };
    const timeLabelWidth = 20;
    const contentX = margin.left + timeLabelWidth;
    const yStart = margin.top + 20;
    const yEnd = pageHeight - margin.bottom - 14;
    const contentWidth = pageWidth - margin.right - contentX;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    const titleText = `LESROOSTER – ${anchorDate.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toUpperCase()}`;
    doc.text(titleText, pageWidth / 2, margin.top + 2, { align: 'center' });

    // Determine hour range
    const mins = (d) => d.getHours() * 60 + d.getMinutes();
    const minEventStart = Math.min(...events.map((e) => mins(e.start)));
    const maxEventEnd = Math.max(...events.map((e) => mins(e.end)));
    let minHour = Math.floor(minEventStart / 60);
    let maxHour = Math.ceil(maxEventEnd / 60);
    minHour = Math.min(minHour, 8);
    maxHour = Math.max(maxHour, 18);
    minHour = Math.max(0, Math.min(minHour, 23));
    maxHour = Math.min(24, Math.max(maxHour, minHour + 1));

    const totalMinutes = (maxHour - minHour) * 60;
    const yForMinutes = (m) =>
      yStart + ((m - minHour * 60) / totalMinutes) * (yEnd - yStart);
    const yForDate = (d) => yForMinutes(mins(d));

    // Hour grid
    doc.setLineWidth(0.2);
    for (let h = minHour; h <= maxHour; h++) {
      const y = yForMinutes(h * 60);
      doc.setDrawColor(230, 230, 230);
      doc.line(contentX, y, pageWidth - margin.right, y);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      const label = `${String(h).padStart(2, '0')}:00`;
      doc.text(label, margin.left, y + 3);
    }

    // Group events by overlapping time windows ("slots")
    const sorted = [...events].sort((a, b) => a.start - b.start);
    const groups = [];
    let current = [];
    let currentEnd = null;
    sorted.forEach((ev) => {
      if (current.length === 0) {
        current.push(ev);
        currentEnd = ev.end;
        return;
      }
      // Overlap if start < currentEnd
      if (ev.start < currentEnd) {
        current.push(ev);
        if (ev.end > currentEnd) currentEnd = ev.end;
      } else {
        groups.push(current);
        current = [ev];
        currentEnd = ev.end;
      }
    });
    if (current.length) groups.push(current);

    const colGap = 4;

    // Render each group with equal width columns inside that slot
    groups.forEach((group) => {
      const n = group.length;
      const colWidth =
        n > 0 ? (contentWidth - colGap * (n - 1)) / n : contentWidth;

      group.forEach((ev, idx) => {
        const x = contentX + idx * (colWidth + colGap);
        const y1 = yForDate(ev.start);
        const y2 = yForDate(ev.end);
        const height = Math.max(12, y2 - y1);

        // Block with requested color #88BB18
        doc.setFillColor(136, 187, 24);
        doc.roundedRect(x, y1, colWidth, height, 3, 3, 'F');

        // Larger text inside block
        const pad = 5; // base left/right padding
        let textY = y1 + 6;
        doc.setTextColor(255, 255, 255);

        // Time
        doc.setFontSize(11);
        const timeStr = `${format(ev.start, 'HH:mm')} – ${format(ev.end, 'HH:mm')}`;
        doc.text(timeStr, x + pad, textY);
        // extra vertical spacing after time line
        textY += 7;

        // Subject
        doc.setFontSize(13);
        const subject = ev.title || '';
        const subjWrapped = doc.splitTextToSize(subject, colWidth - pad * 2);
        doc.text(subjWrapped, x + pad, textY);
        // add increased line spacing between subject lines
        const subjectLines = Array.isArray(subjWrapped) ? subjWrapped.length : 1;
        textY += subjectLines * 7;

        // Teacher
        const teacher = ev.resource?.teacherName || '';
        if (teacher && height - (textY - y1) > 5) {
          doc.setFontSize(12);
          doc.text(teacher, x + pad, textY);
        }
      });
    });

    // Footer branding
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(14);
    doc.text('MaktApp', margin.left, pageHeight - 10);

    const fileName = `rooster_${anchorDate.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }, []);

  const exportEventsToExcel = useCallback(async (events, scope, anchorDate) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rooster');
    workbook.creator = 'School Admin System';
    workbook.lastModifiedBy = 'School Admin System';
    workbook.created = new Date();
    workbook.modified = new Date();

    worksheet.getColumn(1).width = 16; // Datum
    worksheet.getColumn(2).width = 14; // Dag
    worksheet.getColumn(3).width = 18; // Tijd (wider)
    worksheet.getColumn(4).width = 26; // Vak
    worksheet.getColumn(5).width = 22; // Docent
    worksheet.getColumn(6).width = 16; // Klas
    worksheet.getColumn(7).width = 16; // Lokaal

    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    const dateFmt = (d) =>
      d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekStart = scope === 'week' ? anchorDate : startOfWeek(anchorDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    titleCell.value =
      scope === 'day'
        ? `LESROOSTER – ${anchorDate.toLocaleDateString('nl-NL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
        : `LESROOSTER – Week van ${dateFmt(weekStart)} t/m ${dateFmt(weekEnd)}`;
    titleCell.font = { bold: true, size: 18, color: { argb: 'FF1E3A8A' }, name: 'Calibri' };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 8;

    const headerRow = worksheet.getRow(3);
    headerRow.values = ['Datum', 'Dag', 'Tijd', 'Vak', 'Docent', 'Klas', 'Lokaal'];
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      };
    });

    const sorted = [...events].sort((a, b) => a.start - b.start);
    sorted.forEach((ev, idx) => {
      const r = worksheet.getRow(idx + 4);
      const dateStr = ev.start.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const dayStr = ev.start.toLocaleDateString('nl-NL', { weekday: 'long' });
      const timeStr = `${format(ev.start, 'HH:mm')} - ${format(ev.end, 'HH:mm')}`;
      r.values = [
        dateStr,
        dayStr,
        timeStr,
        ev.title || '',
        ev.resource.teacherName || '',
        ev.resource.className || '',
        ev.resource.classroomName || '',
      ];
      r.height = 20;
      const isEven = idx % 2 === 0;
      r.eachCell((cell) => {
        cell.font = { size: 11, name: 'Calibri' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8F9FA' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    worksheet.views = [{ state: 'frozen', ySplit: 3 }];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName =
      scope === 'day'
        ? `rooster_${anchorDate.toISOString().split('T')[0]}.xlsx`
        : `rooster_week_${weekStart.toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  }, []);

  const handleExportExcel = useCallback(
    async (args) => {
      try {
        const scope = args?.scope === 'day' ? 'day' : 'week';
        const anchorDate = args?.date ? new Date(args.date) : currentDate;
        const events = getEventsForScope(scope, anchorDate);
        if (events.length === 0) {
          toast.info('Geen roosteritems gevonden voor het gekozen bereik.');
          return;
        }
        await exportEventsToExcel(events, scope, anchorDate);
        toast.success('Rooster succesvol geëxporteerd naar Excel!');
      } catch (e) {
        console.error(e);
        toast.error('Kon het rooster niet exporteren naar Excel.');
      }
    },
    [currentDate, exportEventsToExcel, getEventsForScope]
  );

  const handleExportPDF = useCallback(
    (args) => {
      try {
        const scope = args?.scope === 'day' ? 'day' : 'week';
        const anchorDate = args?.date ? new Date(args.date) : currentDate;
        const events = getEventsForScope(scope, anchorDate);
        if (events.length === 0) {
          toast.info('Geen roosteritems gevonden voor het gekozen bereik.');
          return;
        }
        if (scope === 'day') {
          exportDayScheduleToPDF(
            [...events].sort((a, b) => a.start - b.start),
            anchorDate
          );
        } else {
          const weekStart = anchorDate;
          const weekEnd = addDays(weekStart, 6);
          const title = (() => {
            const startStr = weekStart.toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short',
            });
            const endStr = weekEnd.toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            return `Lesrooster – ${startStr} – ${endStr}`;
          })();
          const rows = events
            .sort((a, b) => a.start - b.start)
            .map((ev) => ({
              date: ev.start, // formatter in util will handle date
              start_time: format(ev.start, 'HH:mm'),
              end_time: format(ev.end, 'HH:mm'),
              title: ev.title || '',
              teacher: ev.resource.teacherName || '',
              class: ev.resource.className || '',
              classroom: ev.resource.classroomName || '',
            }));
          const columns = [
            { header: 'Datum', accessorKey: 'date', displayName: 'Datum' },
            { header: 'Tijd', accessorKey: 'start_time', displayName: 'Tijd' },
            { header: 'Vak', accessorKey: 'title', displayName: 'Vak' },
            { header: 'Docent', accessorKey: 'teacher', displayName: 'Docent' },
            { header: 'Klas', accessorKey: 'class', displayName: 'Klas' },
            { header: 'Lokaal', accessorKey: 'classroom', displayName: 'Lokaal' },
          ];
          exportScheduleToPDF({
            columns,
            rows,
            options: {
              title,
              subtitle: '',
              headAlign: 'left',
              accentColor: '#88BB18',
              fileName: `rooster_week_${weekStart.toISOString().split('T')[0]}.pdf`,
            },
          });
        }
        toast.success('Rooster succesvol geëxporteerd naar PDF!');
      } catch (e) {
        console.error(e);
        toast.error('Kon het rooster niet exporteren naar PDF.');
      }
    },
    [currentDate, getEventsForScope]
  );

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
      toast.success('Rooster succesvol bijgewerkt');
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('Bijwerken van rooster is mislukt');
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
      toast.success('Duur succesvol bijgewerkt');
    } catch (error) {
      console.error('Failed to resize event:', error);
      toast.error('Bijwerken van duur is mislukt');
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
              Exporteren
            </Button>
            <Button onClick={() => setCreateModalOpen(true)}>Les Inplannen</Button>
          </div>
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
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        enableScopeSelection
        defaultScope="week"
        defaultDate={currentDate}
        title="Rooster exporteren"
        description="Kies een bereik en bestandsformaat voor export."
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
