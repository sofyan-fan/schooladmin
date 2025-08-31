import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { BookOpen, Calendar, Trophy, User } from 'lucide-react';

const ResultCard = ({ result }) => {
  const getGradeColor = (grade) => {
    if (grade >= 8)
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (grade >= 6.5)
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (grade >= 5.5)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getGradeIcon = (grade) => {
    if (grade >= 6.5) return <Trophy className="h-4 w-4" />;
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            {result.student.first_name} {result.student.last_name}
          </CardTitle>
          <Badge
            className={`${getGradeColor(result.grade)} flex items-center gap-1`}
          >
            {getGradeIcon(result.grade)}
            {result.grade.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">
              {result.subject?.name || 'Onbekend vak'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(result.date), 'PPP', { locale: nl })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;
