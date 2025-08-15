// import StudentIconSelected from '@/assets/user_icons/role_icons/student/selected.svg?react';
import StudentIcon from '@/assets/user_icons/role_icons/student/student.svg?react';
// import TeacherIconSelected from '@/assets/user_icons/role_icons/teacher/selected.svg?react';
import TeacherIcon from '@/assets/user_icons/role_icons/teacher/teacher.svg?react';
import PropTypes from 'prop-types';
// import { Presentation, GraduationCap } from 'lucide-react';

function RoleIcon({ role, label, selected, onClick }) {
  const Icon = role === 'student' ? StudentIcon : TeacherIcon;
  const iconColor = selected ? 'text-primary' : 'text-muted-foreground';

  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'
      }`}
    >
      <Icon className={`size-20 ${iconColor} [&_*]:fill-current [&_*]:stroke-current`} />
      <span className={`font-medium text-lg ${iconColor}`}>{label}</span>
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
