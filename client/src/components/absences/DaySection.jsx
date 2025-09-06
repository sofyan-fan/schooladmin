import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import LessonCard from './LessonCard';

const DaySection = ({ day, dayRosters, onLessonClick, getTeacherName }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {day}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dayRosters.map((roster) => (
            <LessonCard
              key={roster.id}
              roster={roster}
              onLessonClick={onLessonClick}
              getTeacherName={getTeacherName}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DaySection;
