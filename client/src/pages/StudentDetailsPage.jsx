import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpenText,
  Calendar,
  GraduationCap,
  Home,
  Phone,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// shadcn chart primitives
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, Pie, PieChart, ResponsiveContainer } from 'recharts';

import classAPI from '@/apis/classAPI';
import resultAPI from '@/apis/resultAPI';
import studentAPI from '@/apis/studentAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';
import enrollmentAPI from '@/apis/enrollmentAPI';

// utils
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

function FieldRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex-shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="font-medium break-words text-card-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ---------- small charts, JSX-only ---------- */
function AttendancePie({ late, absent, present }) {
  const data = useMemo(
    () => [
      { name: 'Aanwezig', value: Number(present) || 0, key: 'present', fill: 'hsl(var(--chart-1))' },
      { name: 'Te laat', value: Number(late) || 0, key: 'late', fill: 'hsl(var(--chart-2))' },
      { name: 'Afwezig', value: Number(absent) || 0, key: 'absent', fill: 'hsl(var(--chart-3))' },
    ],
    [late, absent, present]
  );

  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const pct = Math.round(((Number(present) || 0) / total) * 100);

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <ChartContainer config={{}} className="aspect-square w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={88}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold">{pct}%</div>
          <div className="text-xs text-muted-foreground">aanwezig</div>
        </div>
      </div>
    </div>
  );
}

