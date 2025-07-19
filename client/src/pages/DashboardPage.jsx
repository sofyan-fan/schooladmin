import { dashboardData } from '@/lib/mock-data';
import { UserCheck, Users, UserX } from 'lucide-react';
import CalendarView from '../components/dashboard/CalendarView';
import Members from '../components/dashboard/Members';
import StatCard from '../components/dashboard/StatCard';
import YearPlanning from '../components/dashboard/YearPlanning';
import LayoutWrapper from '../components/layout/LayoutWrapper';

const DashboardPage = () => {
  const { stats, jaarplanning, members, lessons } = dashboardData;

  return (
    <LayoutWrapper>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Totaal Studenten"
          value={stats.totalStudents}
          icon={<Users className="h-6 w-6 text-muted-foreground" />}
        />
        <StatCard
          title="Studenten Aanwezig"
          value={stats.studentsPresent}
          icon={<UserCheck className="h-6 w-6 text-muted-foreground" />}
        />
        <StatCard
          title="Leraren Aanwezig"
          value={stats.teachersPresent}
          icon={<UserCheck className="h-6 w-6 text-muted-foreground" />}
        />
        <StatCard
          title="Totaal Afwezig"
          value={stats.totalStudents - stats.studentsPresent}
          icon={<UserX className="h-6 w-6 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <YearPlanning items={jaarplanning} />
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
