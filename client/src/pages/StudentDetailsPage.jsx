import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import AanwezigheidTab from '@/pages/students/AanwezigheidTab';
import GegevensTab from '@/pages/students/GegevensTab';
import OverviewTab from '@/pages/students/OverviewTab';
import VoortgangTab from '@/pages/students/VoortgangTab';
import { ArrowLeft, ArrowUpDown, Download, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import ComboboxField from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import { X } from 'lucide-react';

import classAPI from '@/apis/classAPI';
import enrollmentAPI from '@/apis/enrollmentAPI';
import financeAPI from '@/apis/financeAPI';
import moduleAPI from '@/apis/moduleAPI';
import RequestHandler from '@/apis/RequestHandler';
import resultAPI from '@/apis/resultAPI';
import rosterAPI from '@/apis/rosterAPI';
import studentAPI from '@/apis/studentAPI';
import studentNoteAPI from '@/apis/studentNoteAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';
import NotitiesTab from '@/pages/students/NotitiesTab';
import ExportDialog from '@/utils/ExportDialog';
import exportScheduleToPDF from '@/utils/exportScheduleToPDF';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const normalizePaymentMethod = (method) => {
  if (!method) return 'Onbekend';
  const m = String(method).toLowerCase();
  if (m === 'ideal' || m === 'bank') return 'Bank';
  if (m === 'cash' || m === 'contant') return 'Contant';
  return method;
};

const dayNameToNumber = (dayName) => {
  const days = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };
  return days[dayName] || 1;
};

const rosterDayToNumber = (raw) => {
  if (raw === null || raw === undefined) return null;
  const parsed = parseInt(raw, 10);
  if (!Number.isNaN(parsed)) return parsed === 0 ? 7 : parsed;
  return dayNameToNumber(String(raw));
};

const jsDayToMon1Sun7 = (jsDay) => (jsDay === 0 ? 7 : jsDay);

const timeLabelFromValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    // e.g. "09:00:00" or "09:00"
    if (value.includes(':') && value.length >= 5) return value.slice(0, 5);
  }
  try {
    const dt = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
};

