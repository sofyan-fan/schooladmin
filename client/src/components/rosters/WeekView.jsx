import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns';

export default function WeekView({ onDaySelect }) {
  const today = new Date();
  const weekDays = eachDayOfInterval({
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kies een dag</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <Button
            key={day.toString()}
            onClick={() => onDaySelect(day)}
            variant="outline"
            className="p-4 flex flex-col items-center justify-center h-24"
          >
            <span className="text-lg font-bold">{format(day, 'eeee')}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
