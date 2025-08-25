import DailySchedule from '@/components/rosters/DailySchedule';
import WeekView from '@/components/rosters/WeekView';
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';

export default function RostersPage() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [schedule, setSchedule] = useState({});

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Roosters"
        icon={<CalendarDays className="size-9" />}
        description="Plan lessen interactief in de kalender."
      />
      {selectedDate ? (
        <DailySchedule
          date={selectedDate}
          onBack={() => setSelectedDate(null)}
          schedule={schedule}
          onScheduleChange={setSchedule}
        />
      ) : (
        <WeekView onDaySelect={setSelectedDate} />
      )}
    </div>
  );
}
