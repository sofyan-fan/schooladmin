import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, Presentation, Users } from 'lucide-react';

const LessonCard = ({ roster, onLessonClick, getTeacherName }) => {
  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
      onClick={() => onLessonClick(roster)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg">
              {roster.subject?.name || 'Onbekend Vak'}
            </h3>
            <Badge variant="outline">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(roster.start_time)} - {formatTime(roster.end_time)}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {roster.classroom?.name || 'Geen lokaal'}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Presentation className="w-4 h-4" />
            Docent: {getTeacherName(roster.teacher_id)}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            Klas: {roster.class_layout?.name || 'Geen klas'}
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">
                Klik om afwezigheid te beheren
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;
