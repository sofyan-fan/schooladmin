import StudentIconSelected from '@/assets/user_icons/role_icons/student/selected.svg?react';
import StudentIcon from '@/assets/user_icons/role_icons/student/unselected.svg?react';
import TeacherIconSelected from '@/assets/user_icons/role_icons/teacher/selected.svg?react';
import TeacherIcon from '@/assets/user_icons/role_icons/teacher/unselected.svg?react';
import PropTypes from 'prop-types';
import { Presentation, GraduationCap } from 'lucide-react';

function RoleIcon({ role, label, selected, onClick }) {
  const Icon =
    role === 'student'
      ? selected
        ? StudentIconSelected
        : StudentIcon
      : selected
      ? TeacherIconSelected
      : TeacherIcon;
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-input hover:border-primary/50'
      }`}
    >
      <Icon className="size-20" />
      <span
        className={`font-medium text-sm ${
          selected ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

RoleIcon.propTypes = {
  role: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default RoleIcon;
