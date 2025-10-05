import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { LayoutGrid, Users } from 'lucide-react';

const ViewToggle = ({ view, onViewChange }) => {
  const activeClasses =
    'bg-green-600 text-white shadow-none data-[state=on]:!text-white hover:bg-green-700 cursor-pointer';
  const inactiveClasses = 'hover:bg-muted cursor-pointer';

  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={onViewChange}
      variant="outline"
      className=" p-1 shadow-none data-[variant=outline]:shadow-none"
    >
      <ToggleGroupItem
        value="assessments"
        aria-label="Assessments view"
        className={cn(
          'px-4 ',
          view === 'assessments' ? activeClasses : inactiveClasses
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Toetsen</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="students"
        aria-label="Students view"
        className={cn(
          'px-4 ',
          view === 'students' ? activeClasses : inactiveClasses
        )}
      >
        <Users className="h-4 w-4" />
        <span className="ml-2 hidden sm:inline">Students</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ViewToggle;