const computeAttendanceData = ({ rosters, absences, days = 30 }) => {
  const rosterArr = Array.isArray(rosters) ? rosters : [];
  const absArr = Array.isArray(absences) ? absences : [];

  const end = new Date();
  end.setHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(days - 1, 0));
  start.setHours(12, 0, 0, 0);

  const rows = [];

  // If there is no roster, we can still show recorded absences (no "present" inference).
  if (rosterArr.length === 0 && absArr.length > 0) {
    const mapped = absArr
      .map((a, idx) => {
        const reason = a?.reason || '';
        const normalizedReason = String(reason).toLowerCase();
        let status = 'absent';
        if (normalizedReason.includes('te laat')) status = 'late';
        else if (normalizedReason.includes('ziek')) status = 'sick';
        else status = 'absent';

        const date = a?.date ? new Date(a.date) : null;

        return {
          key: `abs-${a?.id ?? idx}`,
          date,
          rosterId: a?.roster_id ?? null,
          lessonName: 'Les',
          className: '',
          startTime: '',
          endTime: '',
          status,
          reason,
        };
      })
      .filter((r) => !r.date || (r.date >= start && r.date <= end));

    mapped.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    const totals = {
      total: mapped.length,
      present: 0,
      late: mapped.filter((r) => r.status === 'late').length,
      sick: mapped.filter((r) => r.status === 'sick').length,
      absent: mapped.filter((r) => r.status === 'absent').length,
    };
    const absentCombined = totals.absent + totals.sick;
    const donutTotal = Math.max(
      totals.present + totals.late + absentCombined,
      1
    );
    const presentPct = Math.round((totals.present / donutTotal) * 100);

    return {
      stats: {
        present: totals.present,
        late: totals.late,
        absent: absentCombined,
        presentPct,
        donutData: [
          {
            name: 'present',
            value: totals.present,
            fill: 'var(--color-present)',
          },
          { name: 'late', value: totals.late, fill: 'var(--color-late)' },
          {
            name: 'absent',
            value: absentCombined,
            fill: 'var(--color-absent)',
          },
        ],
      },
      rows: mapped,
      totals,
      rangeLabel: `Laatste ${days} dagen`,
    };
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateCopy = new Date(d);
    dateCopy.setHours(12, 0, 0, 0);

    const normalizedDay = jsDayToMon1Sun7(dateCopy.getDay());

    rosterArr.forEach((roster) => {
      const rosterDay = rosterDayToNumber(roster?.day_of_week);
      if (!rosterDay || rosterDay !== normalizedDay) return;

      const matchingAbsence = absArr.find(
        (a) =>
          Number(a?.roster_id) === Number(roster?.id) &&
          a?.date &&
          new Date(a.date).toDateString() === dateCopy.toDateString()
      );

      const reason = matchingAbsence?.reason || '';
      const normalizedReason = String(reason).toLowerCase();

      let status = 'present';
      if (matchingAbsence) {
        if (normalizedReason.includes('te laat')) status = 'late';
        else if (normalizedReason.includes('ziek')) status = 'sick';
        else status = 'absent';
      }

      rows.push({
        key: `${roster?.id ?? 'roster'}-${dateCopy.toISOString().slice(0, 10)}`,
        date: dateCopy,
        rosterId: roster?.id ?? null,
        lessonName: roster?.subject?.name || roster?.title || 'Les',
        className: roster?.class_layout?.name || '',
        startTime: timeLabelFromValue(roster?.start_time || roster?.start),
        endTime: timeLabelFromValue(roster?.end_time || roster?.end),
        status,
        reason,
      });
    });
  }

  rows.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    if (db !== da) return db - da;
    return String(a.startTime || '').localeCompare(String(b.startTime || ''));
  });

  const totals = {
    total: rows.length,
    present: rows.filter((r) => r.status === 'present').length,
    late: rows.filter((r) => r.status === 'late').length,
    sick: rows.filter((r) => r.status === 'sick').length,
    absent: rows.filter((r) => r.status === 'absent').length,
  };

  const absentCombined = totals.absent + totals.sick;
  const donutTotal = Math.max(totals.present + totals.late + absentCombined, 1);
  const presentPct = Math.round((totals.present / donutTotal) * 100);

  return {
    stats: {
      present: totals.present,
      late: totals.late,
      absent: absentCombined, // includes sick
      presentPct,
      donutData: [
        { name: 'present', value: totals.present, fill: 'var(--color-present)' },
        { name: 'late', value: totals.late, fill: 'var(--color-late)' },
        { name: 'absent', value: absentCombined, fill: 'var(--color-absent)' },
      ],
    },
    rows,
    totals,
    rangeLabel: `Laatste ${days} dagen`,
  };
};

// const fmtDate = (d) =>
//   d
//     ? new Date(d).toLocaleString('nl-NL', {
//         day: 'numeric',
//         month: 'long',
//         year: 'numeric',
//       })
//     : 'N/A';

// moved StatCard into OverviewTab

