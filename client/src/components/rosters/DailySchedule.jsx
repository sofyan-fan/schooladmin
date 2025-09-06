import classAPI from '@/apis/classAPI';
import classroomAPI from '@/apis/classroomAPI';
import rosterAPI from '@/apis/rosterAPI';
import subjectAPI from '@/apis/subjectAPI';
import teachersAPI from '@/apis/teachersAPI';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { format, startOfDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LessonBlockModal from './LessonBlockModal';

export default function DailySchedule({
  date,
  onBack,
  schedule,
  onScheduleChange,
  students,
}) {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editingLesson, setEditingLesson] = useState(null);
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          classesData,
          teachersData,
          classroomsData,
          subjectsData,
          rostersData,
        ] = await Promise.all([
          classAPI.get_classes(),
          teachersAPI.get_teachers(),
          classroomAPI.getClassrooms(),
          subjectAPI.get_subjects(),
          rosterAPI.get_rosters(),
        ]);

        // Classes don't need course subjects since we fetch subjects separately
        setClasses(classesData || []);
        setTeachers(teachersData || []);
        setClassrooms(classroomsData || []);
        setSubjects(subjectsData || []);

        // Filter rosters for the current day being viewed
        const currentDayOfWeek = format(date, 'eeee'); // Get day name like "Monday"
        const filteredRosters = rostersData.filter((roster) => {
          // Check if the roster's day_of_week matches the current day
          return roster.day_of_week === currentDayOfWeek;
        });

        console.log(
          `Found ${filteredRosters.length} rosters for ${currentDayOfWeek}`
        );
        const scheduleFromRosters = {};
        filteredRosters.forEach((roster) => {
          if (!scheduleFromRosters[roster.classLayoutId]) {
            scheduleFromRosters[roster.classLayoutId] = {};
          }

          // Adjust the roster times to the current viewing date
          const rosterStartTime =
            roster.start_time ||
            roster.start?.split('T')[1]?.substring(0, 5) ||
            '09:00';
          const rosterEndTime =
            roster.end_time ||
            roster.end?.split('T')[1]?.substring(0, 5) ||
            '10:00';

          // Create dates for the current viewing day with the roster times
          const [startHour, startMin] = rosterStartTime.split(':').map(Number);
          const [endHour, endMin] = rosterEndTime.split(':').map(Number);

          const startDate = new Date(date);
          startDate.setHours(startHour, startMin, 0, 0);

          const endDate = new Date(date);
          endDate.setHours(endHour, endMin, 0, 0);

          scheduleFromRosters[roster.classLayoutId][roster.id] = {
            id: roster.id,
            classId: roster.classLayoutId,
            subject: subjectsData.find((s) => s.id === roster.subjectId),
            teacher: teachersData.find((t) => t.id === roster.teacherId),
            classroom: classroomsData.find((c) => c.id === roster.classroomId),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          };
        });
        onScheduleChange(scheduleFromRosters);
      } catch (error) {
        console.error('Failed to fetch schedule data', error);
      }
    }
    fetchData();
  }, [date, onScheduleChange]);

  const eventsForClass = (classId) => {
    const classSchedule = schedule[classId] || {};
    const events = Object.values(classSchedule)
      .filter((lesson) => lesson && lesson.subject)
      .map((lesson) => ({
        id: lesson.id.toString(),
        title: lesson.subject.name,
        start: lesson.start,
        end: lesson.end,
        extendedProps: { lesson },
      }));
    console.log(`Events for class ${classId}:`, events);
    return events;
  };

  const saveLesson = (lessonToSave) => {
    onScheduleChange((prev) => {
      const newSchedule = { ...prev };
      if (!newSchedule[lessonToSave.classId]) {
        newSchedule[lessonToSave.classId] = {};
      }
      newSchedule[lessonToSave.classId][lessonToSave.id] = lessonToSave;
      return newSchedule;
    });
    toast.success(`${lessonToSave.subject.name} has been updated.`);
  };

  const checkForConflict = (lesson) => {
    const allLessons = Object.values(schedule).flatMap((classSchedule) =>
      Object.values(classSchedule)
    );
    const lessonStart = new Date(lesson.start);
    const lessonEnd = new Date(lesson.end);

    for (const otherLesson of allLessons) {
      if (otherLesson.id === lesson.id) continue;

      const otherStart = new Date(otherLesson.start);
      const otherEnd = new Date(otherLesson.end);

      const hasTimeOverlap = lessonStart < otherEnd && lessonEnd > otherStart;

      if (hasTimeOverlap) {
        const hasTeacherConflict =
          lesson.teacher?.id && otherLesson.teacher?.id === lesson.teacher.id;
        if (hasTeacherConflict) {
          return {
            type: 'Teacher',
            details: `${lesson.teacher.first_name} is already assigned to another lesson in this time slot.`,
          };
        }
        const hasClassroomConflict =
          lesson.classroom?.id &&
          otherLesson.classroom?.id === lesson.classroom.id;
        if (hasClassroomConflict) {
          return {
            type: 'Classroom',
            details: `${lesson.classroom.name} is already booked in this time slot.`,
          };
        }
      }
    }
    return null;
  };

  const proceedWithSave = async (lessonToSave) => {
    const isNew = !lessonToSave.id;

    const payload = {
      id: isNew ? undefined : lessonToSave.id,
      classLayoutId: lessonToSave.classId,
      subjectId: lessonToSave.subject.id,
      teacherId: lessonToSave.teacher.id,
      classroomId: lessonToSave.classroom.id,
      start: lessonToSave.start,
      end: lessonToSave.end,
      title: lessonToSave.subject.name,
    };

    try {
      if (isNew) {
        const newRoster = await rosterAPI.add_roster(payload);
        // Use the returned roster data which includes the proper ID
        saveLesson({
          ...lessonToSave,
          id: newRoster.id || newRoster.data?.id || Math.random(),
        });
      } else {
        await rosterAPI.update_roster(payload);
        saveLesson(lessonToSave);
      }

      // Re-fetch rosters to ensure we have the latest data
      const rostersData = await rosterAPI.get_rosters();

      // Filter rosters for the current day being viewed
      const currentDayOfWeek = format(date, 'eeee'); // Get day name like "Monday"
      const filteredRosters = rostersData.filter((roster) => {
        // Check if the roster's day_of_week matches the current day
        return roster.day_of_week === currentDayOfWeek;
      });

      const scheduleFromRosters = {};
      filteredRosters.forEach((roster) => {
        if (!scheduleFromRosters[roster.classLayoutId]) {
          scheduleFromRosters[roster.classLayoutId] = {};
        }

        // Adjust the roster times to the current viewing date
        const rosterStartTime =
          roster.start_time ||
          roster.start?.split('T')[1]?.substring(0, 5) ||
          '09:00';
        const rosterEndTime =
          roster.end_time ||
          roster.end?.split('T')[1]?.substring(0, 5) ||
          '10:00';

        // Create dates for the current viewing day with the roster times
        const [startHour, startMin] = rosterStartTime.split(':').map(Number);
        const [endHour, endMin] = rosterEndTime.split(':').map(Number);

        const startDate = new Date(date);
        startDate.setHours(startHour, startMin, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(endHour, endMin, 0, 0);

        const classLayout = classes.find((c) => c.id === roster.classLayoutId);

        scheduleFromRosters[roster.classLayoutId][roster.id] = {
          id: roster.id,
          classId: roster.classLayoutId,
          class_layout: classLayout,
          class_id: roster.classLayoutId,
          subject: subjects.find((s) => s.id === roster.subjectId),
          teacher: teachers.find((t) => t.id === roster.teacherId),
          classroom: classrooms.find((c) => c.id === roster.classroomId),
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        };
      });
      onScheduleChange(scheduleFromRosters);

      setEditingLesson(null);
      setConflict(null);
    } catch (error) {
      console.error('Failed to save lesson:', error);
      toast.error('Failed to save lesson. Please try again.');
    }
  };

  const handleSaveLesson = async (updatedLesson) => {
    const existingConflict = checkForConflict(updatedLesson);
    if (existingConflict) {
      setConflict({ ...existingConflict, lesson: updatedLesson });
      return;
    }
    await proceedWithSave(updatedLesson);
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await rosterAPI.delete_roster(lessonId);
      onScheduleChange((prev) => {
        const newSchedule = { ...prev };
        for (const classId in newSchedule) {
          if (newSchedule[classId][lessonId]) {
            delete newSchedule[classId][lessonId];
            if (Object.keys(newSchedule[classId]).length === 0) {
              delete newSchedule[classId];
            }
            break;
          }
        }
        return newSchedule;
      });
      toast.success('Lesson has been deleted.');
      setEditingLesson(null); // Close the modal
    } catch (error) {
      console.error('Failed to delete lesson', error);
      toast.error('Failed to delete lesson.');
    }
  };

  const handleSelect = (selectionInfo, classId) => {
    const { start, end } = selectionInfo;
    setEditingLesson({
      classId: Number(classId),
      start: start.toISOString(),
      end: end.toISOString(),
    });
  };

  const handleEventClick = (clickInfo) => {
    setEditingLesson(clickInfo.event.extendedProps.lesson);
  };

  const renderEventContent = (eventInfo) => {
    const { lesson } = eventInfo.event.extendedProps;
    if (!lesson) return null;

    const teacherName =
      lesson.teacher && lesson.teacher.first_name
        ? `${lesson.teacher.first_name} ${
            lesson.teacher.last_name || ''
          }`.trim()
        : '';
    const classroomName = lesson.classroom?.name || '';

    return (
      <div className="p-1 overflow-hidden text-xs h-full">
        <div className="font-semibold">{lesson.subject.name}</div>
        {teacherName && <div>{teacherName}</div>}
        {classroomName && <div className="italic">{classroomName}</div>}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Schedule for {format(date, 'eeee, MMMM dd')}</CardTitle>
          <Button onClick={onBack} variant="outline">
            Back to Week View
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id}>
              <h3 className="text-lg font-semibold text-center mb-2">
                {c.name}
              </h3>
              <FullCalendar
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                initialDate={startOfDay(date)}
                headerToolbar={false}
                allDaySlot={false}
                height="70vh"
                selectable
                select={(info) => handleSelect(info, c.id)}
                eventClick={handleEventClick}
                events={eventsForClass(c.id)}
                eventContent={renderEventContent}
                slotMinTime="08:00:00"
                slotMaxTime="18:00:00"
              />
            </div>
          ))}
        </CardContent>
      </Card>
      {editingLesson && (
        <LessonBlockModal
          isOpen={!!editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={handleSaveLesson}
          onDelete={handleDeleteLesson}
          lesson={editingLesson}
          teachers={teachers}
          classrooms={classrooms}
          subjects={subjects}
          students={students}
          classes={classes}
        />
      )}
      {conflict && (
        <AlertDialog open={!!conflict} onOpenChange={() => setConflict(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Scheduling Conflict</AlertDialogTitle>
              <AlertDialogDescription>
                <div>
                  <strong>{conflict.type} Conflict:</strong> {conflict.details}
                </div>
                <div>Do you want to proceed anyway?</div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => proceedWithSave(conflict.lesson)}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
