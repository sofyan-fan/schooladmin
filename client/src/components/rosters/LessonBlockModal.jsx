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
  onDelete,
  lesson,
  teachers,
  classrooms,
  subjects,
}) {
  const [subjectId, setSubjectId] = useState(
    lesson.subject?.id?.toString() || ''
  );
  const [teacherId, setTeacherId] = useState(
    lesson.teacher?.id?.toString() || ''
  );
  const [classroomId, setClassroomId] = useState(
    lesson.classroom?.id?.toString() || ''
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setSubjectId(lesson.subject?.id?.toString() || '');
    setTeacherId(lesson.teacher?.id?.toString() || '');
    setClassroomId(lesson.classroom?.id?.toString() || '');
  }, [lesson]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!subjectId || !teacherId || !classroomId) {
      alert('Please select a subject, teacher, and classroom');
      return;
    }

    const subject = subjects.find((s) => s.id.toString() === subjectId);
    const teacher = teachers.find((t) => t.id.toString() === teacherId);
    const classroom = classrooms.find((c) => c.id.toString() === classroomId);

    if (!subject || !teacher || !classroom) {
      alert('Invalid selection. Please try again.');
      return;
    }

    onSave({
      ...lesson,
      subject,
      teacher,
      classroom,
    });
    onClose();
  };

  const isNew = !lesson.id;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'Create Lesson' : `Edit Lesson: ${lesson.subject?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={subjectId}
                onValueChange={setSubjectId}
                className="w-full"
              >
                <SelectTrigger id="subject" className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 ">
              <Label htmlFor="teacher">Teacher</Label>
              <Select
                value={teacherId}
                onValueChange={setTeacherId}
                className="w-full"
              >
                <SelectTrigger id="teacher" className="w-full">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.first_name} {t.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classroom">Classroom</Label>
              <Select
                value={classroomId}
                onValueChange={setClassroomId}
                className="w-full"
              >
                <SelectTrigger id="classroom" className="w-full">
                  <SelectValue placeholder="Select a classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {!isNew && (
              <Button
                onClick={() => setIsConfirmOpen(true)}
                variant="destructive"
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!subjectId || !teacherId || !classroomId}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lesson.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(lesson.id)}>
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
