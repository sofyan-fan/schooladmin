import { UserCheck, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import RequestHandler from '../apis/RequestHandler';
import CalendarView from '../components/dashboard/CalendarView';
import Members from '../components/dashboard/Members';
import StatCard from '../components/dashboard/StatCard';
import YearPlanning from '../components/dashboard/YearPlanning';
import LayoutWrapper from '../components/layout/LayoutWrapper';

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
    const fetchData = async () => {
      try {
        const [
          statsRes,
          jaarplanningRes,
          studentenRes,
          lerarenRes,
          personeelRes,
          lessonsRes,
        ] = await Promise.all([
          RequestHandler.get('api/stats'),
          RequestHandler.get('api/jaarplanning'),
          RequestHandler.get('api/studenten'),
          RequestHandler.get('api/leraren'),
          RequestHandler.get('api/personeel'),
          RequestHandler.get('api/lessons'),
        ]);

        setStats(statsRes.data);
        setJaarplanning(jaarplanningRes.data);
        setMembers({
          studenten: studentenRes.data,
          leraren: lerarenRes.data,
          personeel: personeelRes.data,
        });
        setLessons(lessonsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  if (!stats) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <LayoutWrapper>
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
    </LayoutWrapper>
  );
};

export default DashboardPage;
