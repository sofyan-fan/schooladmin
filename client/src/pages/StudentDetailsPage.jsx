import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Home,
  IdCard,
  LifeBuoy,
  Mail,
  MapPin,
  Notebook,
  Phone,
  TrendingUp,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AttendanceCard } from '@/components/other/AttendanceCard';
import { RecentResultsCard } from '@/components/other/RecentResultsCard';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import classAPI from '@/apis/classAPI';
import enrollmentAPI from '@/apis/enrollmentAPI';
import resultAPI from '@/apis/resultAPI';
import studentAPI from '@/apis/studentAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

const StatCard = ({ icon, title, description, tab, setTab, className }) => (
  <Card className={['flex flex-col', className].join(' ')}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-1 items-center">
      <p className="text-sm text-muted-foreground">
        Geen gegevens beschikbaar.
      </p>
    </CardContent>
    <CardFooter>
      <Button
        variant="link"
        className="px-0 text-primary"
        onClick={() => setTab(tab)}
      >
        Bekijk {tab}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </CardFooter>
  </Card>
);

export default function StudentDetailsPage2() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [klass, setKlass] = useState(null);
  const [results, setResults] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [tab, setTab] = useState('overzicht');
  const [savingEnroll, setSavingEnroll] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setStudent(null);
      try {
        const s = await studentAPI.get_student_by_id(id);
        if (!mounted) return;
        setStudent(s);

        if (s?.class_id) {
          const cl = await classAPI.get_class(s.class_id);
          if (!mounted) return;
          setKlass(cl);
        }

        const [allResults, allAbsences] = await Promise.all([
          resultAPI.get_results(),
          absenceAPI.getAllAbsences(),
        ]);
        if (!mounted) return;

        const sid = Number(id);
        setResults((allResults || []).filter((r) => r.student_id === sid));
        setAbsences((allAbsences || []).filter((a) => a.student_id === sid));
      } catch (e) {
        console.error(e);
        setStudent(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [id]);

  const studentStats = useMemo(() => {
    if (!student) return null;

    const sorted = [...results].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const lastResult = sorted[0] ?? null;
    const avg =
      results.length > 0
        ? (
            results.reduce((s, r) => s + (Number(r.grade) || 0), 0) /
            results.length
          ).toFixed(1)
        : null;

    const totalAbs = absences.length;
    const late = absences.filter((a) => a.reason === 'Te Laat').length;
    const absent = totalAbs - late;

    // Placeholder total lessons; replace when you have real totals
    const assumedTotalLessons = 30;
    const present = Math.max(0, assumedTotalLessons - totalAbs);

    const donutTotal = Math.max(present + late + absent, 1);
    const presentPct = Math.round((present / donutTotal) * 100);
    console.log('Student Data: ', student);
    return {
      fullName: [student.first_name, student.last_name]
        .filter(Boolean)
        .join(' '),
      chips: [
        ...(student.lesson_package
          ? [
              {
                label: `Lespakket ${student.lesson_package}`,
                variant: 'outline',
              },
            ]
          : []),
        {
          label: student.enrollment_status ? 'Ingeschreven' : 'Uitgeschreven',
          variant: student.enrollment_status ? 'default' : 'destructive',
        },
      ],
      meta: {
        klas: klass?.name ?? 'Onbekend',
        course: klass?.course?.name ?? 'Onbekend',
        registered: fmtDate(student.created_at),
      },
      lastResult,
      avg,
      resultsCount: results.length,
      lesson_package: student.lesson_package,
      attendance: {
        present,
        late,
        absent,
        presentPct,
        donutData: [
          { name: 'present', value: present, fill: 'var(--color-present)' },
          { name: 'late', value: late, fill: 'var(--color-late)' },
          { name: 'absent', value: absent, fill: 'var(--color-absent)' },
        ],
      },
    };
  }, [student, results, absences, klass]);

  // Using AttendanceCard's internal chart config; colors are provided via CSS vars per card usage.

  const handleToggleEnrollment = async () => {
    if (!student) return;
    try {
      setSavingEnroll(true);
      const updated = await enrollmentAPI.toggle_enrollment(
        student.id,
        !student.enrollment_status
      );
      setStudent(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEnroll(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-2 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-28 rounded-md bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-10 w-full rounded-md bg-muted" />
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!student || !studentStats) {
    return (
      <div className="mx-auto max-w-[1200px] px-2 sm:px-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold">Student niet gevonden</h2>
          <p className="mt-2 text-muted-foreground">
            De opgevraagde student kon niet worden gevonden.
          </p>
        </div>
      </div>
    );
  }

  const TABS = [
    { value: 'overzicht', label: 'Overzicht' },
    { value: 'gegevens', label: 'Gegevens' },
    { value: 'resultaten', label: 'Resultaten' },
    { value: 'aanwezigheid', label: 'Aanwezigheid' },
    { value: 'betalingen', label: 'Betalingen' },
    { value: 'voortgang', label: 'Voortgang' },
    { value: 'notities', label: 'Notities' },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-2 sm:px-6 h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar studenten
          </Button>

          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/70">
              <User className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {studentStats.fullName}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleEnrollment}
            disabled={savingEnroll}
          >
            {student.enrollment_status ? 'Uitschrijven' : 'Inschrijven'}
          </Button>
          <Link to={`/students/${student.id}/edit`}>
            <Button>Bewerken</Button>
          </Link>
        </div>
      </div>

      {/* Sticky sub-nav (styled TabsList) */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-16 z-30 -mx-2  px-2 backdrop-blur ">
          <TabsList className="border-b bp-0">
            <div className="flex w-full gap-2 overflow-x-auto pb-0.5">
              {TABS.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="
                    relative h-10 hover:cursor-pointer rounded-none px-3 text-sm font-medium
                    data-[state=active]:text-foreground
                    after:absolute after:inset-x-2 after:-bottom-[1px] after:h-0.5 after:rounded-full after:bg-transparent
                    data-[state=active]:after:bg-primary
                  "
                >
                  {label}
                </TabsTrigger>
              ))}
            </div>
          </TabsList>
        </div>

        {/* OVERZICHT */}
        <TabsContent value="overzicht" className="mt-6">
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            {/* Aanwezigheid — use shared AttendanceCard */}
            <AttendanceCard
              className="lg:col-span-4"
              stats={studentStats.attendance}
              title="Aanwezigheid"
              colorVars={{
                present: 'oklch(0.7805 0.1825 127.06)',
                late: 'oklch(0.88 0.12 95)',
                absent: 'oklch(0.67 0.22 28)',
              }}
              timeframe="Laatste 30 dagen"
              standardPct={90}
              onOpenAttendance={() => setTab('aanwezigheid')}
            />

            {/* <RecentResultsCard studentStats={studentStats} /> */}
            <RecentResultsCard
              studentStats={studentStats}
              className="lg:col-span-4"
              onOpenResults={() => setTab('resultaten')}
            />
            {/* Profiel (beknopt) */}
            <Card className="lg:col-span-4 gap-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User size={25} /> Gegevens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 flex flex-col gap-2">
                  <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
                    <IdCard className="size-5" />
                    Lespakket:{' '}
                    <span className="font-bold">
                      {studentStats.lesson_package || '—'}
                    </span>
                  </div>
                  <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
                    <Mail className="size-5" />
                    {student?.email || student?.parent_email || '—'}
                  </div>
                  <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
                    <Phone className="size-5" />
                    {student?.phone || '—'}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Quick overviews */}
            <div className="lg:col-span-4">
              <StatCard
                icon={<TrendingUp size={20} />}
                title="Voortgang"
                description="Overzicht van leer voortgang."
                tab="voortgang"
                setTab={setTab}
              />
            </div>
            <div className="lg:col-span-4">
              <StatCard
                icon={<CreditCard size={20} />}
                title="Betalingen"
                description="Status van lesgeldbetalingen."
                tab="betalingen"
                setTab={setTab}
              />
            </div>
            <div className="lg:col-span-4">
              <StatCard
                icon={<Notebook size={20} />}
                title="Notities"
                description="Persoonlijke opmerkingen."
                tab="notities"
                setTab={setTab}
              />
            </div>
          </div>
        </TabsContent>

        {/* GEGEVENS */}
        <TabsContent value="gegevens" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Studentgegevens</CardTitle>
              <CardDescription>
                Volledige contact- en adresgegevens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Naam
                  </div>
                  <div className="text-sm font-medium">
                    {studentStats.fullName || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> E-mail
                  </div>
                  <div className="text-sm font-medium">
                    {student?.email || student?.parent_email || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> Telefoon
                  </div>
                  <div className="text-sm font-medium">
                    {student?.phone || '—'}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Home className="h-4 w-4" /> Adres
                  </div>
                  <div className="text-sm font-medium">
                    {[student?.address, student?.postalCode, student?.city]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> Woonplaats
                  </div>
                  <div className="text-sm font-medium">
                    {student?.city || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <LifeBuoy className="h-4 w-4" /> SOS-nummer
                  </div>
                  <div className="text-sm font-medium">
                    {student?.sosnumber || '—'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Ouder/verzorger
                  </div>
                  <div className="text-sm font-medium">
                    {student?.parent_name || '—'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESULTATEN */}
        <TabsContent value="resultaten" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alle Resultaten</CardTitle>
              <CardDescription>
                Overzicht van alle behaalde cijfers.
              </CardDescription>
            </CardHeader>
            <CardContent>{/* results table here */}</CardContent>
          </Card>
        </TabsContent>

        {/* AANWEZIGHEID */}
        <TabsContent value="aanwezigheid" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alle Aanwezigheidsregistraties</CardTitle>
              <CardDescription>
                Gedetailleerd overzicht van alle registraties.
              </CardDescription>
            </CardHeader>
            <CardContent>{/* absence table here */}</CardContent>
          </Card>
        </TabsContent>

        {/* Simple placeholders (consistent tone) */}
        {['betalingen', 'voortgang', 'notities'].map((v) => (
          <TabsContent key={v} value={v} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{v}</CardTitle>
                <CardDescription>
                  Nog geen gegevens beschikbaar.
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