export default function StudentDetailsPage2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const canSeePaymentsTab = isAdmin || isStudent;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [klass, setKlass] = useState(null);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [currentTeacherLoading, setCurrentTeacherLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [moduleNameBySubjectId, setModuleNameBySubjectId] = useState({});
  const [search, setSearch] = useState('');
  const [moduleFilters, setModuleFilters] = useState([]);
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [studentNotes, setStudentNotes] = useState([]);
  const [studentNotesLoading, setStudentNotesLoading] = useState(false);
  const location = useLocation();
  const initialTab = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get('tab') || 'overzicht';
    } catch {
      return 'overzicht';
    }
  }, [location.search]);
  const [tab, setTab] = useState(initialTab);
  const [savingEnroll, setSavingEnroll] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [financeLogs, setFinanceLogs] = useState([]);
  const [coursePaymentSummary, setCoursePaymentSummary] = useState(null);
  const [coursePaymentTransactions, setCoursePaymentTransactions] = useState(
    []
  );

  const isMentorTeacherForThisStudent =
    isTeacher &&
    Number(currentTeacher?.id) &&
    Number(klass?.mentorId ?? klass?.mentor_id) === Number(currentTeacher?.id);

  const canSeePrivateNotes = isStudent || isMentorTeacherForThisStudent;
  const canPublishPrivateNotes = isMentorTeacherForThisStudent;

  // Resolve the current logged-in teacher profile (to check mentor permissions)
  useEffect(() => {
    if (!isTeacher) {
      setCurrentTeacher(null);
      setCurrentTeacherLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setCurrentTeacherLoading(true);
      try {
        const resp = await RequestHandler.get('/auth/me/teacher');
        if (!cancelled) {
          setCurrentTeacher(resp?.data || null);
        }
      } catch (e) {
        console.error('Failed to load current teacher profile', e);
        if (!cancelled) setCurrentTeacher(null);
      } finally {
        if (!cancelled) setCurrentTeacherLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setStudent(null);
      setRosters([]);
      try {
        const s = await studentAPI.get_student_by_id(id);
        if (!mounted) return;
        setStudent(s);

        if (s?.class_id) {
          const cl = await classAPI.get_class(s.class_id);
          if (!mounted) return;
          setKlass(cl);
        }

        const sidNum = Number(id);
        const financePromise = Number.isFinite(sidNum)
          ? financeAPI.get_financial_logs({ student_id: sidNum })
          : financeAPI.get_financial_logs();

        const rostersPromise = s?.class_id
          ? rosterAPI.get_rosters({ class_id: s.class_id })
          : Promise.resolve([]);

        const [allResults, allAbsences, allModules, studentFinanceLogs, classRosters] =
          await Promise.all([
            resultAPI.get_results(),
            absenceAPI.getAllAbsences(),
            moduleAPI.get_modules(),
            financePromise,
            rostersPromise,
          ]);
        if (!mounted) return;

        const sid = Number(id);
        setResults((allResults || []).filter((r) => r.student_id === sid));
        setAbsences((allAbsences || []).filter((a) => a.student_id === sid));
        setRosters(Array.isArray(classRosters) ? classRosters : []);
        setFinanceLogs(
          Array.isArray(studentFinanceLogs) ? studentFinanceLogs : []
        );

        // Build a lookup from course_module_subject.id -> course_module.name
        const bySubjectId = Object.create(null);
        (allModules || []).forEach((mod) => {
          (mod.subjects || []).forEach((sub) => {
            bySubjectId[sub.id] = mod.name || '—';
          });
        });
        setModuleNameBySubjectId(bySubjectId);
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

  const attendanceData = useMemo(
    () => computeAttendanceData({ rosters, absences, days: 30 }),
    [rosters, absences]
  );

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

    const present = attendanceData?.stats?.present ?? 0;
    const late = attendanceData?.stats?.late ?? 0;
    const absent = attendanceData?.stats?.absent ?? 0;
    const presentPct = attendanceData?.stats?.presentPct ?? 0;
    const donutData = attendanceData?.stats?.donutData ?? [];

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
        // Koppel backend-cursusinformatie zodat andere tabs (zoals Betalingen)
        // de juiste prijs en course-id kunnen gebruiken.
        courseId: klass?.course?.id ?? klass?.courseId ?? null,
        coursePrice: (() => {
          const rawPrice =
            klass?.course && klass.course.price != null
              ? klass.course.price
              : null;
          const num = Number(rawPrice);
          return Number.isFinite(num) && num > 0 ? num : null;
        })(),
        registered: format(student.created_at, 'PPP', { locale: nl }),
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
        donutData,
      },
    };
  }, [student, results, klass, attendanceData]);

  // Load course payment data for Betalingen tab from localStorage
  useEffect(() => {
    if (tab !== 'betalingen') return;
    if (!student || !studentStats) {
      setCoursePaymentSummary(null);
      setCoursePaymentTransactions([]);
      return;
    }
    try {
      if (typeof window === 'undefined') {
        setCoursePaymentSummary(null);
        setCoursePaymentTransactions([]);
        return;
      }
      const courseName =
        studentStats?.meta?.course ||
        studentStats?.lesson_package ||
        student?.lesson_package ||
        '—';
      const studentKey =
        student?.id ??
        student?.email ??
        studentStats?.fullName ??
        'onbekende_student';
      const storageKey = `payments:${studentKey}:${courseName}`;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setCoursePaymentSummary({
          courseName,
          totalPrice: 0,
          paid: 0,
          remaining: 0,
        });
        setCoursePaymentTransactions([]);
        return;
      }
      const parsed = JSON.parse(raw);
      const totalPrice = Number(parsed?.totalPrice) || 0;
      const paid = Math.max(
        0,
        Math.min(Number(parsed?.paid) || 0, totalPrice)
      );
      const remaining = Math.max((totalPrice || 0) - paid, 0);
      const txRaw = Array.isArray(parsed?.transactions)
        ? parsed.transactions
        : [];
      const txNormalized = txRaw
        .map((t, idx) => ({
          id: t.id ?? `local-${idx}`,
          date: t.date || t.createdAt || null,
          amount: Number(t.amount) || 0,
          method: normalizePaymentMethod(t.method),
          source: t.source || 'Lesgeldkaart',
          description: 'Lesgeldbetaling',
          transactionType: 'income',
          course: courseName,
        }))
        .sort((a, b) => {
          const da = a.date ? new Date(a.date).getTime() : 0;
          const db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        });

      setCoursePaymentSummary({
        courseName,
        totalPrice,
        paid,
        remaining,
      });
      setCoursePaymentTransactions(txNormalized);
    } catch (e) {
      console.error('Failed to load course payments from localStorage:', e);
      setCoursePaymentSummary(null);
      setCoursePaymentTransactions([]);
    }
  }, [tab, student, studentStats]);

  const combinedTransactions = useMemo(() => {
    const backendTx = (financeLogs || []).map((l) => ({
      id: `fin-${l.id}`,
      date: l.date,
      amount: Number(l.amount) || 0,
      method: normalizePaymentMethod(l.method),
      source: 'Financiën',
      description: l.type,
      transactionType: l.transaction_type,
      course: l.course || null,
    }));

    const localTx = (coursePaymentTransactions || []).map((t) => ({
      id: `local-${t.id}`,
      date: t.date,
      amount: Number(t.amount) || 0,
      method: normalizePaymentMethod(t.method),
      source: t.source || 'Lesgeldkaart',
      description: t.description || 'Lesgeldbetaling',
      transactionType: t.transactionType || 'income',
      course:
        t.course ||
        coursePaymentSummary?.courseName ||
        studentStats?.meta?.course ||
        studentStats?.lesson_package ||
        student?.lesson_package ||
        null,
    }));

    const all = [...localTx, ...backendTx];
    all.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
    return all;
  }, [
    coursePaymentSummary,
    coursePaymentTransactions,
    financeLogs,
    student,
    studentStats,
  ]);

  // Private notes (teacher <-> student): fetch from backend
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!student?.id || !canSeePrivateNotes) {
        if (mounted) setStudentNotes([]);
        return;
      }
      setStudentNotesLoading(true);
      try {
        const data = await studentNoteAPI.get_student_notes(student.id);
        if (!mounted) return;
        setStudentNotes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load student notes:', e);
        if (mounted) setStudentNotes([]);
      } finally {
        if (mounted) setStudentNotesLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [student?.id, canSeePrivateNotes]);

  const handleAddStudentNote = async ({ subject, text }) => {
    if (!canPublishPrivateNotes) {
      throw new Error('Forbidden');
    }
    if (!student?.id) {
      throw new Error('Student not loaded');
    }
    const created = await studentNoteAPI.create_student_note(student.id, {
      subject,
      text,
    });
    setStudentNotes((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    return created;
  };

  const getModuleName = useCallback(
    (r) =>
      moduleNameBySubjectId[r?.assessment?.subject_id] ||
      r?.assessment?.subject?.course_module?.name ||
      '—',
    [moduleNameBySubjectId]
  );

  const moduleOptions = useMemo(() => {
    const names = new Set();
    (results || []).forEach((r) => {
      const n = getModuleName(r);
      if (n && n !== '—') names.add(n);
    });
    return [{ value: '', label: 'Alle modules' }].concat(
      Array.from(names)
        .sort((a, b) => a.localeCompare(b))
        .map((n) => ({ value: n, label: n }))
    );
  }, [results, getModuleName]);

  const filteredSortedResults = useMemo(() => {
    let arr = Array.isArray(results) ? [...results] : [];

    // Filter by module
    if ((moduleFilters || []).length > 0) {
      arr = arr.filter((r) => moduleFilters.includes(getModuleName(r)));
    }

    // Text search on assessment name and module name
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((r) => {
        const name = r?.assessment?.name?.toLowerCase() || '';
        const mod = getModuleName(r).toLowerCase();
        return name.includes(q) || mod.includes(q);
      });
    }

    // Sorting
    const { key, dir } = sort || {};
    const factor = dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (key) {
        case 'module': {
          const av = getModuleName(a);
          const bv = getModuleName(b);
          return av.localeCompare(bv) * factor;
        }
        case 'type': {
          const av = a?.assessment?.type || '';
          const bv = b?.assessment?.type || '';
          return av.localeCompare(bv) * factor;
        }
        case 'name': {
          const av = a?.assessment?.name || '';
          const bv = b?.assessment?.name || '';
          return av.localeCompare(bv) * factor;
        }
        case 'date': {
          const av = new Date(a?.date || 0).getTime();
          const bv = new Date(b?.date || 0).getTime();
          return (av - bv) * factor;
        }
        case 'grade': {
          const av = Number(a?.grade) || 0;
          const bv = Number(b?.grade) || 0;
          return (av - bv) * factor;
        }
        default:
          return 0;
      }
    });

    return arr;
  }, [results, moduleFilters, search, sort, getModuleName]);

  const toggleSort = (key) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const exportResultsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resultaten');

    workbook.creator = 'School Admin System';
    workbook.lastModifiedBy = 'School Admin System';
    workbook.created = new Date();
    workbook.modified = new Date();

    worksheet.getColumn(1).width = 28; // Vak
    worksheet.getColumn(2).width = 14; // Type
    worksheet.getColumn(3).width = 36; // Naam
    worksheet.getColumn(4).width = 16; // Datum
    worksheet.getColumn(5).width = 10; // Cijfer

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `RESULTATEN – ${studentStats.fullName}`;
    titleCell.font = {
      bold: true,
      size: 18,
      color: { argb: 'FF1E3A8A' },
      name: 'Calibri',
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };
    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 10;

    const headerRow = worksheet.getRow(3);
    headerRow.values = ['Vak', 'Type', 'Naam', 'Datum', 'Cijfer'];
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 12,
        name: 'Calibri',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      };
    });

    const exportRows = filteredSortedResults.map((r) => ({
      module: getModuleName(r),
      type: r?.assessment?.type === 'test' ? 'Toets' : 'Examen',
      name: r?.assessment?.name || '',
      date: r?.date ? new Date(r.date) : null,
      grade: r?.grade ?? '',
    }));

    exportRows.forEach((row, index) => {
      const rowIndex = index + 4;
      const dataRow = worksheet.getRow(rowIndex);
      const formattedDate = row.date
        ? format(row.date, 'dd-MM-yyyy', { locale: nl })
        : '';
      dataRow.values = [
        row.module,
        row.type,
        row.name,
        formattedDate,
        row.grade,
      ];
      dataRow.height = 20;

      const isEvenRow = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = { size: 11, name: 'Calibri' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFFFFFFF' : 'FFF8F9FA' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (colNumber === 1) {
          cell.font = { ...cell.font, bold: true };
        }
      });
    });

    worksheet.views = [{ state: 'frozen', ySplit: 3 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const studentSlug = (studentStats.fullName || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '');
    const fileName = `resultaten_${studentSlug}_${new Date().toISOString().split('T')[0]
      }.xlsx`;
    saveAs(blob, fileName);
  };

  const handleExportExcelResults = async () => {
    try {
      await exportResultsToExcel();
      toast.success('Resultaten succesvol geëxporteerd naar Excel!');
    } catch (e) {
      console.error(e);
      toast.error(
        'Kon de resultaten niet exporteren naar Excel. Probeer het opnieuw.'
      );
    }
  };

  const handleExportPDFResults = () => {
    try {
      const columns = [
        { header: 'Vak', accessorKey: 'module', displayName: 'Vak' },
        { header: 'Type', accessorKey: 'type', displayName: 'Type' },
        { header: 'Naam', accessorKey: 'name', displayName: 'Naam' },
        { header: 'Datum', accessorKey: 'date', displayName: 'Datum' },
        { header: 'Cijfer', accessorKey: 'grade', displayName: 'Cijfer' },
      ];

      const rows = filteredSortedResults.map((r) => ({
        module: getModuleName(r),
        type: r?.assessment?.type === 'test' ? 'Toets' : 'Examen',
        name: r?.assessment?.name || '',
        date: r?.date || '',
        grade: r?.grade ?? '',
      }));

      const studentSlug = (studentStats.fullName || 'student')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');

      exportScheduleToPDF({
        columns,
        rows,
        options: {
          title: `Resultaten – ${studentStats.fullName}`,
          fileName: `resultaten_${studentSlug}_${new Date().toISOString().split('T')[0]
            }.pdf`,
        },
      });
      toast.success('Resultaten succesvol geëxporteerd naar PDF!');
    } catch (e) {
      console.error(e);
      toast.error(
        'Kon de resultaten niet exporteren naar PDF. Probeer het opnieuw.'
      );
    }
  };

  // Placeholder removed: Quran progress state and logs were unused

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

  if (loading || (isTeacher && currentTeacherLoading)) {
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

  // Mentor teacher access restriction: teachers can only view students in their mentored class.
  if (isTeacher && !isMentorTeacherForThisStudent) {
    return (
      <div className="mx-auto max-w-[1200px] px-2 sm:px-6">
        <Button variant="ghost" onClick={() => navigate('/mijn-leerlingen')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar mijn leerlingen
        </Button>
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold">Geen toegang</h2>
          <p className="mt-2 text-muted-foreground">
            Je kunt alleen leerlingen bekijken uit jouw mentorklas.
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
    ...(canSeePaymentsTab ? [{ value: 'betalingen', label: 'Betalingen' }] : []),
    { value: 'voortgang', label: 'Voortgang' },
    ...(canSeePrivateNotes ? [{ value: 'notities', label: 'Notities' }] : []),
  ];
  const allowedTabValues = new Set(TABS.map((t) => t.value));
  const activeTab = allowedTabValues.has(tab) ? tab : 'overzicht';

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
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
            <div className="grid size-14 self-start place-items-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/70">
              <User className="size-7" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {studentStats.fullName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {studentStats?.meta?.klas && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-3.5 py-1 text-xl font-medium"
                  >
                    {studentStats.meta.klas}
                  </Badge>
                )}
                {studentStats?.meta?.course && (
                  <Badge
                    variant="outline"
                    className="rounded-full px-3.5 py-1 text-xl font-medium"
                  >
                    Lespakket: {studentStats.meta.course}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
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
        )}
      </div>

      {/* Sticky sub-nav (styled TabsList) */}
      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <div className="sticky top-16 z-30 -mx-4 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
          {/* Mobile: Dropdown */}
          <div className="block sm:hidden">
            <Select value={activeTab} onValueChange={setTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Navigatie" />
              </SelectTrigger>
              <SelectContent>
                {TABS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: TabsList */}
          <div className="hidden sm:block">
            <TabsList className="border-b p-0 h-auto bg-transparent w-full justify-start">
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
                      data-[state=active]:shadow-none
                      bg-transparent
                    "
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </div>
        </div>

        {/* OVERZICHT */}
        <TabsContent value="overzicht" className="mt-6">
          <OverviewTab
            student={student}
            studentStats={studentStats}
            setTab={setTab}
            onAddNote={canPublishPrivateNotes ? handleAddStudentNote : undefined}
          />
        </TabsContent>

        {/* GEGEVENS */}
        <TabsContent value="gegevens" className="mt-6">
          <GegevensTab student={student} studentStats={studentStats} />
        </TabsContent>

        {/* RESULTATEN */}
        {console.log('logged results: ', results)}
        <TabsContent value="resultaten" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1 w-full">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoek resultaten op naam of vak"
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-64">
                  <ComboboxField
                    label={null}
                    items={moduleOptions}
                    value={''}
                    onChange={(v) => {
                      if (!v) {
                        setModuleFilters([]);
                        return;
                      }
                      setModuleFilters((prev) =>
                        prev.includes(v) ? prev : [...prev, v]
                      );
                    }}
                    placeholder="Filter op vak"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    onClick={() => setIsExportDialogOpen(true)}
                    className="w-full md:w-auto"
                  >
                    <Download className="size-4 mr-2" />
                    Exporteren
                  </Button>
                </div>
              </div>
              {(search?.trim() || (moduleFilters || []).length > 0) && (
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {search?.trim() ? (
                      <Badge
                        variant="secondary"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                      >
                        <span className="text-sm">Zoek: “{search.trim()}”</span>
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="grid h-5 w-5 place-items-center rounded-full hover:bg-foreground/10"
                          aria-label="Zoekfilter verwijderen"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ) : null}
                    {(moduleFilters || []).map((mf) => (
                      <Badge
                        key={mf}
                        variant="secondary"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                      >
                        <span className="text-sm">Vak: {mf}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setModuleFilters((prev) =>
                              prev.filter((v) => v !== mf)
                            )
                          }
                          className="grid h-5 w-5 place-items-center rounded-full hover:bg-foreground/10"
                          aria-label="Vakfilter verwijderen"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-lg">
                      <TableHead
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => toggleSort('module')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Vak <ArrowUpDown className="size-4 opacity-60" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleSort('type')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Type <ArrowUpDown className="size-4 opacity-60" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleSort('name')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Naam <ArrowUpDown className="size-4 opacity-60" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleSort('date')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Datum <ArrowUpDown className="size-4 opacity-60" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleSort('grade')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Cijfer <ArrowUpDown className="size-4 opacity-60" />
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-base">
                    {filteredSortedResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="whitespace-nowrap">{getModuleName(result)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {result.assessment.type === 'test' ? 'Toets' : 'Examen'}
                        </TableCell>
                        <TableCell className="min-w-[150px]">{result.assessment.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(result.date, 'dd-MM-yyyy', { locale: nl })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${result.grade >= 8
                              ? 'text-white bg-green-700 size-8 rounded-full text-base'
                              : result.grade >= 6
                                ? 'text-white bg-primary size-8 rounded-full text-base'
                                : 'text-white bg-red-500 size-8 rounded-full text-base'
                              }`}
                            variant="default"
                          >
                            {result.grade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {results.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          Geen resultaten gevonden.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <ExportDialog
            isOpen={isExportDialogOpen}
            onClose={() => setIsExportDialogOpen(false)}
            onExportExcel={handleExportExcelResults}
            onExportPDF={handleExportPDFResults}
            title="Exporteer resultaten"
            description="Kies een bestandsformaat voor het exporteren van de resultaten."
          />
        </TabsContent>

        {/* AANWEZIGHEID */}
        <TabsContent value="aanwezigheid" className="mt-6">
          <AanwezigheidTab
            attendance={attendanceData}
            klassName={studentStats?.meta?.klas ?? klass?.name ?? '—'}
          />
        </TabsContent>

        {/* BETALINGEN */}
        <TabsContent value="betalingen" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Betalingen</CardTitle>
              <CardDescription>
                Overzicht van lesgeldbetalingen en andere transacties voor deze
                student.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* {coursePaymentSummary ? (
                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <div className="sm:col-span-2 flex items-center justify-between">
                    <span>Lespakket</span>
                    <span className="font-medium">
                      {coursePaymentSummary.courseName || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Totaalprijs</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('nl-NL', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(coursePaymentSummary.totalPrice || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Nog te betalen</span>
                    <span
                      className={`font-medium ${(coursePaymentSummary.remaining || 0) > 0
                        ? 'text-orange-600'
                        : 'text-green-700'
                        }`}
                    >
                      {new Intl.NumberFormat('nl-NL', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(coursePaymentSummary.remaining || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Er is nog geen lesgeldinformatie beschikbaar voor dit
                  lespakket.
                </p>
              )} */}



              <div>
                <p className="mb-2 text-sm font-medium">Transacties</p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Datum</TableHead>
                        <TableHead className="whitespace-nowrap">Omschrijving</TableHead>
                        <TableHead className="whitespace-nowrap">Lespakket</TableHead>
                        <TableHead className="whitespace-nowrap">Methode</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Bedrag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedTransactions.map((tx) => (
                        <TableRow key={`${tx.source}-${tx.id}`}>
                          <TableCell className="whitespace-nowrap">
                            {tx.date
                              ? format(new Date(tx.date), 'dd-MM-yyyy', {
                                locale: nl,
                              })
                              : '–'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{tx.description || '-'}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {tx.course ||
                              coursePaymentSummary?.courseName ||
                              '–'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{tx.method || 'Onbekend'}</TableCell>
                          <TableCell
                            className={`text-right whitespace-nowrap ${tx.transactionType === 'expense'
                              ? 'text-red-600'
                              : 'text-green-700'
                              }`}
                          >
                            {new Intl.NumberFormat('nl-NL', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(tx.amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {combinedTransactions.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground"
                          >
                            Geen transacties gevonden voor deze student.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VOORTGANG */}
        <TabsContent value="voortgang" className="mt-6">
          <VoortgangTab student={student} />
        </TabsContent>

        {/* NOTITIES (private teacher <-> student) */}
        {canSeePrivateNotes ? (
          <TabsContent value="notities" className="mt-6">
            <NotitiesTab
              notes={studentNotes}
              isLoading={studentNotesLoading}
              canPublish={canPublishPrivateNotes}
              onAddNote={canPublishPrivateNotes ? handleAddStudentNote : undefined}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
