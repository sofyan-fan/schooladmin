import PostRegisterDialog from '@/components/shared/PostRegisterDialog';
import { useAuth } from '@/hooks/useAuth';
import { formatHijri } from '@/utils/hijri';
import { loadNotifications } from '@/utils/notificationsStorage';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
// Pie chart imports removed for a simplified, consistent StatCard layout
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
          // Only count registrations that are "in afwachting" (not approved and not paid)
          const pendingTimeRegs = timeRegsData.filter((r) => !r.approved && !r.paid).length;

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
          // Count students that have at least one tuition payment
          const paidStudents = Array.isArray(students)
            ? students.filter((s) => s.payments && s.payments.length > 0).length
            : 0;
          setStats({
            totalStudents,
            studentsPresent: totalStudents - studentAbsencesToday.length,
            totalTeachers,
            teachersPresent: totalTeachers - teacherAbsToday.length,
            totalTimeRegs,
            pendingTimeRegs,
            absentTotal: studentAbsencesToday.length + teacherAbsToday.length,
            paidStudents,
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
    const loadNotificationsCount = async () => {
      try {
        const notifications = await loadNotifications();
        setNotificationsCount(
          Array.isArray(notifications) ? notifications.length : 0
        );
      } catch (error) {
        console.error('Error loading notifications for dashboard:', error);
        setNotificationsCount(0);
      }
    };

    loadNotificationsCount();
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
      <div className="mb-4 xs:mb-5 sm:mb-6">
        <div className="flex flex-col xs:flex-row items-center xs:items-start justify-between gap-2 xs:gap-4">
          <div className="text-base xs:text-lg sm:text-xl md:text-2xl text-regular font-medium text-center xs:text-left">
            {capitalizeDay}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs sm:text-sm md:text-base text-regular italic">{hijriDate}</div>
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
      {/* Stat cards grid - granular breakpoints for better control */}
      {/* xs:480px, sm:640px, md:768px, lg:1024px, xl:1280px */}
      <div className="grid grid-cols-1 gap-2.5 xs:gap-3 s:grid-cols-2 s:gap-3.5 md:gap-4 lg:grid-cols-4 lg:gap-5 xl:gap-6 mb-6">
        {isAdmin && (
          <StatCard
            title="Afwezig"
            value={Math.max(
              (stats.totalStudents || 0) - (stats.studentsPresent || 0),
              0
            )}
            link="/afwezigheid"
            icon={<UserX />}
            variant={
              (stats.totalStudents || 0) - (stats.studentsPresent || 0) > 0
                ? 'warning'
                : 'success'
            }
          />
        )}

        {!isAdmin && !isStudent && (
          <StatCard
            title="Afwezig gemeld"
            value={stats.absentTotal || 0}
            link="/afwezigheid"
            icon={<UserX />}
            variant="danger"
          />
        )}

        {isStudent && (
          <>
            <StatCard
              title="Laatste resultaat"
              value={latestGradeValue}
              link={studentProfileResultsLink}
              icon={<TrendingUp />}
              variant="default"
            />

            <StatCard
              title="Aanwezigheid"
              value={attendanceValue}
              link={studentProfileAttendanceLink}
              icon={<Clock />}
              variant={
                attendancePctRaw >= 90
                  ? 'success'
                  : attendancePctRaw >= 75
                    ? 'warning'
                    : 'danger'
              }
            />

            <StatCard
              title="Volgende les"
              value={nextLesson?.title || 'Geen les'}
              link={studentProfileBaseLink}
              icon={<Calendar />}
              variant="default"
            />
          </>
        )}

        {!isStudent && (
          <>
            {/* Paid Students Stat Card */}
            <StatCard
              title="Betaalde leerlingen"
              value={`${stats.paidStudents || 0} / ${stats.totalStudents || 0}`}
              link="/leerlingen"
              icon={<CheckCircle />}
              variant={
                stats.paidStudents === stats.totalStudents && stats.totalStudents > 0
                  ? 'success'
                  : stats.paidStudents > 0
                    ? 'warning'
                    : 'default'
              }
            />

            {isAdmin && (
              <StatCard
                title="Tijdregistraties"
                value={stats.pendingTimeRegs || 0}
                link="/tijd-registratie"
                icon={<Clock />}
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
          icon={<Bell />}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
          <YearPlanning
            items={jaarplanning}
            setItems={setJaarplanning}
            readOnly={isStudent}
          />
          {/* {isAdmin ? (
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
          ) : null} */}
        </div>
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <UpcomingLessons lessons={lessons} loading={loading} />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
