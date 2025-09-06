import { absenceAPI } from '@/apis/timeregisterAPI';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, UserCheck, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function LessonBlockModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  lesson,
  teachers,
  classrooms,
  subjects,
  students,
  classes,
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
  const [classId, setClassId] = useState(
    lesson.class_layout?.id?.toString() || ''
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Absence-related state
  const [absences, setAbsences] = useState([]);
  const [studentAbsences, setStudentAbsences] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date()); // Assuming you might want a date picker later

  useEffect(() => {
    if (lesson?.id) {
      fetchAbsences();
    }
  }, [lesson]);

  useEffect(() => {
    if (lesson && students) {
      initializeStudentAbsences();
    }
  }, [lesson, students, absences, selectedDate]);

  const fetchAbsences = async () => {
    try {
      const absenceData = await absenceAPI.getAllAbsences();
      setAbsences(absenceData || []);
    } catch (error) {
      toast.error('Failed to load absence data.');
    }
  };

  const getStudentsForClass = () => {
    // Use the selected classId from the form, or fall back to lesson data
    const selectedClassId =
      classId || lesson?.class_layout?.id || lesson?.class_id;

    if (!selectedClassId || !students) {
      return [];
    }

    const filteredStudents = students.filter(
      (student) => student.class_id === parseInt(selectedClassId)
    );

    return filteredStudents;
  };

  const initializeStudentAbsences = () => {
    const classStudents = getStudentsForClass();
    const initialStates = {};

    classStudents.forEach((student) => {
      const existingAbsence = absences.find(
        (a) =>
          a.user_id === student.id &&
          a.roster_id === lesson.id &&
          new Date(a.date).toDateString() === selectedDate.toDateString()
      );

      let status = 'present';
      if (existingAbsence) {
        status = existingAbsence.reason === 'Te Laat' ? 'late' : 'absent';
      }

      initialStates[student.id] = {
        status,
        reason: existingAbsence?.reason || '',
        absenceId: existingAbsence?.id || null,
      };
    });

    setStudentAbsences(initialStates);
  };

  const handleStatusChangeAndSave = async (studentId, newStatus) => {
    if (!newStatus) return;

    const originalStudentAbsences = JSON.parse(JSON.stringify(studentAbsences));
    const studentName =
      students.find((s) => s.id === studentId)?.first_name || 'Student';

    setStudentAbsences((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
      },
    }));

    const studentState = originalStudentAbsences[studentId] || {};

    try {
      if (newStatus === 'present') {
        if (studentState.absenceId) {
          await absenceAPI.deleteAbsence(studentState.absenceId);
          toast.success(`${studentName} is marked as present.`);
        }
      } else {
        const reason = newStatus === 'late' ? 'Te Laat' : 'Afwezig';
        const absenceData = {
          user_id: studentId,
          role: 'student',
          roster_id: lesson.id,
          date: selectedDate.toISOString(),
          reason,
        };

        if (studentState.absenceId) {
          await absenceAPI.updateAbsence(studentState.absenceId, absenceData);
          toast.success(`Status for ${studentName} updated to: ${reason}`);
        } else {
          const response = await absenceAPI.createAbsence(absenceData);
          toast.success(`Status for ${studentName} set to: ${reason}`);
          setStudentAbsences((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], absenceId: response.id },
          }));
        }
      }
      fetchAbsences();
    } catch (error) {
      toast.error(`Failed to update status for ${studentName}.`);
      setStudentAbsences(originalStudentAbsences);
    }
  };

  useEffect(() => {
    setSubjectId(lesson.subject?.id?.toString() || '');
    setTeacherId(lesson.teacher?.id?.toString() || '');
    setClassroomId(lesson.classroom?.id?.toString() || '');
    setClassId(lesson.class_layout?.id?.toString() || '');
  }, [lesson]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!subjectId || !teacherId || !classroomId || !classId) {
      alert('Please select a subject, teacher, classroom and class');
      return;
    }

    const subject = subjects.find((s) => s.id.toString() === subjectId);
    const teacher = teachers.find((t) => t.id.toString() === teacherId);
    const classroom = classrooms.find((c) => c.id.toString() === classroomId);
    const classLayout = classes.find((c) => c.id.toString() === classId);

    if (!subject || !teacher || !classroom || !classLayout) {
      alert('Invalid selection. Please try again.');
      return;
    }

    onSave({
      ...lesson,
      subject,
      teacher,
      classroom,
      class_layout: classLayout,
    });
    onClose();
  };

  const isNew = !lesson.id;
  const classStudents = getStudentsForClass();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isNew ? 'Create Lesson' : `Edit Lesson: ${lesson.subject?.name}`}
            </DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="absences" disabled={isNew}>
                Aanwezigheid
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details">
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
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={classId}
                    onValueChange={setClassId}
                    className="w-full"
                  >
                    <SelectTrigger id="class" className="w-full">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
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
                  disabled={
                    !subjectId || !teacherId || !classroomId || !classId
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="absences">
              {!classId ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecteer eerst een klas in de "Details" tab</p>
                  <p className="text-sm">
                    Je moet een klas kiezen voordat je afwezigheid kunt beheren.
                  </p>
                </div>
              ) : classStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Geen studenten in deze klas.</p>
                  <p className="text-sm">
                    Controleer of er studenten zijn toegewezen aan deze klas.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.map((student) => {
                      const studentState = studentAbsences[student.id] || {
                        status: 'present',
                      };
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <div className="flex gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={
                                        studentState.status === 'present'
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size="icon"
                                      className={`
                                    ${
                                      studentState.status === 'present'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : ''
                                    }
                                  `}
                                      onClick={() =>
                                        handleStatusChangeAndSave(
                                          student.id,
                                          'present'
                                        )
                                      }
                                    >
                                      <UserCheck className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Aanwezig</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={
                                        studentState.status === 'late'
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size="icon"
                                      className={`
                                    ${
                                      studentState.status === 'late'
                                        ? 'bg-orange-500 hover:bg-orange-600'
                                        : ''
                                    }
                                  `}
                                      onClick={() =>
                                        handleStatusChangeAndSave(
                                          student.id,
                                          'late'
                                        )
                                      }
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Te Laat</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant={
                                        studentState.status === 'absent'
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size="icon"
                                      className={`
                                    ${
                                      studentState.status === 'absent'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : ''
                                    }
                                  `}
                                      onClick={() =>
                                        handleStatusChangeAndSave(
                                          student.id,
                                          'absent'
                                        )
                                      }
                                    >
                                      <UserX className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Afwezig</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
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
