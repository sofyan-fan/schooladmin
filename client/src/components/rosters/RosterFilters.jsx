import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

const RosterFilters = ({
  classes,
  teachers,
  classrooms,
  filters,
  onFiltersChange,
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

  return (
    <Card className="bg-transparent shadow-none border-none rounded-b-none  pt-0">
      <CardContent className="px-0">
        <div className="flex flex-wrap gap-4 items-center">
          <Select onValueChange={handleClassChange} value="">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter op klas" />
            </SelectTrigger>
            <SelectContent>
              {classes
                .filter((cls) => cls.id != null)
                .map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleTeacherChange} value="">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter op docent" />
            </SelectTrigger>
            <SelectContent>
              {teachers
                .filter((teacher) => teacher.id != null)
                .map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleClassroomChange} value="">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter op lokaal" />
            </SelectTrigger>
            <SelectContent>
              {classrooms
                .filter((classroom) => classroom.id != null)
                .map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id.toString()}>
                    {classroom.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Filters wissen
            </Button>
          )}
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
