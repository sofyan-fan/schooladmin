import classAPI from '@/apis/classes/classAPI';
import classroomAPI from '@/apis/classrooms/classroomAPI';
import courseAPI from '@/apis/courses/courseAPI';
import subjectAPI from '@/apis/subjects/subjectAPI';
import teachersAPI from '@/apis/teachers/teachersAPI';
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
        const [classesData, teachersData, classroomsData, subjectsData] =
          await Promise.all([
            classAPI.get_classes(),
            teachersAPI.get_teachers(),
            classroomAPI.getClassrooms(),
            subjectAPI.get_subjects(),
          ]);

        const populatedClasses = await Promise.all(
          (classesData || []).map(async (c) => {
            if (c.course_id) {
              const course = await courseAPI.get_course_by_id(c.course_id);
              return { ...c, subjects: course?.subjects || [] };
            }
            return { ...c, subjects: [] };
          })
        );
        setClasses(populatedClasses);
        setTeachers(teachersData || []);
        setClassrooms(classroomsData || []);
        setSubjects(subjectsData || []);
      } catch (error) {
        console.error('Failed to fetch schedule data', error);
      }
    }
    fetchData();
  }, []);

  const eventsForClass = (classId) => {
    const classSchedule = schedule[classId] || {};
    return Object.values(classSchedule)
      .filter((lesson) => lesson && lesson.subject)
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.subject.name,
        start: lesson.start,
        end: lesson.end,
        extendedProps: { lesson },
      }));
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

  const handleSaveLesson = (updatedLesson) => {
    const lessonId =
      updatedLesson.id || `${updatedLesson.classId}-${updatedLesson.start}`;
    const newLessonData = { ...updatedLesson, id: lessonId };

    const conflict = checkForConflict(newLessonData);

    if (conflict) {
      setConflict({ ...conflict, lesson: newLessonData });
    } else {
      saveLesson(newLessonData);
    }
    setEditingLesson(null);
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
          lesson={editingLesson}
          teachers={teachers}
          classrooms={classrooms}
          subjects={subjects}
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
              <AlertDialogAction onClick={() => saveLesson(conflict.lesson)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
