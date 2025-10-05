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

  return (
    <form id="class-form" onSubmit={onSubmit} className="space-y-6 pt-2">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mentor">Mentor</Label>
          <Select
            value={String(formData.mentorId)}
            onValueChange={(value) =>
              setFormData({ ...formData, mentorId: Number(value) })
            }
            disabled={loading}
          >
            <SelectTrigger id="mentor">
              <SelectValue placeholder="Select a mentor..." />
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
          <Label htmlFor="course">Course</Label>
          <Select
            value={String(formData.courseId)}
            onValueChange={(value) =>
              setFormData({ ...formData, courseId: Number(value) })
            }
            disabled={loading}
          >
            <SelectTrigger id="course">
              <SelectValue placeholder="Select a course..." />
            </SelectTrigger>
            <SelectContent>
              {allCourses.map((course) => (
                <SelectItem key={course.id} value={String(course.id)}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
