import schoolyearDummyAPI from '@/apis/schoolyearDummyAPI';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  BookCheck,
  CalendarDays,
  GraduationCap,
  Layers,
  ScrollText,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function SummaryCard({ title, icon, variant = 'default', onClick }) {
  const variantClasses = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-[#9bcf38]/80 text-white',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
  };
  const iconClasses =
    variantClasses[variant] || variantClasses.default;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
    >
      <Card className="h-[140px] p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
        <div className="flex flex-row items-center gap-5 h-full">
          <div
            className={`hidden md:hidden lg:flex p-4 rounded-full items-center justify-center ${iconClasses}`}
          >
            {icon}
          </div>
          <div className="flex flex-col justify-center h-full gap-2">
            <p className="text-xl font-medium text-regular">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">
              Klik om {title.toLowerCase()} te bekijken
            </p>
          </div>
        </div>
      </Card>
    </button>
  );
}

export default function SchoolYearDummyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const yearId = Number(id);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(null);

  useEffect(() => {
    if (!yearId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const payload = await schoolyearDummyAPI.getById(yearId);
        if (cancelled) return;
        setData(payload || null);
      } catch (err) {
        console.error('Failed to load dummy school year detail', err);
        if (!cancelled) {
          setError(
            'Kon de dummy-gegevens van dit schooljaar niet laden.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [yearId]);

  const year = data?.schoolYear || null;
  const classes = data?.classes || [];
  const teachers = data?.teachers || [];
  const students = data?.students || [];
  const subjects = data?.subjects || [];
  const assessments = data?.assessments || [];
  const results = data?.results || [];
  const financialLogs = data?.financial_logs || [];

  const title = year?.name || `Dummy-schooljaar ${yearId}`;
  const statusLabel = year?.is_archived
    ? 'Gearchiveerd (dummy)'
    : year?.is_active
    ? 'Actief (dummy)'
    : 'Inactief (dummy)';

  const statusVariant = year
    ? year.is_active
      ? 'default'
      : year.is_archived
      ? 'outline'
      : 'secondary'
    : 'secondary';

  const studentsPerClass = useMemo(() => {
    const map = new Map();
    for (const c of classes) {
      map.set(c.id, []);
    }
    for (const s of students) {
      if (!map.has(s.class_id)) map.set(s.class_id, []);
      map.get(s.class_id).push(s);
    }
    return map;
  }, [classes, students]);

  const subjectNameById = useMemo(() => {
    const map = new Map();
    for (const s of subjects) map.set(s.id, s.name);
    return map;
  }, [subjects]);

  const classNameById = useMemo(() => {
    const map = new Map();
    for (const c of classes) map.set(c.id, c.name);
    return map;
  }, [classes]);

  const teacherNameById = useMemo(() => {
    const map = new Map();
    for (const t of teachers) {
      map.set(t.id, `${t.first_name} ${t.last_name}`);
    }
    return map;
  }, [teachers]);

  const assessmentsWithNames = useMemo(
    () =>
      assessments.map((a) => ({
        ...a,
        className: classNameById.get(a.class_id) || `Klas ${a.class_id}`,
        subjectName: subjectNameById.get(a.subject_id) || `Vak ${a.subject_id}`,
      })),
    [assessments, classNameById, subjectNameById]
  );

  const uniqueSubjectNames = useMemo(() => {
    const names = new Set();
    assessmentsWithNames.forEach((a) => {
      if (a.subjectName) names.add(a.subjectName);
    });
    return Array.from(names);
  }, [assessmentsWithNames]);

  const resultsWithNames = useMemo(() => {
    const assessmentById = new Map(
      assessments.map((a) => [a.id, a])
    );
    const studentById = new Map(
      students.map((s) => [s.id, s])
    );
    return results.map((r) => {
      const a = assessmentById.get(r.assessment_id);
      const s = studentById.get(r.student_id);
      return {
        ...r,
        assessmentName: a?.name || `Beoordeling ${r.assessment_id}`,
        studentName: s ? `${s.first_name} ${s.last_name}` : `Leerling ${r.student_id}`,
      };
    });
  }, [results, assessments, students]);

  const incomeLogs = useMemo(
    () => (financialLogs || []).filter((l) => l.transaction_type === 'income'),
    [financialLogs]
  );
  const expenseLogs = useMemo(
    () => (financialLogs || []).filter((l) => l.transaction_type === 'expense'),
    [financialLogs]
  );

  const totalIncome = useMemo(
    () => incomeLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
    [incomeLogs]
  );
  const totalExpense = useMemo(
    () => expenseLogs.reduce((sum, l) => sum + (Number(l.amount) || 0), 0),
    [expenseLogs]
  );

  return (
    <>
      <PageHeader
        title={title}
        icon={<CalendarDays className="size-9" />}
        description="Fictief schooljaar gevuld met historische dummy-data. Dit heeft geen impact op de echte administratie."
        extra={
          <div className="flex items-center gap-3">
            {year && (
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/school-jaar-dummy')}
              className="inline-flex items-center gap-2"
            >
              <ArrowLeft className="size-4" />
              Terug naar overzicht
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Leerlingen"
          icon={<Users className="h-8 w-8" />}
          variant="success"
          onClick={() => setOpenDialog('students')}
        />
        <SummaryCard
          title="Leraren"
          icon={<GraduationCap className="h-8 w-8" />}
          onClick={() => setOpenDialog('teachers')}
        />
        <SummaryCard
          title="Klassen"
          icon={<Layers className="h-8 w-8" />}
          onClick={() => setOpenDialog('classes')}
        />
        <SummaryCard
          title="Vakken"
          icon={<ScrollText className="h-8 w-8" />}
          onClick={() => setOpenDialog('subjects')}
        />
        <SummaryCard
          title="Toetsen & Examens"
          icon={<BookCheck className="h-8 w-8" />}
          variant="warning"
          onClick={() => setOpenDialog('assessments')}
        />
        <SummaryCard
          title="Resultaten"
          icon={<BarChart3 className="h-8 w-8" />}
          onClick={() => setOpenDialog('results')}
        />
        <SummaryCard
          title="Financiële historie"
          icon={<Banknote className="h-8 w-8" />}
          variant="danger"
          onClick={() => setOpenDialog('finance')}
        />
      </div>

      {/* Leerlingen */}
      <Dialog
        open={openDialog === 'students'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="900px">
          <DialogHeader>
            <DialogTitle>Leerlingen in {title}</DialogTitle>
            <DialogDescription>
              Fictieve leerlingen gekoppeld aan de dummy-klassen.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Stad</TableHead>
                <TableHead>Lespakket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const clsName =
                  classNameById.get(s.class_id) || `Klas ${s.class_id}`;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {s.first_name} {s.last_name}
                    </TableCell>
                    <TableCell>{clsName}</TableCell>
                    <TableCell>{s.city}</TableCell>
                    <TableCell>{s.lesson_package}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Leraren */}
      <Dialog
        open={openDialog === 'teachers'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="800px">
          <DialogHeader>
            <DialogTitle>Leraren in {title}</DialogTitle>
            <DialogDescription>
              Fictieve docenten die in het dummyjaar gekoppeld zijn.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Uurtarief</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {t.first_name} {t.last_name}
                  </TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.address}</TableCell>
                  <TableCell>
                    {typeof t.compensation === 'number'
                      ? `€ ${t.compensation.toFixed(2)}`
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Klassen */}
      <Dialog
        open={openDialog === 'classes'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="800px">
          <DialogHeader>
            <DialogTitle>Klassen in {title}</DialogTitle>
            <DialogDescription>
              Fictieve klassen, mentoren en leerlingenaantallen.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klas</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Leerlingen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => {
                const mentorName = teacherNameById.get(c.mentor_id) || '-';
                const count = (studentsPerClass.get(c.id) || []).length;
                return (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{mentorName}</TableCell>
                    <TableCell>{count}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Vakken */}
      <Dialog
        open={openDialog === 'subjects'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="600px">
          <DialogHeader>
            <DialogTitle>Vakken in {title}</DialogTitle>
            <DialogDescription>
              Fictieve vakken die in dit schooljaar zijn aangeboden.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Toetsen & examens */}
      <Dialog
        open={openDialog === 'assessments'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="900px">
          <DialogHeader>
            <DialogTitle>Toetsen & examens in {title}</DialogTitle>
            <DialogDescription>
              Fictieve beoordelingen uit het dummyjaar.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Vak</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentsWithNames.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.className}</TableCell>
                  <TableCell>{a.subjectName}</TableCell>
                  <TableCell>{a.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Resultaten */}
      <Dialog
        open={openDialog === 'results'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="900px">
          <DialogHeader>
            <DialogTitle>Resultaten in {title}</DialogTitle>
            <DialogDescription>
              Fictieve cijfers per leerling en beoordeling.
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leerling</TableHead>
                <TableHead>Beoordeling</TableHead>
                <TableHead>Cijfer</TableHead>
                <TableHead>Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultsWithNames.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell>{r.assessmentName}</TableCell>
                  <TableCell>{r.grade.toFixed(1)}</TableCell>
                  <TableCell>{r.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Financiële historie */}
      <Dialog
        open={openDialog === 'finance'}
        onOpenChange={(open) => !open && setOpenDialog(null)}
      >
        <DialogContent maxWidth="900px">
          <DialogHeader>
            <DialogTitle>Financiële transacties in {title}</DialogTitle>
            <DialogDescription>
              Fictieve inkomsten en uitgaven in het dummyjaar.
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Inkomsten</div>
              <div className="text-lg font-semibold">
                € {totalIncome.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Uitgaven</div>
              <div className="text-lg font-semibold">
                € {totalExpense.toFixed(2)}
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.transaction_type}</TableCell>
                  <TableCell>{log.type}</TableCell>
                  <TableCell>{log.date}</TableCell>
                  <TableCell className="text-right">
                    € {Number(log.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}


