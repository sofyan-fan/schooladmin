import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays,
  Clock,
  GraduationCap,
  MapPin,
  User,
  Users,
} from 'lucide-react';

const dayColors = {
  Monday: 'bg-blue-100 text-blue-800',
  Tuesday: 'bg-green-100 text-green-800',
  Wednesday: 'bg-yellow-100 text-yellow-800',
  Thursday: 'bg-purple-100 text-purple-800',
  Friday: 'bg-pink-100 text-pink-800',
  Saturday: 'bg-indigo-100 text-indigo-800',
  Sunday: 'bg-gray-100 text-gray-800',
};

const dayLabels = {
  Monday: 'Maandag',
  Tuesday: 'Dinsdag',
  Wednesday: 'Woensdag',
  Thursday: 'Donderdag',
  Friday: 'Vrijdag',
  Saturday: 'Zaterdag',
  Sunday: 'Zondag',
};

const ViewRosterModal = ({ open, onOpenChange, roster }) => {
  if (!roster) return null;

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Rooster Details
          </DialogTitle>
          <DialogDescription>
            Bekijk de details van dit rooster item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class and Subject */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Klas
              </div>
              <p className="text-lg font-semibold">
                {roster.class_layout?.name || 'Geen klas'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Vak
              </div>
              <p className="text-lg font-semibold">
                {roster.subject?.name || 'Geen vak'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Teacher and Classroom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Docent
              </div>
              <p className="text-lg font-semibold">
                {roster.teacher
                  ? `${roster.teacher.first_name} ${roster.teacher.last_name}`
                  : 'Geen docent'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Lokaal
              </div>
              <p className="text-lg font-semibold">
                {roster.classroom?.name || 'Geen lokaal'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Planning
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant="secondary"
                className={`${
                  dayColors[roster.day_of_week] || 'bg-gray-100 text-gray-800'
                } text-sm px-3 py-1`}
              >
                {dayLabels[roster.day_of_week] || roster.day_of_week}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-semibold">
                  {formatTime(roster.start_time)}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className="text-lg font-mono font-semibold">
                  {formatTime(roster.end_time)}
                </span>
              </div>
            </div>

            {/* Duration calculation */}
            {roster.start_time && roster.end_time && (
              <div className="text-sm text-muted-foreground">
                Duur:{' '}
                {(() => {
                  const [startHour, startMin] = roster.start_time
                    .split(':')
                    .map(Number);
                  const [endHour, endMin] = roster.end_time
                    .split(':')
                    .map(Number);
                  const startMinutes = startHour * 60 + startMin;
                  const endMinutes = endHour * 60 + endMin;
                  const duration = endMinutes - startMinutes;
                  const hours = Math.floor(duration / 60);
                  const minutes = duration % 60;

                  if (hours > 0 && minutes > 0) {
                    return `${hours} uur ${minutes} minuten`;
                  } else if (hours > 0) {
                    return `${hours} uur`;
                  } else {
                    return `${minutes} minuten`;
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewRosterModal;
