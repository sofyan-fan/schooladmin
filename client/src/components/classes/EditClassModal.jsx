import classAPI from '@/apis/classAPI';
import courseApi from '@/apis/courseAPI';
import studentAPI from '@/apis/studentAPI';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import ClassForm from './ClassForm';

export default function EditClassModal({
  open,
  onOpenChange,
  onSave,
  classData,
}) {
  const [formData, setFormData] = useState({
    name: '',
    mentorId: null,
    courseId: null,
    studentIds: [],
  });
  const [allTeachers, setAllTeachers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mentor warning dialog state
  const [mentorWarningOpen, setMentorWarningOpen] = useState(false);
  const [mentorWarningMessage, setMentorWarningMessage] = useState('');

  useEffect(() => {
    if (open && classData) {
      setFormData({
        id: classData.id,
        name: classData.name,
        mentorId: classData.mentorId,
        courseId: classData.courseId,
        studentIds: (classData.students || []).map((s) => s.id),
      });
      setError('');

      const fetchModalData = async () => {
        try {
          const [teacherData, courseData, studentData] = await Promise.all([
            teachersAPI.get_teachers(),
            courseApi.get_courses(),
            studentAPI.get_students(),
          ]);
          setAllTeachers(teacherData);
          setAllCourses(courseData);

          // Filter to show: unassigned students + students currently in this class
          const currentClassStudentIds = (classData.students || []).map(
            (s) => s.id
          );
          const availableStudents = studentData.filter(
            (student) =>
              !student.class_id || // Unassigned students
              student.class_id === classData.id // Students currently in this class
          );
          setAllStudents(availableStudents);
        } catch (err) {
          setError(
            err.message || 'Failed to load data for the form. Please try again.'
          );
        }
      };
      fetchModalData();
    }
  }, [open, classData]);

  const checkMentorAndSubmit = async () => {
    const formElement = document.getElementById('class-form');
    if (formElement && !formElement.reportValidity()) {
      return;
    }

    // Check if mentor is being changed
    const originalMentorId = classData?.mentorId;
    const newMentorId = formData.mentorId;
    
    // If no mentor selected, proceed directly
    if (!newMentorId) {
      await executeSubmit();
      return;
    }

    // Build warning messages
    const warnings = [];
    
    // Check if we're replacing an existing mentor
    if (originalMentorId && originalMentorId !== newMentorId) {
      const originalMentor = allTeachers.find((t) => t.id === originalMentorId);
      const originalMentorName = originalMentor
        ? `${originalMentor.first_name} ${originalMentor.last_name}`
        : 'de huidige mentor';
      warnings.push(`Je vervangt ${originalMentorName} als mentor van deze klas.`);
    }

    // Check if the new mentor is already assigned to another class
    try {
      const conflictClass = await classAPI.check_mentor_conflict(newMentorId, classData?.id);
      if (conflictClass) {
        const newMentor = allTeachers.find((t) => t.id === newMentorId);
        const newMentorName = newMentor
          ? `${newMentor.first_name} ${newMentor.last_name}`
          : 'Deze mentor';
        warnings.push(
          `${newMentorName} is momenteel mentor van klas "${conflictClass.name}". Als je doorgaat, wordt deze mentor daar verwijderd.`
        );
      }
    } catch (err) {
      console.error('Error checking mentor conflict:', err);
    }

    // If there are warnings, show the dialog
    if (warnings.length > 0) {
      setMentorWarningMessage(warnings.join('\n\n'));
      setMentorWarningOpen(true);
      return;
    }

    // No warnings, proceed with submit
    await executeSubmit();
  };

  const executeSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to update class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await checkMentorAndSubmit();
  };

  const handleMentorWarningConfirm = async () => {
    setMentorWarningOpen(false);
    await executeSubmit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl min-h-[60vh] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Klas Bewerken</DialogTitle>
            <DialogDescription>Werk hieronder de klasgegevens bij.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <ClassForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              loading={loading}
              allTeachers={allTeachers}
              allCourses={allCourses}
              allStudents={allStudents}
            />
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Bijwerken...' : 'Klas Bijwerken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mentorWarningOpen} onOpenChange={setMentorWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mentor Wijzigen</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {mentorWarningMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleMentorWarningConfirm}>
              Doorgaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
