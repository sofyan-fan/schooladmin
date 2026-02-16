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

const initialState = {
  name: '',
  mentorId: null,
  courseId: null,
  studentIds: [],
};

export default function CreateClassModal({
  open,
  onOpenChange,
  onSave,
  ...props
}) {
  const [formData, setFormData] = useState(initialState);
  const [allTeachers, setAllTeachers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mentor warning dialog state
  const [mentorWarningOpen, setMentorWarningOpen] = useState(false);
  const [mentorWarningMessage, setMentorWarningMessage] = useState('');

  useEffect(() => {
    if (open) {
      setFormData(initialState);
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
          const unassignedStudents = studentData.filter(
            (student) => !student.class_id
          );
          setAllStudents(unassignedStudents);
        } catch (err) {
          setError(
            err.message || 'Failed to load data for the form. Please try again.'
          );
        }
      };
      fetchModalData();
    }
  }, [open]);

  const checkMentorAndSubmit = async () => {
    const formElement = document.getElementById('class-form');
    if (formElement && !formElement.reportValidity()) {
      return;
    }

    const mentorId = formData.mentorId;

    // If no mentor selected, proceed directly
    if (!mentorId) {
      await executeSubmit();
      return;
    }

    // Check if the mentor is already assigned to another class
    try {
      const conflictClass = await classAPI.check_mentor_conflict(mentorId);
      if (conflictClass) {
        const mentor = allTeachers.find((t) => t.id === mentorId);
        const mentorName = mentor
          ? `${mentor.first_name} ${mentor.last_name}`
          : 'Deze mentor';
        setMentorWarningMessage(
          `${mentorName} is momenteel mentor van klas "${conflictClass.name}". Als je doorgaat, wordt deze mentor daar verwijderd.`
        );
        setMentorWarningOpen(true);
        return;
      }
    } catch (err) {
      console.error('Error checking mentor conflict:', err);
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
      setError(err.message || 'Failed to create class. Please try again.');
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
            <DialogTitle>Nieuwe Klas Toevoegen</DialogTitle>
            <DialogDescription>
              Maak een nieuwe klas aan door een naam op te geven en een mentor,
              lespakket en studenten te selecteren.
            </DialogDescription>
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
              {loading ? 'Aanmaken...' : 'Klas Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mentorWarningOpen} onOpenChange={setMentorWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mentor Toewijzen</AlertDialogTitle>
            <AlertDialogDescription>
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
