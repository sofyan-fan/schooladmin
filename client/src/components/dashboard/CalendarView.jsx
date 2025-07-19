import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import React from 'react';

const Lessons = ({ lessons }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2 text-text-default">
      Lessen voor vandaag
    </h3>
    <div className="space-y-4">
      {lessons.map((lesson, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-text-default">{lesson.title}</p>
            <p className="text-sm text-text-muted">{lesson.time}</p>
            <p className="text-sm text-text-muted">
              {lesson.teacher} - {lesson.group}
            </p>
            <p className="text-sm text-text-muted">{lesson.classroom}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const CalendarView = ({ lessons }) => {
  const [date, setDate] = React.useState(new Date());

  return (
    <div className="space-y-6">
      <Card className="p-4 rounded-lg shadow-md bg-white flex justify-center">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </Card>
      <Card className="p-4 rounded-lg shadow-md bg-white">
        {/* <CardHeader>
          <CardTitle>Lessen</CardTitle>
          <CardDescription>Overzicht van de lessen</CardDescription>
        </CardHeader> */}
        <CardContent>
          <Lessons lessons={lessons} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
