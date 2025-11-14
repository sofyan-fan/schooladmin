import ComboboxField from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  const [studentSearch, setStudentSearch] = useState('');

  const handleStudentChange = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return allStudents;
    return allStudents.filter((student) => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [studentSearch, allStudents]);

  return (
    <form id="class-form" onSubmit={onSubmit} className="space-y-6 pt-2">
      <div className="space-y-2">
        <Label htmlFor="className">Naam klas</Label>
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
          <ComboboxField
            label="Mentor"
            items={allTeachers.map((t) => ({
              value: String(t.id),
              label: `${t.first_name} ${t.last_name}`,
            }))}
            value={String(formData.mentorId ?? '')}
            onChange={(value) =>
              setFormData({ ...formData, mentorId: Number(value) })
            }
            placeholder="Selecteer een mentor..."
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <ComboboxField
            label="Lespakket"
            items={allCourses.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            value={String(formData.courseId ?? '')}
            onChange={(value) =>
              setFormData({ ...formData, courseId: Number(value) })
            }
            placeholder="Selecteer een lespakket..."
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Studenten</Label>
        <Input
          placeholder="Zoek studenten..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          disabled={loading}
        />
        <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
          {filteredStudents.map((student) => (
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
                  'Toevoegen'
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
