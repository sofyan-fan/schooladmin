import {
  ArrowLeft, ArrowRight, BookOpenText, Calendar, CreditCard, GraduationCap, Home, Notebook, Phone, TrendingUp, User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
   ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@/components/ui/chart';
import { Pie, PieChart } from 'recharts'; // shadcn/charts still uses recharts primitives

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import classAPI from '@/apis/classAPI';
import enrollmentAPI from '@/apis/enrollmentAPI';
import resultAPI from '@/apis/resultAPI';
import studentAPI from '@/apis/studentAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';

const fmtDate = (d) => (d ? new Date(d).toLocaleString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A');

// Reusable component for secondary dashboard cards to keep code DRY
const StatCard = ({
  icon, title, description, tab, setTab,
}) => (
  <Card className="flex flex-col">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="flex-grow flex items-center">
      <p className="text-sm text-muted-foreground">Geen gegevens beschikbaar.</p>
    </CardContent>
    <CardFooter>
      <Button variant="link" className="px-0 text-primary" onClick={() => setTab(tab)}>
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
      setLoading(true); setStudent(null);
      try {
        const s = await studentAPI.get_student_by_id(id);
        if (!mounted) return; setStudent(s);
        if (s?.class_id) {
          const cl = await classAPI.get_class(s.class_id);
          if (!mounted) return; setKlass(cl);
        }
        const [allResults, allAbsences] = await Promise.all([resultAPI.get_results(), absenceAPI.getAllAbsences()]);
        if (!mounted) return;
        const studentIdNum = Number(id);
        setResults((allResults || []).filter((r) => r.student_id === studentIdNum));
        setAbsences((allAbsences || []).filter((a) => a.student_id === studentIdNum));
      } catch (e) {
        console.error(e); setStudent(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [id]);

  const studentStats = useMemo(() => {
    if (!student) return null;

    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastResult = sortedResults[0] ?? null;
    const averageGrade = results.length > 0 ? (results.reduce((sum, r) => sum + (Number(r.grade) || 0), 0) / results.length).toFixed(1) : null;

    const totalAbsences = absences.length;
    const lateCount = absences.filter((a) => a.reason === 'Te Laat').length;
    const absentCount = totalAbsences - lateCount;
    
    const totalClassesAttended = 30; 
    const presentCount = Math.max(0, totalClassesAttended - totalAbsences);

    return {
      fullName: [student.first_name, student.last_name].filter(Boolean).join(' '),
      chips: [
          ...(student.lesson_package ? [{ label: `Lespakket ${student.lesson_package}` }] : []),
          { label: student.enrollment_status ? 'Ingeschreven' : 'Uitgeschreven', variant: student.enrollment_status ? 'default' : 'destructive' },
      ],
      courseName: klass?.course?.name,
      lastResult,
      averageGrade,
      attendance: {
        lateCount,
        absentCount,
        chartData: [
            { name: 'present', value: presentCount, fill: 'var(--color-present)' },
            { name: 'late', value: lateCount, fill: 'var(--color-late)' },
            { name: 'absent', value: absentCount, fill: 'var(--color-absent)' },
        ],
      },
    };
  }, [student, results, absences, klass]);
  
  // --- THIS IS THE FIX ---
  // Removed the TypeScript `satisfies` operator. This is now standard JavaScript.
  const chartConfig = {
      present: { label: 'Aanwezig', color: 'hsl(var(--chart-1))' },
      late: { label: 'Te Laat', color: 'hsl(var(--chart-3))' },
      absent: { label: 'Afwezig', color: 'hsl(var(--destructive))' },
  };

  const handleToggleEnrollment = async () => {
    if (!student) return;
    try {
      setSavingEnroll(true);
      const updated = await enrollmentAPI.toggle_enrollment(student.id, !student.enrollment_status);
      setStudent(updated);
    } catch(e) { console.error(e); } finally { setSavingEnroll(false); }
  };

  if (loading) { return <div>Loading...</div>; }
  if (!student || !studentStats) { return <div>Student not found.</div>; }

  const TABS_CONFIG = [
    { value: 'overzicht', label: 'Overzicht' },
    { value: 'resultaten', label: 'Resultaten' },
    { value: 'aanwezigheid', label: 'Aanwezigheid' },
    { value: 'betalingen', label: 'Betalingen' },
    { value: 'voortgang', label: 'Voortgang' },
    { value: 'notities', label: 'Notities' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" className="mb-2 -ml-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar studenten
          </Button>
          <div className="flex items-center gap-4">
            <div className="size-16 flex-shrink-0 rounded-full bg-muted grid place-items-center">
              <User className="size-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold leading-tight">{studentStats.fullName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Student</Badge>
                {studentStats.chips.map((c, i) => (
                  <Badge key={i} variant={c.variant || 'outline'}>{c.label}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleEnrollment} disabled={savingEnroll}>
            {student.enrollment_status ? 'Uitschrijven' : 'Inschrijven'}
          </Button>
          <Link to={`/students/${student.id}/edit`}><Button>Bewerken</Button></Link>
        </div>
      </div>
      
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-0 bg-transparent border-b rounded-none">
            {TABS_CONFIG.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-t-md rounded-b-none py-2.5">{label}</TabsTrigger>
            ))}
        </TabsList>

        <TabsContent value="overzicht" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Recente Resultaten</CardTitle><CardDescription>Laatste cijfers en algemeen gemiddelde.</CardDescription></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="flex flex-col justify-center items-center p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Laatste Cijfer</p>
                  <p className="text-5xl font-bold tracking-tight mt-1">{studentStats.lastResult?.grade ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{studentStats.lastResult ? fmtDate(studentStats.lastResult.date) : 'Nog geen resultaten'}</p>
                </div>
                <div className="flex flex-col justify-center items-center p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Gemiddelde</p>
                  <p className="text-5xl font-bold tracking-tight mt-1">{studentStats.averageGrade ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">Gebaseerd op {results.length} resultaten</p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader><CardTitle>Aanwezigheid</CardTitle><CardDescription>Samenvatting.</CardDescription></CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center items-center gap-4">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[120px]">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
                    <Pie data={studentStats.attendance.chartData} dataKey="value" nameKey="name" innerRadius={40} strokeWidth={5} />
                  </PieChart>
                </ChartContainer>
                <div className="flex justify-around w-full text-center">
                    <div><p className="text-2xl font-bold">{studentStats.attendance.lateCount}</p><p className="text-xs text-muted-foreground">Te Laat</p></div>
                    <div><p className="text-2xl font-bold">{studentStats.attendance.absentCount}</p><p className="text-xs text-muted-foreground">Afwezig</p></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Studentgegevens</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3"><Phone size={16} className="text-muted-foreground flex-shrink-0" /><p className="truncate">{student.phone}</p></div>
                <div className="flex items-start gap-3"><Home size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" /><p>{`${student.address}, ${student.postal_code} ${student.city}`}</p></div>
                <div className="flex items-center gap-3"><Calendar size={16} className="text-muted-foreground flex-shrink-0" /><p>{fmtDate(student.birth_date)}</p></div>
                <div className="flex items-center gap-3"><GraduationCap size={16} className="text-muted-foreground flex-shrink-0" /><p>Klas: {klass?.name ?? 'N.v.t.'}</p></div>
              </CardContent>
              <CardFooter>
                 <Link to={`/students/${student.id}/edit`}><Button variant="outline" size="sm">Bewerk gegevens</Button></Link>
              </CardFooter>
            </Card>

            <StatCard icon={<TrendingUp size={20} />} title="Voortgang" description="Overzicht van leer voortgang." tab="voortgang" setTab={setTab} />
            <StatCard icon={<CreditCard size={20} />} title="Betalingen" description="Status van lesgeldbetalingen." tab="betalingen" setTab={setTab} />
            <StatCard icon={<Notebook size={20} />} title="Notities" description="Persoonlijke opmerkingen." tab="notities" setTab={setTab} />
          </div>
        </TabsContent>

        <TabsContent value="resultaten" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Alle Resultaten</CardTitle><CardDescription>Overzicht van alle behaalde cijfers.</CardDescription></CardHeader>
              <CardContent>{/* Your results table JSX goes here */}</CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="aanwezigheid" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Alle Aanwezigheidsregistraties</CardTitle><CardDescription>Gedetailleerd overzicht van alle registraties.</CardDescription></CardHeader>
              <CardContent>{/* Your absence table JSX goes here */}</CardContent>
            </Card>
        </TabsContent>
        
        {/* Cleaner placeholder tabs */}
        {['betalingen', 'voortgang', 'notities'].map((tabValue) => (
             <TabsContent key={tabValue} value={tabValue} className="mt-6">
                <Card>
                    <CardHeader><CardTitle className="capitalize">{tabValue}</CardTitle></CardHeader>
                    <CardContent><p>Geen {tabValue} gevonden.</p></CardContent>
                </Card>
            </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}