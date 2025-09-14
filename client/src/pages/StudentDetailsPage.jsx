import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'; // shadcn tabs
import {
  Calendar, Home, Mail, Phone, User, ArrowLeft, ArrowRight, GraduationCap, BookOpenText,
} from 'lucide-react';

import studentAPI from '@/apis/studentAPI';
import classLayoutAPI from '@/apis/classAPI'; 
import resultsAPI from '@/apis/resultAPI';
import enrollmentAPI from '@/apis/enrollmentAPI';

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

function FieldRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default function StudentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [klass, setKlass] = useState(null);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState('overzicht');
  const [savingEnroll, setSavingEnroll] = useState(false);

  // fetch data
  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      try {
        const s = await studentAPI.get_student_by_id(id);
        if (!mounted) return;

        setStudent(s);

        if (s?.class_id) {
          const cl = await classLayoutAPI.get_class_layout(s.class_id);
          if (!mounted) return;
          setKlass(cl);
        }

        const allResults = await resultsAPI.get_all_results();
        if (!mounted) return;
        const mine = (allResults || []).filter(r => r.student_id === Number(id));
        setResults(mine);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => { mounted = false; };
  }, [id]);

  const fullName = useMemo(() => {
    if (!student) return '';
    return [student.first_name, student.last_name].filter(Boolean).join(' ');
  }, [student]);

  const chips = useMemo(() => {
    const out = [];
    if (klass?.name) out.push({ label: klass.name });
    if (student?.lesson_package) out.push({ label: `Lespakket ${student.lesson_package}` });
    out.push({ label: student?.enrollment_status ? 'Ingeschreven' : 'Niet ingeschreven', variant: student?.enrollment_status ? 'secondary' : 'outline' });
    return out;
  }, [klass, student]);

  const courseName = klass?.course?.name;
  const mentorName = klass?.mentor ? `${klass.mentor.first_name} ${klass.mentor.last_name}` : null;

  const handleToggleEnrollment = async () => {
    if (!student) return;
    try {
      setSavingEnroll(true);
      const updated = await enrollmentAPI.toggle_enrollment(student.id, !student.enrollment_status);
      setStudent(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingEnroll(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Terug
          </Button>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded-md w-1/3" />
          <div className="h-32 bg-muted rounded-md" />
          <div className="h-96 bg-muted rounded-md" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>
        <p className="text-destructive mt-6">Student niet gevonden.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back and actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleToggleEnrollment} disabled={savingEnroll}>
            {student.enrollment_status ? 'Uitschrijven' : 'Inschrijven'}
          </Button>
          <Link to={`/students/${student.id}/edit`}>
            <Button variant="default">Bewerken</Button>
          </Link>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-16 rounded-full bg-muted grid place-items-center ring-2 ring-muted-foreground/20">
              <User className="size-7 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl font-semibold leading-tight truncate">{fullName}</div>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Badge variant="secondary" className="text-sm px-2.5 py-0.5">Student</Badge>
                {chips.map((c, i) => (
                  <Badge key={i} variant={c.variant || 'outline'} className="text-sm px-2.5 py-0.5">
                    {c.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground">
            {klass?.name && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span><span className="text-foreground font-medium">Klas:</span> {klass.name}</span>
              </div>
            )}
            {courseName && (
              <div className="flex items-center gap-2">
                <BookOpenText className="h-4 w-4" />
                <span><span className="text-foreground font-medium">Opleiding:</span> {courseName}</span>
              </div>
            )}
            {mentorName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span><span className="text-foreground font-medium">Mentor:</span> {mentorName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span><span className="text-foreground font-medium">Geregistreerd:</span> {fmtDate(student.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="resultaten">Resultaten</TabsTrigger>
          <TabsTrigger value="aanwezigheid" disabled>
            Aanwezigheid
          </TabsTrigger>
          <TabsTrigger value="betalingen" disabled>
            Betalingen
          </TabsTrigger>
          <TabsTrigger value="voortgang" disabled>
            Voortgang
          </TabsTrigger>
          <TabsTrigger value="notities" disabled>
            Notities
          </TabsTrigger>
        </TabsList>

        {/* Overzicht */}
        <TabsContent value="overzicht">
          <div className="grid gap-6 sm:grid-cols-12">
            <section className="sm:col-span-7 space-y-3 rounded-xl border bg-white p-5">
              <h3 className="text-base font-medium text-muted-foreground">Contact</h3>
              <FieldRow icon={<Mail size={18} />} label="E-mail" value={student.email} />
              <FieldRow icon={<Phone size={18} />} label="Telefoon" value={student.phone} />
              <FieldRow
                icon={<Home size={18} />}
                label="Adres"
                value={`${student.address}, ${student.postal_code} ${student.city}`}
              />
            </section>

            <section className="sm:col-span-5 space-y-3 rounded-xl border bg-white p-5">
              <h3 className="text-base font-medium text-muted-foreground">Persoonlijk</h3>
              <FieldRow icon={<Calendar size={18} />} label="Geboortedatum" value={fmtDate(student.birth_date)} />
              <FieldRow icon={<User size={18} />} label="Geslacht" value={student.gender} />
              {student.lesson_package && (
                <FieldRow icon={<BookOpenText size={18} />} label="Lespakket" value={student.lesson_package} />
              )}
            </section>
          </div>
        </TabsContent>

        {/* Resultaten */}
        <TabsContent value="resultaten">
          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium">Resultaten</h3>
              <Link to={`/students/${student.id}/results`}>
                <Button variant="link" className="px-0">
                  Volledig resultatenoverzicht <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nog geen resultaten.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Datum</th>
                      <th className="py-2 pr-4">Beoordeling</th>
                      <th className="py-2 pr-4">Toets</th>
                      <th className="py-2 pr-4">Klas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .slice()
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="py-2 pr-4">{fmtDate(r.date)}</td>
                          <td className="py-2 pr-4 font-medium">{r.grade?.toFixed?.(2) ?? r.grade}</td>
                          <td className="py-2 pr-4">{r.assessment?.name ?? '—'}</td>
                          <td className="py-2 pr-4">{r.assessment?.class_layout?.name ?? klass?.name ?? '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
