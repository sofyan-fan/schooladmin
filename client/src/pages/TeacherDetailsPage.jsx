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
import classAPI from '@/apis/classAPI';
import rosterAPI from '@/apis/rosterAPI';
import subjectAPI from '@/apis/subjectAPI';
import classroomAPI from '@/apis/classroomAPI';
import teachersAPI from '@/apis/teachersAPI';
import { Badge } from '@/components/ui/badge';
import { User, ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const EN_TO_NL_DAY = {
  Monday: 'Maandag',
  Tuesday: 'Dinsdag',
  Wednesday: 'Woensdag',
  Thursday: 'Donderdag',
  Friday: 'Vrijdag',
  Saturday: 'Zaterdag',
  Sunday: 'Zondag',
};

const NUM_TO_NL_DAY = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
};

function getDayLabel(dayOfWeek) {
  if (!dayOfWeek) return '—';
  const num = parseInt(dayOfWeek, 10);
  if (!Number.isNaN(num)) {
    return NUM_TO_NL_DAY[num] || '—';
  }
  return EN_TO_NL_DAY[dayOfWeek] || dayOfWeek;
}

function diffHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + (sm || 0);
  const end = eh * 60 + (em || 0);
  const minutes = Math.max(0, end - start);
  return minutes / 60;
}

export default function TeacherDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const teacherId = Number(id);

  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [klass, setKlass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teacherRosters, setTeacherRosters] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setTeacher(null);
      try {
        const t = await teachersAPI.get_teacher_by_id(teacherId);
        if (!mounted) return;
        setTeacher(t);

        // Resolve mentor class (if any)
        const mentorClass =
          Array.isArray(t?.class_layout) ? t.class_layout[0] : t?.class_layout;
        if (mentorClass?.id) {
          const cl = await classAPI.get_class(mentorClass.id);
          if (mounted) setKlass(cl);
        }

        const [allRosters, allSubjects, allClasses, allClassrooms] =
          await Promise.all([
            rosterAPI.get_rosters(),
            subjectAPI.get_subjects(),
            classAPI.get_classes(),
            classroomAPI.getClassrooms(),
          ]);
        if (!mounted) return;

        const filtered = (allRosters || []).filter(
          (r) =>
            Number(r.teacher_id) === teacherId ||
            Number(r?.teacher?.id) === teacherId
        );
        setTeacherRosters(filtered);
        setSubjects(allSubjects || []);
        setClasses(allClasses || []);
        setClassrooms(allClassrooms || []);
      } catch (e) {
        console.error('Failed to load teacher details', e);
        setTeacher(null);
        setTeacherRosters([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!Number.isNaN(teacherId)) {
      run();
    }
    return () => {
      mounted = false;
    };
  }, [teacherId]);

  const lessonRows = useMemo(() => {
    const byId = (arr, id) => arr.find((x) => Number(x?.id) === Number(id));
    return (teacherRosters || []).map((r) => {
      const subjectName = r?.subject?.name || byId(subjects, r.subject_id)?.name || '—';
      const className =
        r?.class_layout?.name || byId(classes, r.class_id)?.name || '—';
      const classroomName =
        r?.classroom?.name || byId(classrooms, r.classroom_id)?.name || '—';
      const start = r.start_time || (r.start ? new Date(r.start).toTimeString().slice(0,5) : '');
      const end = r.end_time || (r.end ? new Date(r.end).toTimeString().slice(0,5) : '');
      return {
        id: r.id,
        day: getDayLabel(r.day_of_week),
        time: start && end ? `${start} - ${end}` : '—',
        subject: subjectName,
        className,
        classroom: classroomName,
        hours: diffHours(start, end),
      };
    });
  }, [teacherRosters, subjects, classes, classrooms]);

  const weeklyHours = useMemo(
    () => lessonRows.reduce((sum, r) => sum + (r.hours || 0), 0),
    [lessonRows]
  );

  const salary = useMemo(() => {
    const hourlyRate = 30; // dummy
    const weekly = Math.round(weeklyHours * hourlyRate);
    const monthly = weekly * 4;
    return { hourlyRate, weekly, monthly };
  }, [weeklyHours]);

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

  if (!teacher) {
    return (
      <div className="mx-auto max-w-[1200px] px-2 sm:px-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold">Docent niet gevonden</h2>
          <p className="mt-2 text-muted-foreground">
            De opgevraagde docent kon niet worden gevonden.
          </p>
        </div>
      </div>
    );
  }

  const fullName = [teacher.first_name, teacher.last_name].filter(Boolean).join(' ');
  const mentorClassName =
    klass?.name ||
    (Array.isArray(teacher.class_layout)
      ? teacher.class_layout[0]?.name
      : teacher.class_layout?.name) ||
    '—';

  return (
    <div className="w-full space-y-6 px-2 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar docenten
          </Button>

          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/70">
              <User className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {fullName || 'Docent'}
              </h1>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant={teacher.active ? 'default' : 'destructive'}>
                  {teacher.active ? 'Actief' : 'Inactief'}
                </Badge>
                {teacher.email ? (
                  <Badge variant="outline">{teacher.email}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mentorklas</CardTitle>
            <CardDescription>De klas waar deze docent mentor van is.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg">{mentorClassName}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salaris (dummy)</CardTitle>
            <CardDescription>Eenvoudige schatting op basis van rooster.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-base">
              <div className="flex items-center justify-between">
                <span>Uren per week</span>
                <span className="font-medium">{weeklyHours.toFixed(2)} u</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Uurtarief</span>
                <span className="font-medium">€ {salary.hourlyRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Per week (schatting)</span>
                <span className="font-semibold">€ {salary.weekly}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Per maand (schatting)</span>
                <span className="font-semibold">€ {salary.monthly}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>Basisgegevens van de docent.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-base">
              <div className="flex items-center justify-between">
                <span>E-mail</span>
                <span className="font-medium">{teacher.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Telefoon</span>
                <span className="font-medium">{teacher.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Adres</span>
                <span className="font-medium">{teacher.address || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roosterlessen</CardTitle>
          <CardDescription>Alle lessen gekoppeld aan deze docent.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="text-lg">
                <TableHead>Dag</TableHead>
                <TableHead>Tijd</TableHead>
                <TableHead>Vak</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Lokaal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-base">
              {lessonRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.day}</TableCell>
                  <TableCell>{r.time}</TableCell>
                  <TableCell>{r.subject}</TableCell>
                  <TableCell>{r.className}</TableCell>
                  <TableCell>{r.classroom}</TableCell>
                </TableRow>
              ))}
              {lessonRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Geen lessen gevonden in het rooster.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


