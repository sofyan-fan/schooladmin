import PostRegisterDialog from '@/components/shared/PostRegisterDialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useAuth } from '@/hooks/useAuth';
import { formatHijri } from '@/utils/hijri';
import { loadNotifications } from '@/utils/notificationsStorage';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import StatCard from '../components/dashboard/StatCard';
import { UpcomingLessons } from '../components/dashboard/UpcomingLessons';
import YearPlanning from '../components/dashboard/YearPlanning';

import eventAPI from '@/apis/eventAPI';
import financeAPI from '@/apis/financeAPI';
import RequestHandler from '@/apis/RequestHandler';
import resultAPI from '@/apis/resultAPI';
import rosterAPI from '@/apis/rosterAPI';
import { get_student_by_id, get_students } from '@/apis/studentAPI';
import { get_teachers } from '@/apis/teachersAPI';
import { absenceAPI, timeRegisterAPI } from '@/apis/timeregisterAPI';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, justRegistered, clearJustRegistered } = useAuth();
  const isStudent = useMemo(
    () => (user?.role || '').toLowerCase() === 'student',
    [user]
  );
  const isAdmin = useMemo(
    () => (user?.role || '').toLowerCase() === 'admin',
    [user]
  );
  const firstName = useMemo(() => {
    return (
      user?.first_name ||
      user?.firstName ||
      (typeof user?.name === 'string' ? user.name.split(' ')[0] : '') ||
      ''
    );
  }, [user]);
  const [stats, setStats] = useState(null);
  const [jaarplanning, setJaarplanning] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [teacherAbsencesToday, setTeacherAbsencesToday] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [studentDashboard, setStudentDashboard] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Always load events for YearPlanning
        const eventsPromise = eventAPI.get_events();
        // Always load finance logs for saldo (all roles)
        const financialLogsPromise = financeAPI.get_financial_logs();

        if (isAdmin) {
          const [
            events,
            students,
            teachers,
            absencesRes,
            timeRegsRes,
            rosters,
            financialLogs,
          ] = await Promise.all([
            eventsPromise,
            get_students(),
            get_teachers(),
            absenceAPI.getAllAbsences(),
            timeRegisterAPI.getAllTimeRegistrations(),
            rosterAPI.get_rosters(),
            financialLogsPromise,
          ]);

          setJaarplanning(events || []);

          const today = new Date();
          const isSameDay = (a, b) => {
            const da = new Date(a);
            return (
              da.getFullYear() === b.getFullYear() &&
              da.getMonth() === b.getMonth() &&
              da.getDate() === b.getDate()
            );
          };

          const allAbsences = Array.isArray(absencesRes) ? absencesRes : [];
          const studentAbsencesToday = allAbsences.filter(
            (a) => a.role === 'student' && isSameDay(a.date, today)
          );
          const teacherAbsToday = allAbsences.filter(
            (a) => a.role === 'teacher' && isSameDay(a.date, today)
          );

          // Time registrations (support both `{ success, data }` and raw array)
          const timeRegsData = Array.isArray(timeRegsRes?.data)
            ? timeRegsRes.data
            : Array.isArray(timeRegsRes)
              ? timeRegsRes
              : [];
          const totalTimeRegs = timeRegsData.length;
          const pendingTimeRegs = timeRegsData.filter((r) => !r.approved).length;

          // upcoming lessons today from rosters
          const rostersToday = (rosters || []).filter((r) =>
            r.start ? isSameDay(r.start, today) : false
          );
          rostersToday.sort((a, b) =>
            (a.start || '').localeCompare(b.start || '')
          );
          const lessonItems = rostersToday.map((r) => ({
            title: r.subject?.name || 'Les',
            time:
              r.start_time && r.end_time
                ? `${r.start_time} - ${r.end_time}`
                : '',
            teacher: r.teacher
              ? `${r.teacher.first_name} ${r.teacher.last_name}`
              : '',
            group: r.class_layout?.name || '',
            classroom: r.classroom?.name || '',
          }));

          setLessons(lessonItems);
          setTeacherAbsencesToday(teacherAbsToday);

          // Finance metrics for current month
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          const monthLogs = Array.isArray(financialLogs)
            ? financialLogs.filter((log) => {
              const d = new Date(log.date);
              return d >= startOfMonth && d <= today;
            })
            : [];
          const incomeMonth = monthLogs.reduce(
            (sum, l) =>
              sum + (l.transaction_type === 'income' ? Number(l.amount || 0) : 0),
            0
          );
          const expenseMonth = monthLogs.reduce(
            (sum, l) =>
              sum + (l.transaction_type === 'expense' ? Number(l.amount || 0) : 0),
            0
          );
          const netMonth = incomeMonth - expenseMonth;

          // Finance metrics for all-time saldo
          const incomeAllTime = Array.isArray(financialLogs)
            ? financialLogs.reduce(
              (sum, l) =>
                sum + (l.transaction_type === 'income' ? Number(l.amount || 0) : 0),
              0
            )
            : 0;
          const expenseAllTime = Array.isArray(financialLogs)
            ? financialLogs.reduce(
              (sum, l) =>
                sum + (l.transaction_type === 'expense' ? Number(l.amount || 0) : 0),
              0
            )
            : 0;
          const netAllTime = incomeAllTime - expenseAllTime;

          const totalStudents = Array.isArray(students) ? students.length : 0;
          const totalTeachers = Array.isArray(teachers) ? teachers.length : 0;
          setStats({
            totalStudents,
            studentsPresent: totalStudents - studentAbsencesToday.length,
            totalTeachers,
            teachersPresent: totalTeachers - teacherAbsToday.length,
            totalTimeRegs,
            pendingTimeRegs,
            absentTotal: studentAbsencesToday.length + teacherAbsToday.length,
            financeIncomeMonth: incomeMonth,
            financeExpenseMonth: expenseMonth,
            financeNetMonth: netMonth,
            financeIncomeAllTime: incomeAllTime,
            financeExpenseAllTime: expenseAllTime,
            financeNetAllTime: netAllTime,
          });
        } else if (isStudent) {
          // Student dashboard: load events, finance logs and student-specific data
          let resolvedStudentId =
            user?.studentId || user?.data?.id || null;

          if (!resolvedStudentId) {
            try {
              const resp = await RequestHandler.get('/auth/me/student');
              resolvedStudentId = resp?.data?.id;
            } catch (e) {
              console.error('Error resolving student ID for dashboard:', e);
            }
          }

          const [
            events,
            financialLogs,
            allResults,
            allAbsences,
            rosters,
            student,
          ] = await Promise.all([
            eventsPromise,
            financialLogsPromise,
            resultAPI.get_results(),
            absenceAPI.getAllAbsences(),
            rosterAPI.get_rosters(),
            resolvedStudentId
              ? get_student_by_id(resolvedStudentId)
              : Promise.resolve(null),
          ]);

          setJaarplanning(events || []);

          const today = new Date();
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          const monthLogs = Array.isArray(financialLogs)
            ? financialLogs.filter((log) => {
              const d = new Date(log.date);
              return d >= startOfMonth && d <= today;
            })
            : [];
          const incomeMonth = monthLogs.reduce(
            (sum, l) =>
              sum + (l.transaction_type === 'income' ? Number(l.amount || 0) : 0),
            0
          );
          const expenseMonth = monthLogs.reduce(
            (sum, l) =>
              sum + (l.transaction_type === 'expense' ? Number(l.amount || 0) : 0),
            0
          );
          const netMonth = incomeMonth - expenseMonth;

          const incomeAllTime = Array.isArray(financialLogs)
            ? financialLogs.reduce(
              (sum, l) =>
                sum + (l.transaction_type === 'income' ? Number(l.amount || 0) : 0),
              0
            )
            : 0;
          const expenseAllTime = Array.isArray(financialLogs)
            ? financialLogs.reduce(
              (sum, l) =>
                sum + (l.transaction_type === 'expense' ? Number(l.amount || 0) : 0),
              0
            )
            : 0;
          const netAllTime = incomeAllTime - expenseAllTime;

          setStats({
            totalStudents: 0,
            studentsPresent: 0,
            totalTeachers: 0,
            teachersPresent: 0,
            totalTimeRegs: 0,
            pendingTimeRegs: 0,
            absentTotal: 0,
            financeIncomeMonth: incomeMonth,
            financeExpenseMonth: expenseMonth,
            financeNetMonth: netMonth,
            financeIncomeAllTime: incomeAllTime,
            financeExpenseAllTime: expenseAllTime,
            financeNetAllTime: netAllTime,
          });

          const sid = resolvedStudentId ? Number(resolvedStudentId) : null;
          let lastResult = null;
          let attendancePct = null;

          if (sid && Number.isFinite(sid)) {
            const studentResults = (allResults || []).filter(
              (r) => Number(r.student_id) === sid
            );
            if (studentResults.length > 0) {
              const sortedResults = [...studentResults].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              );
              lastResult = sortedResults[0] ?? null;
            }

            const studentAbsences = (allAbsences || []).filter(
              (a) => Number(a.student_id) === sid
            );
            const totalAbs = studentAbsences.length;
            const late = studentAbsences.filter(
              (a) => a.reason === 'Te Laat'
            ).length;
            const absent = totalAbs - late;

            // Simple placeholder for total lessons, aligned with StudentDetailsPage
            const assumedTotalLessons = 30;
            const present = Math.max(0, assumedTotalLessons - totalAbs);

            const donutTotal = Math.max(present + late + absent, 1);
            attendancePct = Math.round((present / donutTotal) * 100);
          }

          // Build today's lessons and next upcoming lesson from roster
          let nextLesson = null;
          if (Array.isArray(rosters) && rosters.length > 0) {
            const classId =
              student?.class_id ??
              student?.class_layout?.id ??
              null;

            const today = new Date();
            const isSameDay = (a, b) => {
              const da = new Date(a);
              return (
                da.getFullYear() === b.getFullYear() &&
                da.getMonth() === b.getMonth() &&
                da.getDate() === b.getDate()
              );
            };

            const rostersToday = (rosters || []).filter((r) =>
              r.start ? isSameDay(r.start, today) : false
            );

            const studentRostersToday = classId
              ? rostersToday.filter((r) => {
                const rosterClassId =
                  r.class_id ?? r?.class_layout?.id ?? null;
                return (
                  rosterClassId &&
                  Number(rosterClassId) === Number(classId)
                );
              })
              : rostersToday;

            studentRostersToday.sort((a, b) =>
              (a.start || '').localeCompare(b.start || '')
            );

            const lessonItems = studentRostersToday.map((r) => ({
              title: r.subject?.name || 'Les',
              time:
                r.start_time && r.end_time
                  ? `${r.start_time} - ${r.end_time}`
                  : '',
              teacher: r.teacher
                ? `${r.teacher.first_name} ${r.teacher.last_name}`
                : '',
              group: r.class_layout?.name || '',
              classroom: r.classroom?.name || '',
            }));

            setLessons(lessonItems);
            setTeacherAbsencesToday([]);

            if (studentRostersToday.length > 0) {
              const now = new Date();
              const upcomingIndex = studentRostersToday.findIndex((r) => {
                if (!r.start) return false;
                const start = new Date(r.start);
                return start >= now;
              });

              const nextRoster =
                upcomingIndex !== -1
                  ? studentRostersToday[upcomingIndex]
                  : studentRostersToday[0];

              if (nextRoster) {
                const startTime =
                  nextRoster.start_time ||
                  (nextRoster.start
                    ? new Date(nextRoster.start)
                      .toTimeString()
                      .slice(0, 5)
                    : '');

                nextLesson = {
                  title: nextRoster.subject?.name || 'Les',
                  startTime,
                  group: nextRoster.class_layout?.name || '',
                  classroom: nextRoster.classroom?.name || '',
                };
              }
            } else {
              setLessons([]);
            }
          } else {
            setLessons([]);
            setTeacherAbsencesToday([]);
          }

          setStudentDashboard({
            studentId: resolvedStudentId || null,
            lastResult,
            attendancePct,
            nextLesson,
          });
        } else {
          // Non-admin: load events and finance logs to compute saldo
          const [events, financialLogs] = await Promise.all([
            eventsPromise,
            financialLogsPromise,
          ]);
          setJaarplanning(events || []);

          const today = new Date();
          const startOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          const monthLogs = Array.isArray(financialLogs)
            ? financialLogs.filter((log) => {
              const d = new Date(log.date);
              return d >= startOfMonth && d <= today;
            })
            : [];
          const incomeMonth = monthLogs.reduce(
            (sum, l) =>
              sum + (l.transaction_type === 'income' ? Number(l.amount || 0) : 0),
            0
          );
          const expenseMonth = monthLogs.reduce(
            (sum, l) =>
              sum + (l.transaction_type === 'expense' ? Number(l.amount || 0) : 0),
            0
          );
          const netMonth = incomeMonth - expenseMonth;

          const incomeAllTime = Array.isArray(financialLogs)
            ? financialLogs.reduce(
              (sum, l) =>
                sum + (l.transaction_type === 'income' ? Number(l.amount || 0) : 0),
              0
            )
            : 0;
          const expenseAllTime = Array.isArray(financialLogs)
            ? financialLogs.reduce(
              (sum, l) =>
                sum + (l.transaction_type === 'expense' ? Number(l.amount || 0) : 0),
              0
            )
            : 0;
          const netAllTime = incomeAllTime - expenseAllTime;

          setStats({
            totalStudents: 0,
            studentsPresent: 0,
            totalTeachers: 0,
            teachersPresent: 0,
            totalTimeRegs: 0,
            pendingTimeRegs: 0,
            absentTotal: 0,
            financeIncomeMonth: incomeMonth,
            financeExpenseMonth: expenseMonth,
            financeNetMonth: netMonth,
            financeIncomeAllTime: incomeAllTime,
            financeExpenseAllTime: expenseAllTime,
            financeNetAllTime: netAllTime,
          });
          setLessons([]);
          setTeacherAbsencesToday([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, isStudent, user]);

  useEffect(() => {
    // Load notifications count from localStorage
    const notifications = loadNotifications();
    setNotificationsCount(Array.isArray(notifications) ? notifications.length : 0);
  }, []);

  if (!stats) {
    return <div>Laden...</div>;
  }

  const today = new Date();
  const gregorianDate = format(today, 'EEEE d MMMM yyyy', { locale: nl });
  const hijriDate = formatHijri(today);
  const capitalizeDay =
    gregorianDate.charAt(0).toUpperCase() + gregorianDate.slice(1);

  const latestGradeRaw = studentDashboard?.lastResult?.grade;
  const latestGradeNumber =
    typeof latestGradeRaw === 'number'
      ? latestGradeRaw
      : latestGradeRaw != null
        ? Number(latestGradeRaw)
        : null;
  const latestGradeValue = Number.isFinite(latestGradeNumber)
    ? latestGradeNumber.toFixed(1)
    : '—';

  const attendancePctRaw = studentDashboard?.attendancePct;
  const attendanceValue =
    typeof attendancePctRaw === 'number' && Number.isFinite(attendancePctRaw)
      ? `${attendancePctRaw}%`
      : '—';

  const latestAssessment = studentDashboard?.lastResult?.assessment;
  const latestAssessmentSubtitle = latestAssessment?.name
    ? `${latestAssessment.type === 'test' ? 'Toets' : 'Examen'}: ${latestAssessment.name
    }`
    : null;

  const nextLesson = studentDashboard?.nextLesson;

  const studentProfileBaseLink =
    isStudent && studentDashboard?.studentId
      ? `/mijn-profiel/leerling/${String(studentDashboard.studentId)}`
      : '/mijn-profiel';

  const withTab = (base, tab) => {
    if (!base) return '/mijn-profiel';
    const hasQuery = base.includes('?');
    const sep = hasQuery ? '&' : '?';
    return `${base}${sep}tab=${encodeURIComponent(tab)}`;
  };

  const studentProfileResultsLink = withTab(
    studentProfileBaseLink,
    'resultaten'
  );
  const studentProfileAttendanceLink = withTab(
    studentProfileBaseLink,
    'aanwezigheid'
  );

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          {/* <h1 className="text-3xl font-semibold text-regular">
            Welkom{firstName ? `, ${firstName}` : ''}!
          </h1> */}
          <div>
            <div className="text-2xl text-regular font-medium">
              {capitalizeDay}
            </div>
          </div>
          <div className="text-right">
            <div className="text-base text-regular italic">{hijriDate}</div>
          </div>
        </div>
      </div>

      <PostRegisterDialog
        open={Boolean(justRegistered && isStudent)}
        firstName={firstName}
        onAction={(action) => {
          clearJustRegistered();
          if (action === 'profile') {
            window.location.href = '/mijn-profiel';
          }
        }}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {isAdmin && (
          <Card className="flex flex-row items-center p-8 rounded-lg border shadow-sm bg-[#FEFEFD] h-[140px] transition-all hover:shadow-md">
            <div className="mr-2">
              <ChartContainer className="h-[90px] w-[90px]" config={{}}>
                <PieChart width={90} height={90}>
                  <Pie
                    data={(() => {
                      const total = stats.totalStudents || 0;
                      const present = stats.studentsPresent || 0;
                      const absent = Math.max(total - present, 0);
                      return [
                        { name: 'Aanwezig', value: present, fill: '#88bb18' },
                        { name: 'Afwezig', value: absent, fill: '#f7c322' },
                      ];
                    })()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={42}
                    strokeWidth={2}
                  >
                    <Label
                      position="center"
                      content={(props) => {
                        const total = stats.totalStudents || 0;
                        const absent = total - (stats.studentsPresent || 0);
                        const pct =
                          total > 0 ? Math.round((absent / total) * 100) : 0;
                        return (
                          <text
                            x={props.viewBox.cx}
                            y={props.viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan className="fill-foreground text-xl font-bold">
                              {pct}%
                            </tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                  <ChartTooltip
                    cursor={{ fill: 'transparent' }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                </PieChart>
              </ChartContainer>
            </div>
            <CardContent className="p-0">
              <div className="text-xl font-medium text-regular mb-2">
                <h1>Leerlingen</h1>
                <h2 className="text-base text-regular">Afwezig</h2>
              </div>
              <div className="text-3xl font-medium text-regular">
                {stats.totalStudents - stats.studentsPresent}
                <span className="text-xl font-medium text-regular">
                  {' '}
                  / {stats.totalStudents}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAdmin && !isStudent && (
          <StatCard
            title="Afwezig gemeld"
            value={stats.absentTotal || 0}
            link="/afwezigheid"
            icon={<UserX className="h-8 w-8" />}
            variant="danger"
          />
        )}

        {isStudent && (
          <>
            <StatCard
              title="Resultaat"
              value={latestGradeValue}
              link={studentProfileResultsLink}
              icon={<TrendingUp className="h-8 w-8" />}
              subtitle={latestAssessmentSubtitle}
              variant="default"
              // className={cn('bg-primary/10 text-primary')}
              
            />
            {/* <Link to={studentProfileResultsLink} aria-label={`View details for Laatste resultaat`}>
              <Card className="h-[140px] p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className="flex flex-row items-center gap-5 h-full">
                  <TrendingUp className=" bg-primary/10 text-primary h-8 w-8 p-4 rounded-full flex items-center justify-center hidden md:hidden lg:flex" />
                  <div className="flex flex-col justify-center h-full gap-2">
                    <p className="text-xl font-medium text-regular">Laatste resultaat</p>
                    <div className="flex gap-2">
                      <p className="text-xl font-medium text-regular">{latestGradeValue}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {latestAssessmentSubtitle}
                      </p>
                    </div>

                  </div>
                </div>
              </Card>
            </Link> */}
            <StatCard
              title="Aanwezigheid"
              value={attendanceValue}
              link={studentProfileAttendanceLink}
              icon={<Clock className="h-8 w-8" />}
              variant={
                attendancePctRaw >= 90
                  ? 'success'
                  : attendancePctRaw >= 75
                    ? 'warning'
                    : 'danger'
              }
            />
            <Link
              to={studentProfileBaseLink}
              aria-label="Bekijk volgende les"
              className="block"
            >
              <Card className="h-[140px] p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className="flex flex-row items-center gap-5 h-full">
                  <div className="p-4 rounded-full flex items-center justify-center hidden md:hidden lg:flex bg-primary/10 text-primary">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div className="flex flex-col justify-center h-full gap-1">
                    <p className="text-xl font-medium text-regular">
                      Volgende les
                    </p>
                    <p className="text-lg font-semibold text-regular">
                      {nextLesson?.title || 'Geen les'}
                    </p>
                    {(nextLesson?.group || nextLesson?.classroom) && (
                      <p className="text-sm text-muted-foreground">
                        {nextLesson?.group || ''}
                        {nextLesson?.group && nextLesson?.classroom ? ' · ' : ''}
                        {nextLesson?.classroom || ''}
                      </p>
                    )}
                    {/* {nextLesson?.startTime && (
                      <p className="text-sm text-muted-foreground">
                        {nextLesson.startTime}
                      </p>
                    )} */}
                  </div>
                </div>
              </Card>
            </Link>
          </>
        )}

        {!isStudent && (
          <>
            {/* Finance Stat Card */}
            <StatCard
              title="Saldo (totaal)"
              value={new Intl.NumberFormat('nl-NL', {
                style: 'currency',
                currency: 'EUR',
              }).format(
                typeof stats.financeNetAllTime === 'number'
                  ? stats.financeNetAllTime
                  : 0
              )}
              link="/financien"
              icon={
                (stats.financeNetAllTime || 0) > 0 ? (
                  <TrendingUp className="h-8 w-8" />
                ) : (
                  <TrendingDown className="h-8 w-8" />
                )
              }
              variant={
                (stats.financeNetAllTime || 0) > 0
                  ? 'success'
                  : (stats.financeNetAllTime || 0) < 0
                    ? 'danger'
                    : 'default'
              }
            />

            {isAdmin && (
              <StatCard
                title="Tijdregistraties"
                value={stats.totalTimeRegs || 0}
                link="/tijd-registratie"
                icon={<Clock className="h-8 w-8" />}
                subtitle={
                  stats.pendingTimeRegs > 0
                    ? `In afwachting: ${stats.pendingTimeRegs}`
                    : ''
                }
                variant={stats.pendingTimeRegs > 0 ? 'warning' : 'success'}
              />
            )}
          </>
        )}

        {/* Meldingen Stat Card */}
        <StatCard
          title="Meldbox"
          value={notificationsCount}
          link="/meldingen"
          icon={<Bell className="h-8 w-8" />}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <YearPlanning
            items={jaarplanning}
            setItems={setJaarplanning}
            readOnly={isStudent}
          />
          {isAdmin ? (
            <Card className="rounded-lg border shadow-sm bg-white">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">
                  Afwezige leraren vandaag
                </h3>
                {loading ? (
                  <div className="text-sm text-regular">Laden...</div>
                ) : teacherAbsencesToday.length === 0 ? (
                  <div className="text-sm text-regular">
                    Geen afwezige leraren vandaag
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teacherAbsencesToday.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start justify-between text-sm"
                      >
                        <div className="text-regular">
                          {a.teacher
                            ? `${a.teacher.first_name} ${a.teacher.last_name}`
                            : 'Onbekende leraar'}
                        </div>
                        <div className="text-regular">
                          {a.roster?.class_layout?.name || ''} ·{' '}
                          {a.roster?.start_time} - {a.roster?.end_time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
        <div className="space-y-6">
          <UpcomingLessons lessons={lessons} loading={loading} />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
