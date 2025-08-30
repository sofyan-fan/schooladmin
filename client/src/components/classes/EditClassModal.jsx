import courseApi from '@/apis/courseAPI';
import studentAPI from '@/apis/studentAPI';
import teachersAPI from '@/apis/teachersAPI';
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
          setAllStudents(studentData);
        } catch (err) {
          setError(
            err.message || 'Failed to load data for the form. Please try again.'
          );
        }
      };
      fetchModalData();
    }
  }, [open, classData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // event.stopPropagation();
    const formElement = document.getElementById('class-form');
    if (formElement && !formElement.reportValidity()) {
      return;
    }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
          <DialogDescription>Update the class details below.</DialogDescription>
        </DialogHeader>
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
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
