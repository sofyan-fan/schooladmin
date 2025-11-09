import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ComboboxField from '@/components/ui/combobox';
import { X } from 'lucide-react';
import { useState } from 'react';

const RosterFilters = ({
  classes,
  teachers,
  classrooms,
  filters,
  onFiltersChange,
  rightAction,
}) => {
  const handleClassChange = (value) => {
    if (value && !filters.classIds.includes(parseInt(value))) {
      onFiltersChange({
        ...filters,
        classIds: [...filters.classIds, parseInt(value)],
      });
    }
  };

  const handleTeacherChange = (value) => {
    if (value && !filters.teacherIds.includes(parseInt(value))) {
      onFiltersChange({
        ...filters,
        teacherIds: [...filters.teacherIds, parseInt(value)],
      });
    }
  };

  const handleClassroomChange = (value) => {
    if (value && !filters.classroomIds.includes(parseInt(value))) {
      onFiltersChange({
        ...filters,
        classroomIds: [...filters.classroomIds, parseInt(value)],
      });
    }
  };

  const removeFilter = (type, id) => {
    onFiltersChange({
      ...filters,
      [type]: filters[type].filter((item) => item !== id),
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      classIds: [],
      teacherIds: [],
      classroomIds: [],
    });
  };

  const hasFilters =
    filters.classIds.length > 0 ||
    filters.teacherIds.length > 0 ||
    filters.classroomIds.length > 0;

  // Local state to reset combobox after applying filter
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');

  return (
    <Card className="bg-transparent shadow-none border-none rounded-b-none  pt-0">
      <CardContent className="px-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 items-center">
            <ComboboxField
              className="w-[200px]"
              placeholder="Filter op klas"
              value={selectedClassId}
              onChange={(val) => {
                handleClassChange(val);
                setSelectedClassId('');
              }}
              items={(classes ?? [])
                .filter((cls) => cls?.id != null)
                .map((cls) => ({ value: String(cls.id), label: cls.name }))}
            />

            <ComboboxField
              className="w-[200px]"
              placeholder="Filter op docent"
              value={selectedTeacherId}
              onChange={(val) => {
                handleTeacherChange(val);
                setSelectedTeacherId('');
              }}
              items={(teachers ?? [])
                .filter((t) => t?.id != null)
                .map((t) => ({
                  value: String(t.id),
                  label: `${t.first_name} ${t.last_name}`,
                }))}
            />

            <ComboboxField
              className="w-[200px]"
              placeholder="Filter op lokaal"
              value={selectedClassroomId}
              onChange={(val) => {
                handleClassroomChange(val);
                setSelectedClassroomId('');
              }}
              items={(classrooms ?? [])
                .filter((r) => r?.id != null)
                .map((r) => ({ value: String(r.id), label: r.name }))}
            />

            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Filters wissen
              </Button>
            )}
          </div>
          {rightAction ? <div className="ml-auto">{rightAction}</div> : null}
        </div>

        {/* Active filters display */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.classIds.map((id) => {
              const cls = classes.find((c) => c.id === id);
              return (
                <div
                  key={`class-${id}`}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm"
                >
                  <span>Klas: {cls?.name}</span>
                  <button
                    onClick={() => removeFilter('classIds', id)}
                    className="hover:bg-green-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {filters.teacherIds.map((id) => {
              const teacher = teachers.find((t) => t.id === id);
              return (
                <div
                  key={`teacher-${id}`}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                >
                  <span>
                    Docent: {teacher?.first_name} {teacher?.last_name}
                  </span>
                  <button
                    onClick={() => removeFilter('teacherIds', id)}
                    className="hover:bg-blue-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            {filters.classroomIds.map((id) => {
              const classroom = classrooms.find((c) => c.id === id);
              return (
                <div
                  key={`classroom-${id}`}
                  className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm"
                >
                  <span>Lokaal: {classroom?.name}</span>
                  <button
                    onClick={() => removeFilter('classroomIds', id)}
                    className="hover:bg-purple-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RosterFilters;
