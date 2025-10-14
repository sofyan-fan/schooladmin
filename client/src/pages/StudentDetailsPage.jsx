import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import GegevensTab from '@/pages/students/GegevensTab';
import OverviewTab from '@/pages/students/OverviewTab';
import { ArrowLeft, ArrowUpDown, User, Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import ComboboxField from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
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
import moduleAPI from '@/apis/moduleAPI';
import resultAPI from '@/apis/resultAPI';
import studentAPI from '@/apis/studentAPI';
import { absenceAPI } from '@/apis/timeregisterAPI';
import ExportDialog from '@/utils/ExportDialog';
import exportScheduleToPDF from '@/utils/exportScheduleToPDF';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

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

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [klass, setKlass] = useState(null);
  const [results, setResults] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [moduleNameBySubjectId, setModuleNameBySubjectId] = useState({});
  const [search, setSearch] = useState('');
  const [moduleFilters, setModuleFilters] = useState([]);
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' });
  const [tab, setTab] = useState('overzicht');
  const [savingEnroll, setSavingEnroll] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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

        const [allResults, allAbsences, allModules] = await Promise.all([
          resultAPI.get_results(),
          absenceAPI.getAllAbsences(),
          moduleAPI.get_modules(),
        ]);
        if (!mounted) return;

        const sid = Number(id);
        setResults((allResults || []).filter((r) => r.student_id === sid));
        setAbsences((allAbsences || []).filter((a) => a.student_id === sid));

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
        donutData: [
          { name: 'present', value: present, fill: 'var(--color-present)' },
          { name: 'late', value: late, fill: 'var(--color-late)' },
          { name: 'absent', value: absent, fill: 'var(--color-absent)' },
        ],
      },
    };
  }, [student, results, absences, klass]);

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
    const fileName = `resultaten_${studentSlug}_${
      new Date().toISOString().split('T')[0]
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
          fileName: `resultaten_${studentSlug}_${
            new Date().toISOString().split('T')[0]
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
    <div className="w-full space-y-6 px-2 sm:px-6">
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
          <OverviewTab
            student={student}
            studentStats={studentStats}
            setTab={setTab}
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Zoek resultaten op naam of vak"
                  />
                </div>
                <div className="w-full sm:w-64">
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
                  >
                    <Download className="size-4" />
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
              <Table>
                <TableHeader>
                  <TableRow className="text-lg">
                    <TableHead
                      className="cursor-pointer select-none"
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
                      <TableCell>{getModuleName(result)}</TableCell>
                      <TableCell>
                        {result.assessment.type === 'test' ? 'Toets' : 'Examen'}
                      </TableCell>
                      <TableCell>{result.assessment.name}</TableCell>
                      <TableCell>
                        {format(result.date, 'dd-MM-yyyy', { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            result.grade >= 8
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
