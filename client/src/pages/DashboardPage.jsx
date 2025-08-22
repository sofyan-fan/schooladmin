import { UserCheck, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import CalendarView from '../components/dashboard/CalendarView';
import Members from '../components/dashboard/Members';
import StatCard from '../components/dashboard/StatCard';
import YearPlanning from '../components/dashboard/YearPlanning';

import eventAPI from '../apis/dashboard/eventAPI';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [jaarplanning, setJaarplanning] = useState([]);
  const [members, setMembers] = useState({
    studenten: [],
    leraren: [],
    personeel: [],
  });
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await eventAPI.get_events();
        setJaarplanning(events);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();

    const dummyStats = {
      totalStudents: 150,
      studentsPresent: 140,
      teachersPresent: 20,
    };

    const dummyMembers = {
      studenten: [
        { id: 's1', name: 'Alice', avatar: '/avatars/s1.png' },
        { id: 's2', name: 'Bob', avatar: '/avatars/s2.png' },
      ],
      leraren: [
        { id: 't1', name: 'Mr. Smith', avatar: '/avatars/t1.png' },
        { id: 't2', name: 'Ms. Jones', avatar: 'avatars/t2.png' },
      ],
      personeel: [
        { id: 'p1', name: 'Carol', avatar: '/avatars/p1.png' },
        { id: 'p2', name: 'Dave', avatar: '/avatars/p2.png' },
      ],
    };

    const dummyLessons = [
      {
        id: 1,
        time: '10:00',
        subject: 'Wiskunde',
        teacher: 'Mr. Smith',
        room: '101',
      },
      {
        id: 2,
        time: '11:00',
        subject: 'Geschiedenis',
        teacher: 'Ms. Jones',
        room: '102',
      },
    ];

    setStats(dummyStats);
    setMembers(dummyMembers);
    setLessons(dummyLessons);
  }, []);

  if (!stats) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title=" Studenten"
          value={stats.totalStudents}
          icon={<Users className="size-12 text-muted-foreground" />}
        />
        <StatCard
          title="Aanwezig"
          value={stats.studentsPresent}
          icon={<UserCheck className="size-12 text-muted-foreground" />}
        />
        <StatCard
          title="Leraren"
          value={stats.teachersPresent}
          icon={<UserCheck className="size-12 text-muted-foreground" />}
        />
        <StatCard
          title="Afwezig"
          value={stats.totalStudents - stats.studentsPresent}
          icon={<UserX className="size-12 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <YearPlanning items={jaarplanning} setItems={setJaarplanning} />
          <Members members={members} />
        </div>
        <div className="space-y-6">
          <CalendarView lessons={lessons} />
        </div>
      </div>
      </>
  );
};

export default DashboardPage;
