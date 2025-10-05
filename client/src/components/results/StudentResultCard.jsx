import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Check, GraduationCap } from 'lucide-react';

const StudentResultCard = ({ result, onClick }) => {
  const getGradeColor = (grade) => {
    if (grade >= 8) return 'bg-green-100 text-green-800';
    if (grade >= 6.5) return 'bg-blue-100 text-blue-800';
    if (grade >= 5.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={`https://api.dicebear.com/8.x/initials/svg?seed=${result.student.first_name} ${result.student.last_name}`}
              />
              <AvatarFallback>
                {result.student.first_name[0]}
                {result.student.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {result.student.first_name} {result.student.last_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <GraduationCap className="h-4 w-4" />
                {result.student.class_layout?.name || 'Unknown Class'}
              </p>
            </div>
          </div>
          <Badge
            className={`${getGradeColor(
              result.grade
            )} flex items-center gap-1 text-lg`}
          >
            {result.grade >= 8 && <Check className="h-4 w-4" />}
            {result.grade.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">
            {result.assessment_name || 'Unknown Assessment'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentResultCard;
