// import subjectAPI from '@/apis/subjects/subjectAPI';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

export default function LessonBlockModal({
  isOpen,
  onClose,
  onSave,
  lesson,
  teachers,
  classrooms,
  subjects,
}) {
  const [subjectId, setSubjectId] = useState(lesson.subject?.id || '');
  const [teacherId, setTeacherId] = useState(lesson.teacher?.id || '');
  const [classroomId, setClassroomId] = useState(lesson.classroom?.id || '');

  useEffect(() => {
    setSubjectId(lesson.subject?.id || '');
    setTeacherId(lesson.teacher?.id || '');
    setClassroomId(lesson.classroom?.id || '');
  }, [lesson]);

  if (!isOpen) return null;

  const handleSave = () => {
    const subject = subjects.find((s) => s.id === subjectId);

    onSave({
      ...lesson,
      subject,
      teacher: teachers.find((t) => t.id === teacherId),
      classroom: classrooms.find((c) => c.id === classroomId),
    });
    onClose();
  };

  const isNew = !lesson.subject;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Create Lesson' : `Edit Lesson: ${lesson.subject.name}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              onValueChange={setSubjectId}
              defaultValue={subjectId}
              disabled={!isNew}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher</Label>
            <Select onValueChange={setTeacherId} defaultValue={teacherId}>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="classroom">Classroom</Label>
            <Select onValueChange={setClassroomId} defaultValue={classroomId}>
              <SelectTrigger id="classroom">
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!subjectId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
