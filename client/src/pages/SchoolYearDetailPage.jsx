import assessmentApi from '@/apis/assessmentAPI';
import classAPI from '@/apis/classAPI';
import financeAPI from '@/apis/financeAPI';
import moduleAPI from '@/apis/moduleAPI';
import resultAPI from '@/apis/resultAPI';
import rosterAPI from '@/apis/rosterAPI';
import schoolyearAPI from '@/apis/schoolyearAPI';
import studentAPI from '@/apis/studentAPI';
import teachersAPI from '@/apis/teachersAPI';
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

export default function SchoolYearDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const yearId = Number(id);

    const [year, setYear] = useState(null);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [moduleSubjectLabels, setModuleSubjectLabels] = useState(new Map());
    const [results, setResults] = useState([]);
    const [financialLogs, setFinancialLogs] = useState([]);
    const [rosters, setRosters] = useState([]);
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

                const [
                    yearData,
                    classLayouts,
                    assessmentsData,
                    financialData,
                    rostersData,
                    allStudents,
                    allTeachers,
                    allResults,
                    modulesData,
                ] = await Promise.all([
                    schoolyearAPI.getSchoolYearById(yearId),
                    classAPI.get_classes(yearId),
                    assessmentApi.getAssessments({ school_year_id: yearId }),
                    financeAPI.get_financial_logs({ school_year_id: yearId }),
                    rosterAPI.get_rosters({ school_year_id: yearId }),
                    studentAPI.get_students(),
                    teachersAPI.get_teachers(),
                    resultAPI.get_results(),
                    moduleAPI.get_modules(),
                ]);

                if (cancelled) return;

                setYear(yearData || null);
                setClasses(classLayouts || []);

                // API returns an object { success, data: [...] }; normalise to array
                const assessmentList = Array.isArray(assessmentsData)
                    ? assessmentsData
                    : assessmentsData?.data || [];
                setAssessments(assessmentList);

                // Build lookup from course_module_subject.id to "Subject - Level" label
                const subjectLabelMap = new Map();
                (modulesData || []).forEach((mod) => {
                    (mod.subjects || []).forEach((ms) => {
                        const baseName = ms.subject?.name || 'Onbekend vak';
                        const label = ms.level
                            ? `${baseName} - ${ms.level}`
                            : baseName;
                        subjectLabelMap.set(ms.id, label);
                    });
                });
                setModuleSubjectLabels(subjectLabelMap);

                setFinancialLogs(financialData || []);
                setRosters(rostersData || []);
                setStudents(allStudents || []);
                setTeachers(allTeachers || []);
                setResults(allResults || []);
            } catch (err) {
                console.error('Failed to load school year detail', err);
                if (!cancelled) {
                    setError(
                        'Kon de gegevens van dit schooljaar niet laden. Probeer het later opnieuw.'
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

    const classIds = useMemo(
        () => new Set(classes.map((c) => c.id)),
        [classes]
    );

    const studentsInYear = useMemo(() => {
        if (!students || !students.length) return [];
        return students.filter((s) => classIds.has(s.class_id));
    }, [students, classIds]);

    const teachersInYear = useMemo(() => {
        if (!teachers || !teachers.length) return [];
        return teachers.filter((t) => {
            const isMentor = classes.some((c) => c.mentor_id === t.id);
            const hasRoster =
                t.roster?.some?.((r) => r.school_year_id === yearId) ?? false;
            return isMentor || hasRoster;
        });
    }, [teachers, classes, yearId]);

    const assessmentsInYear = useMemo(
        () => assessments || [],
        [assessments]
    );

    const tests = useMemo(
        () =>
            assessmentsInYear.filter(
                (a) => (a.type || '').toLowerCase() === 'test'
            ),
        [assessmentsInYear]
    );
    const exams = useMemo(
        () =>
            assessmentsInYear.filter(
                (a) => (a.type || '').toLowerCase() === 'exam'
            ),
        [assessmentsInYear]
    );

    const resultsInYear = useMemo(() => {
        if (!results || !results.length) return [];
        return results.filter(
            (r) => r.assessment?.school_year_id === yearId
        );
    }, [results, yearId]);

    const incomeLogs = useMemo(
        () =>
            (financialLogs || []).filter(
                (l) => l.transaction_type === 'income'
            ),
        [financialLogs]
    );
    const expenseLogs = useMemo(
        () =>
            (financialLogs || []).filter(
                (l) => l.transaction_type === 'expense'
            ),
        [financialLogs]
    );

    const totalIncome = useMemo(
        () =>
            incomeLogs.reduce(
                (sum, l) => sum + (Number(l.amount) || 0),
                0
            ),
        [incomeLogs]
    );
    const totalExpense = useMemo(
        () =>
            expenseLogs.reduce(
                (sum, l) => sum + (Number(l.amount) || 0),
                0
            ),
        [expenseLogs]
    );

    const uniqueSubjectNames = useMemo(() => {
        const names = new Set();
        (assessmentsInYear || []).forEach((a) => {
            const label = moduleSubjectLabels.get(a.subject_id);
            if (label) names.add(label);
        });
        return Array.from(names);
    }, [assessmentsInYear, moduleSubjectLabels]);

    const title = year?.name || `Schooljaar ${yearId}`;
    const statusLabel = year
        ? year.is_active
            ? 'Actief'
            : year.is_archived
                ? 'Gearchiveerd'
                : 'Inactief'
        : '';

    const statusVariant = year
        ? year.is_active
            ? 'default'
            : year.is_archived
                ? 'outline'
                : 'secondary'
        : 'secondary';

    return (
        <>
            <PageHeader
                title={title}
                icon={<CalendarDays className="size-9" />}
                description="Detailoverzicht van dit schooljaar."
                extra={
                    <div className="flex items-center gap-3">
                        {year && (
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/school-jaar')}
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
                    title="Financiën"
                    icon={<Banknote className="h-8 w-8" />}
                    variant="danger"
                    onClick={() => setOpenDialog('finance')}
                />
            </div>

            {/* Leerlingen dialog */}
            <Dialog
                open={openDialog === 'students'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="900px">
                    <DialogHeader>
                        <DialogTitle>Leerlingen in {title}</DialogTitle>
                        <DialogDescription>
                            Overzicht van alle leerlingen die aan klassen in dit schooljaar
                            gekoppeld zijn.
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
                            {studentsInYear.map((s) => {
                                const cls = classes.find((c) => c.id === s.class_id);
                                return (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            {s.first_name} {s.last_name}
                                        </TableCell>
                                        <TableCell>{cls?.name || '-'}</TableCell>
                                        <TableCell>{s.city || '-'}</TableCell>
                                        <TableCell>{s.lesson_package || '-'}</TableCell>
                                    </TableRow>
                                );
                            })}
                            {studentsInYear.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Geen leerlingen gevonden voor dit schooljaar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Leraren dialog */}
            <Dialog
                open={openDialog === 'teachers'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="800px">
                    <DialogHeader>
                        <DialogTitle>Leraren in {title}</DialogTitle>
                        <DialogDescription>
                            Docenten die als mentor of in roosters aan dit schooljaar
                            gekoppeld zijn.
                        </DialogDescription>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naam</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Actief</TableHead>
                                <TableHead>Uurtarief</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teachersInYear.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        {t.first_name} {t.last_name}
                                    </TableCell>
                                    <TableCell>{t.email}</TableCell>
                                    <TableCell>{t.is_active ? 'Ja' : 'Nee'}</TableCell>
                                    <TableCell>
                                        {typeof t.compensation === 'number'
                                            ? `€ ${t.compensation.toFixed(2)}`
                                            : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {teachersInYear.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Geen leraren gevonden voor dit schooljaar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Klassen dialog */}
            <Dialog
                open={openDialog === 'classes'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="800px">
                    <DialogHeader>
                        <DialogTitle>Klassen in {title}</DialogTitle>
                        <DialogDescription>
                            Overzicht van alle klassen en hun mentoren.
                        </DialogDescription>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Klas</TableHead>
                                <TableHead>Mentor</TableHead>
                                <TableHead>Lespakket</TableHead>
                                <TableHead className="text-right">Leerlingen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell>{c.name}</TableCell>
                                    <TableCell>
                                        {c.mentor
                                            ? `${c.mentor.first_name} ${c.mentor.last_name}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell>{c.course?.name || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        {c.students?.length ?? 0}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {classes.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Geen klassen voor dit schooljaar gevonden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Vakken dialog */}
            <Dialog
                open={openDialog === 'subjects'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="700px">
                    <DialogHeader>
                        <DialogTitle>Vakken in {title}</DialogTitle>
                        <DialogDescription>
                            Overzicht van vakken die in dit schooljaar getoetst zijn.
                        </DialogDescription>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vak</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {uniqueSubjectNames.map((name) => (
                                <TableRow key={name}>
                                    <TableCell>{name}</TableCell>
                                </TableRow>
                            ))}
                            {uniqueSubjectNames.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell className="text-center">
                                        Geen vakken gevonden voor dit schooljaar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Toetsen & examens dialog */}
            <Dialog
                open={openDialog === 'assessments'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="900px">
                    <DialogHeader>
                        <DialogTitle>Toetsen & examens in {title}</DialogTitle>
                        <DialogDescription>
                            Alle beoordelingen (toetsen en examens) in dit schooljaar.
                        </DialogDescription>
                    </DialogHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Naam</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Klas</TableHead>
                                <TableHead>Datum</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assessmentsInYear.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell>{a.name}</TableCell>
                                    <TableCell>{a.type}</TableCell>
                                    <TableCell>{a.class_layout?.name || '-'}</TableCell>
                                    <TableCell>
                                        {a.date ? String(a.date).slice(0, 10) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {assessmentsInYear.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Geen beoordelingen geregistreerd voor dit schooljaar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Resultaten dialog */}
            <Dialog
                open={openDialog === 'results'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="900px">
                    <DialogHeader>
                        <DialogTitle>Resultaten in {title}</DialogTitle>
                        <DialogDescription>
                            Alle cijfers die aan beoordelingen in dit schooljaar gekoppeld
                            zijn.
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
                            {resultsInYear.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        {r.student?.first_name} {r.student?.last_name}
                                    </TableCell>
                                    <TableCell>{r.assessment?.name || '-'}</TableCell>
                                    <TableCell>
                                        {typeof r.grade === 'number'
                                            ? r.grade.toFixed(1)
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {r.date ? String(r.date).slice(0, 10) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {resultsInYear.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Geen resultaten voor dit schooljaar gevonden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>

            {/* Financiële dialog */}
            <Dialog
                open={openDialog === 'finance'}
                onOpenChange={(open) => !open && setOpenDialog(null)}
            >
                <DialogContent maxWidth="900px">
                    <DialogHeader>
                        <DialogTitle>Financiële transacties in {title}</DialogTitle>
                        <DialogDescription>
                            Overzicht van inkomsten en uitgaven die aan dit schooljaar
                            gekoppeld zijn.
                        </DialogDescription>
                    </DialogHeader>
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
                                    <TableCell>
                                        {log.date ? String(log.date).slice(0, 10) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        € {Number(log.amount).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {financialLogs.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Geen transacties voor dit schooljaar gevonden.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </>
    );
}


