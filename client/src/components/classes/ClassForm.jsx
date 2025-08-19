import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

export default function ClassForm({
  formData,
  setFormData,
  allTeachers,
  allCourses,
  allStudents,
  onSubmit,
  loading,
}) {
  const handleStudentChange = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleCourseChange = (courseId) => {
    setFormData((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 pt-2">
      <div className="space-y-2">
        <Label htmlFor="className">Class Name</Label>
        <Input
          id="className"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          autoFocus
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teacher">Teacher</Label>
        <Select
          value={String(formData.teacherId)}
          onValueChange={(value) =>
            setFormData({ ...formData, teacherId: Number(value) })
          }
          disabled={loading}
        >
          <SelectTrigger id="teacher">
            <SelectValue placeholder="Select a teacher..." />
          </SelectTrigger>
          <SelectContent>
            {allTeachers.map((teacher) => (
              <SelectItem key={teacher.id} value={String(teacher.id)}>
                {`${teacher.first_name} ${teacher.last_name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Courses</Label>
        <div className="flex flex-wrap gap-2">
          {allCourses.map((course) => (
            <Button
              key={course.id}
              type="button"
              variant={
                formData.courseIds.includes(course.id) ? 'default' : 'outline'
              }
              onClick={() => handleCourseChange(course.id)}
            >
              {course.name}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Students</Label>
        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
          {allStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between">
              <span>{`${student.first_name} ${student.last_name}`}</span>
              <Button
                type="button"
                size="sm"
                variant={
                  formData.studentIds.includes(student.id)
                    ? 'destructive'
                    : 'outline'
                }
                onClick={() => handleStudentChange(student.id)}
              >
                {formData.studentIds.includes(student.id) ? (
                  <Trash2 className="h-4 w-4" />
                ) : (
                  'Add'
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