function ResultsSparkline({ points }) {
  if (!points || points.length === 0) {
    return <div className="text-sm text-muted-foreground">Nog geen resultaten.</div>;
  }

  const data = points
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((p) => ({
      x: new Date(p.date).toLocaleDateString('nl-NL'),
      y: Number(p.grade) || 0,
    }));

  const avg =
    Math.round((data.reduce((s, d) => s + d.y, 0) / data.length) * 10) / 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Gemiddelde</p>
          <p className="text-xl font-semibold">{avg}</p>
        </div>
        <Button asChild variant="link" className="px-0">
          <Link to="#resultaten">Bekijk alle resultaten →</Link>
        </Button>
      </div>

      <ChartContainer config={{}} className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <defs>
              <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity="0.35" />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke="hsl(var(--chart-1))"
              fill="url(#spark)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

/* ---------- main ---------- */
export default function StudentDetailsPage() {
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

        if (s && s.class_id) {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-28 bg-muted rounded-md" />
          <div className="h-24 bg-muted rounded-xl" />
          <div className="h-10 bg-muted rounded-md w-full" />
          <div className="h-96 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold">Student niet gevonden</h2>
          <p className="text-muted-foreground mt-2">
            De opgevraagde student kon niet worden gevonden.
          </p>
        </div>
      </div>
    );
  }

  const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ');
  const chips = [
    { label: 'Student', variant: 'secondary' },
    ...(student.lesson_package ? [{ label: `Lespakket ${student.lesson_package}`, variant: 'outline' }] : []),
    {
      label: student.enrollment_status ? 'Ingeschreven' : 'Uitgeschreven',
      variant: student.enrollment_status ? 'default' : 'destructive',
    },
  ];

  const handleToggleEnrollment = async () => {
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

  // attendance buckets, replace with real totals when available
  const late = absences.filter((a) => a.reason === 'Te Laat').length;
  const absent = absences.filter((a) => a.reason !== 'Te Laat').length;
  const present = 0; // set from real attendance source when you have it

  const courseName = klass && klass.course ? klass.course.name : null;

  return (
    <div className="space-y-6">
      {/* page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Terug
          </Button>
          <div className="flex items-center gap-4">
            <div className="size-14 grid place-items-center rounded-full bg-muted text-muted-foreground">
              <User className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight truncate">{fullName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {chips.map((c, i) => (
                  <Badge key={i} variant={c.variant || 'outline'} className="text-xs">
                    {c.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={handleToggleEnrollment} disabled={savingEnroll}>
            {student.enrollment_status ? 'Uitschrijven' : 'Inschrijven'}
          </Button>
          <Link to={`/students/${student.id}/edit`}>
            <Button>Bewerken</Button>
          </Link>
        </div>
      </div>

      {/* meta strip */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Klas:</span> {klass && klass.name ? klass.name : 'Onbekend'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Opleiding:</span> {courseName || 'Onbekend'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Geregistreerd:</span> {fmtDate(student.created_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* overview and deep tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent border-b rounded-none grid grid-cols-3 sm:grid-cols-6">
          {['overzicht', 'resultaten', 'aanwezigheid', 'betalingen', 'voortgang', 'notities'].map((v) => (
            <TabsTrigger
              key={v}
              value={v}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-t-md rounded-b-none py-2.5"
            >
              {v[0].toUpperCase() + v.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERZICHT */}
        <TabsContent value="overzicht" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* voortgang placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Voortgang</CardTitle>
                <CardDescription>Overzicht van leer voortgang.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-3xl font-bold">—</div>
                  <div className="h-2 w-full rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: '0%' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">Nog geen voortgangsgegevens.</p>
                  <Button variant="link" className="px-0" onClick={() => setTab('voortgang')}>
                    Bekijk voortgangsdetails →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* recente resultaten with sparkline */}
            <Card id="resultaten">
              <CardHeader className="pb-3">
                <CardTitle>Recente Resultaten</CardTitle>
                <CardDescription>Laatste cijfers en trend.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResultsSparkline
                  points={(results || []).map((r) => ({
                    date: r.date,
                    grade: r.grade,
                  }))}
                />
              </CardContent>
            </Card>

            {/* attendance pie */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Aanwezigheid</CardTitle>
                <CardDescription>Afwezigheidssamenvatting.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <AttendancePie late={late} absent={absent} present={present} />
                <div className="min-w-[140px] space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Te laat</span>
                    <span className="font-medium">{late}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Afwezig</span>
                    <span className="font-medium">{absent}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aanwezig*</span>
                    <span className="font-medium">{present}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">* Indicatief zolang totaal lessen onbekend is.</p>
                  <Button variant="link" className="px-0" onClick={() => setTab('aanwezigheid')}>
                    Bekijk aanwezigheid →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* notities */}
            <Card>
              <CardHeader>
                <CardTitle>Notities</CardTitle>
                <CardDescription>Persoonlijke notities en opmerkingen.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Geen notities gevonden.</p>
                  <Button size="sm" variant="default" disabled>
                    + Nieuwe notitie
                  </Button>
                </div>
                <Button variant="link" className="px-0 mt-2" onClick={() => setTab('notities')}>
                  Bekijk alles →
                </Button>
              </CardContent>
            </Card>

            {/* betalingen */}
            <Card>
              <CardHeader>
                <CardTitle>Betalingen</CardTitle>
                <CardDescription>Overzicht van lesgeldbetalingen.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">Geen betalingen gevonden.</div>
                </div>
                <Button variant="link" className="px-0 mt-2" onClick={() => setTab('betalingen')}>
                  Beheer betalingen →
                </Button>
              </CardContent>
            </Card>

            {/* studentgegevens */}
            <Card>
              <CardHeader>
                <CardTitle>Studentgegevens</CardTitle>
                <CardDescription>Contact en persoonlijke gegevens.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <FieldRow icon={<Phone size={16} />} label="Telefoon" value={student.phone} />
                  <FieldRow
                    icon={<Home size={16} />}
                    label="Adres"
                    value={
                      student.address
                        ? `${student.address}, ${student.postal_code || ''} ${student.city || ''}`.trim()
                        : undefined
                    }
                  />
                  <FieldRow
                    icon={<Calendar size={16} />}
                    label="Geboortedatum"
                    value={fmtDate(student.birth_date)}
                  />
                </div>
                <div className="mt-3">
                  <Link to={`/students/${student.id}/edit`}>
                    <Button size="sm" variant="outline">Bewerk gegevens</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* detail tabs */}
        <TabsContent value="resultaten" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resultaten</CardTitle>
              <CardDescription>Behaalde cijfers voor deze student.</CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen resultaten gevonden.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beoordeling</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Cijfer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.assessment?.name || r.assessment_id}</TableCell>
                        <TableCell>{fmtDate(r.date)}</TableCell>
                        <TableCell className="text-right">{r.grade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aanwezigheid" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aanwezigheid</CardTitle>
              <CardDescription>Afwezigheidsregistraties voor deze student.</CardDescription>
            </CardHeader>
            <CardContent>
              {absences.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen registraties gevonden.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Les</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absences.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{fmtDate(a.date)}</TableCell>
                        <TableCell>
                          {a.roster?.subject?.name || 'Onbekend vak'}
                          {a.roster?.class_layout?.name ? ` • ${a.roster.class_layout.name}` : ''}
                        </TableCell>
                        <TableCell className="text-right">{a.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="betalingen" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Betalingen</CardTitle>
              <CardDescription>Overzicht van lesgeldbetalingen.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Geen betalingen gevonden.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voortgang" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Voortgang</CardTitle>
              <CardDescription>Overzicht van leer voortgang.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Geen voortgangsgegevens gevonden.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notities</CardTitle>
              <CardDescription>Persoonlijke notities en opmerkingen.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Geen notities gevonden.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
