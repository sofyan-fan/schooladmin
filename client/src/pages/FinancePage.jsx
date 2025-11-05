import courseApi from '@/apis/courseAPI';
import financeAPI from '@/apis/financeAPI';
import studentAPI from '@/apis/studentAPI';
import ExpensesByTypeDonut from '@/components/finance/ExpensesByTypeDonut';
import FinanceStatCard from '@/components/finance/FinanceStatCard';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import ComboboxField from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { BriefcaseMedical, Calculator, CircleDollarSign, Edit, Eye, GraduationCap, HeartHandshake, Home, Plus, ReceiptText, Repeat, ShoppingCart, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

// Icon and color utilities for financial types
const ICON_OPTIONS = [
  'Wallet',
  'HeartHandshake',
  'ShoppingCart',
  'GraduationCap',
  'Repeat',
  'Home',
  'BriefcaseMedical',
];

const ICON_MAP = {
  Wallet,
  HeartHandshake,
  ShoppingCart,
  GraduationCap,
  Repeat,
  Home,
  BriefcaseMedical,
};

const ICON_ACCESSIBLE_LABEL = {
  Wallet: 'Portemonnee',
  HeartHandshake: 'Overeenkomst',
  ShoppingCart: 'Winkelwagen',
  GraduationCap: 'Afstudeerhoed',
  Repeat: 'Herhaling',
  Home: 'Huis',
  FirstAidKit: 'EHBO',
};

const COLOR_TOKENS = ['green', 'blue', 'yellow', 'orange', 'purple', 'red', 'gray'];
const COLOR_LABELS = {
  green: 'Groen',
  blue: 'Blauw',
  yellow: 'Geel',
  orange: 'Oranje',
  purple: 'Paars',
  red: 'Rood',
  gray: 'Grijs',
};

const COLOR_STYLES = {
  green: { bg: 'bg-green-100', text: 'text-green-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
  red: { bg: 'bg-rose-100', text: 'text-rose-700' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

function getChipClasses(token) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs';
  if (!token || !COLOR_STYLES[token]) return `${base} bg-gray-100 text-gray-700`;
  const s = COLOR_STYLES[token];
  return `${base} ${s.bg} ${s.text}`;
}

function TypeChip({ name, iconName, colorToken, className, ariaLabel }) {
  const IconComp = ICON_MAP[iconName] || Wallet;
  return (
    <span className={`${getChipClasses(colorToken)} ${className || ''}`} aria-label={ariaLabel || `Type: ${name}`}>
      <IconComp className="size-3.5" aria-hidden="true" />
      <span className="truncate max-w-[180px]">{name}</span>
    </span>
  );
}

export default function FinancePage() {
  const [types, setTypes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentIdToCourseId, setStudentIdToCourseId] = useState(new Map());
  const [activeTab, setActiveTab] = useState('overview');

  // Date range for filters (inclusive)
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [rangeEnd, setRangeEnd] = useState(() => new Date());

  // Transactions table controls
  // Use explicit sentinel 'ALL' instead of empty string because Select.Item value cannot be empty
  const [txFilters, setTxFilters] = useState({ type: 'ALL', method: 'ALL' });

  const typeForm = useForm({
    defaultValues: { name: '', description: '', icon: null, color: null },
    mode: 'onSubmit',
  });

  const logForm = useForm({
    defaultValues: {
      type_id: '',
      student_id: '',
      course_id: '',
      amount: '',
      method: 'iDEAL',
      notes: '',
      transaction_type: 'income',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [t, l, s, cs] = await Promise.all([
          financeAPI.get_financial_types(),
          financeAPI.get_financial_logs(),
          studentAPI.get_students(),
          courseApi.get_courses(),
        ]);
        setTypes(t || []);
        setLogs(l || []);
        const mappedStudents = Array.isArray(s)
          ? s.map((st) => ({
            value: String(st.id),
            label: `${st.first_name} ${st.last_name}`,
          }))
          : [];
        setStudents(mappedStudents);
        const idToCourse = new Map();
        if (Array.isArray(s)) {
          for (const st of s) {
            if (st.class_layout && st.class_layout.course_id) {
              idToCourse.set(String(st.id), String(st.class_layout.course_id));
            }
          }
        }
        setStudentIdToCourseId(idToCourse);
        setCourses(
          Array.isArray(cs)
            ? cs.map((c) => ({ value: String(c.id), label: c.name }))
            : []
        );
      } catch (e) {
        console.error('Failed to load finance data', e);
        toast.error('Kon financiën niet laden.');
      } finally {
        // no-op
      }
    };
    load();
  }, []);

  const handleAddType = async (values) => {
    try {
      const payload = {
        name: values.name,
        ...(values.description ? { description: values.description } : {}),
        ...(values.icon ? { icon: values.icon } : {}),
        ...(values.color ? { color: values.color } : {}),
      };
      const created = await financeAPI.create_financial_type(payload);
      setTypes((prev) => [...prev, created.type]);
      setOpenTypeDialog(false);
      typeForm.reset({ name: '', description: '', icon: null, color: null });
      toast.success(`Type "${created.type.name}" aangemaakt`);
    } catch (e) {
      console.error('Create type failed', e);
      toast.error('Aanmaken financieel type mislukt');
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await financeAPI.delete_financial_type(id);
      setTypes((prev) => prev.filter((t) => t.id !== id));
      toast.success('Type verwijderd');
    } catch (e) {
      console.error('Delete type failed', e);
      toast.error('Verwijderen type mislukt (mogelijk gekoppelde logs)');
    }
  };

  const handleSubmitLog = async (values) => {
    const payload = {
      type_id: Number(values.type_id),
      student_id: values.student_id ? Number(values.student_id) : null,
      course_id: values.course_id ? Number(values.course_id) : null,
      amount: Number(values.amount),
      method: values.method,
      notes: values.notes,
      transaction_type: values.transaction_type,
    };
    try {
      if (editingLogId != null) {
        const updated = await financeAPI.update_financial_log(editingLogId, payload);
        const u = updated.log || updated;
        setLogs((prev) => prev.map((l) => (
          l.id === (u.id || editingLogId)
            ? {
              id: u.id,
              type: u.type?.name ?? '',
              student: u.student ? `${u.student.first_name} ${u.student.last_name}` : null,
              course: u.course ? u.course.name : null,
              amount: u.amount,
              method: u.method,
              notes: u.notes,
              date: u.date,
              transaction_type: u.transaction_type,
            }
            : l
        )));
        toast.success('Transactie bijgewerkt');
      } else {
        const created = await financeAPI.create_financial_log(payload);
        const c = created.log || created;
        setLogs((prev) => [
          {
            id: c.id,
            type: c.type?.name ?? '',
            student: c.student ? `${c.student.first_name} ${c.student.last_name}` : null,
            course: c.course ? c.course.name : null,
            amount: c.amount,
            method: c.method,
            notes: c.notes,
            date: c.date,
            transaction_type: c.transaction_type,
          },
          ...prev,
        ]);
        toast.success('Transactie toegevoegd');
      }
      setOpenLogDialog(false);
      setEditingLogId(null);
      logForm.reset({
        type_id: '',
        student_id: '',
        course_id: '',
        amount: '',
        method: 'iDEAL',
        notes: '',
        transaction_type: 'income',
      });
    } catch (e) {
      console.error('Submit log failed', e);
      toast.error('Opslaan transactie mislukt');
    }
  };

  const handleViewLog = useCallback((log) => {
    setViewLog(log);
    setOpenViewDialog(true);
  }, []);

  const startEditLog = useCallback((log) => {
    try {
      setEditingLogId(log.id);
      const typeMatch = types.find((t) => String(t.name) === String(log.type));
      logForm.reset({
        type_id: typeMatch ? String(typeMatch.id) : '',
        student_id: '',
        course_id: '',
        amount: String(log.amount ?? ''),
        method: log.method || 'iDEAL',
        notes: log.notes || '',
        transaction_type: log.transaction_type || 'income',
      });
      setOpenLogDialog(true);
    } catch (e) {
      console.error('Failed to start edit dialog', e);
      toast.error('Kon bewerken niet starten');
    }
  }, [logForm, types]);

  const handleDeleteLog = useCallback(async (id) => {
    try {
      await financeAPI.delete_financial_log(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success('Transactie verwijderd');
    } catch (e) {
      console.error('Delete log failed', e);
      toast.error('Verwijderen transactie mislukt');
    }
  }, []);

  const formatDateNl = (value) => {
    try {
      return new Date(value).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(value ?? '');
    }
  };

  // Helper: filter logs by selected date range
  const logsInRange = useMemo(() => {
    if (!Array.isArray(logs)) return [];
    try {
      const start = new Date(rangeStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(rangeEnd);
      end.setHours(23, 59, 59, 999);
      return logs.filter((l) => {
        const d = new Date(l.date);
        return d >= start && d <= end;
      });
    } catch {
      return logs;
    }
  }, [logs, rangeStart, rangeEnd]);

  // Overview summary calculations
  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const l of logsInRange) {
      const amt = Number(l.amount) || 0;
      if (l.transaction_type === 'income') income += amt;
      else if (l.transaction_type === 'expense') expense += amt;
    }
    return { totalIncome: income, totalExpenses: expense, netBalance: income - expense };
  }, [logsInRange]);

  // Chart configs & palettes
  const lineChartConfig = useMemo(() => ({
    income: { label: 'Inkomen', color: '#16a34a' },
    expense: { label: 'Uitgaven', color: '#dc2626' },
  }), []);

  const donutColors = useMemo(
    () => ['#6366F1', '#22C55E', '#F43F5E', '#F59E0B', '#06B6D4', '#8B5CF6', '#84CC16', '#3B82F6'],
    []
  );


  // Chart data: group by date (day)
  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const l of logsInRange) {
      const key = new Date(l.date).toLocaleDateString('nl-NL');
      if (!map.has(key)) map.set(key, { date: key, income: 0, expense: 0 });
      const entry = map.get(key);
      if (l.transaction_type === 'income') entry.income += Number(l.amount);
      else entry.expense += Number(l.amount);
    }
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logsInRange]);

  // Donut: expense distribution by type
  const expenseByType = useMemo(() => {
    const map = new Map();
    for (const l of logsInRange) {
      if (l.transaction_type !== 'expense') continue;
      const key = l.type || 'Onbekend';
      map.set(key, (map.get(key) || 0) + Number(l.amount));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [logsInRange]);

  const donutTotal = useMemo(() => {
    return expenseByType.reduce((sum, it) => sum + (Number(it.value) || 0), 0);
  }, [expenseByType]);

  const recentTx = useMemo(() => logsInRange.slice(0, 5), [logsInRange]);

  // Transactions table data (filtered by controls)
  const txFiltered = useMemo(() => {
    return logsInRange.filter((l) => {
      if (txFilters.type !== 'ALL' && String(l.type) !== txFilters.type) return false;
      if (txFilters.method !== 'ALL' && l.method !== txFilters.method) return false;
      return true;
    });
  }, [logsInRange, txFilters]);

  // Table columns and state for Transactions tab
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const eurFormatter = useMemo(() => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }), []);

  const columns = useMemo(() => {
    const byName = new Map(types.map((t) => [t.name, t]));
    return [
      { header: 'Datum', accessorKey: 'date', cell: (info) => formatDateNl(info.getValue()) },
      { header: 'Transactie', accessorKey: 'transaction_type', cell: (info) => (info.getValue() === 'income' ? 'Inkomen' : 'Uitgave') },
      {
        header: 'Type', accessorKey: 'type', cell: (info) => {
          const name = String(info.getValue() ?? '');
          const meta = byName.get(name);
          return (
            <TypeChip
              name={name || 'Onbekend'}
              iconName={(meta && meta.icon) ? meta.icon : 'Wallet'}
              colorToken={(meta && meta.color) ? meta.color : null}
              ariaLabel={`Type: ${name || 'Onbekend'}`}
            />
          );
        }
      },
      { header: 'Lespakket', accessorKey: 'course' },
      { header: 'Bedrag', accessorKey: 'amount', cell: (info) => eurFormatter.format(info.getValue()) },
      { header: 'Methode', accessorKey: 'method' },
      {
        header: 'Acties', id: 'actions', cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="icon" title="Bekijken" onClick={() => handleViewLog(row.original)}>
              <Eye className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Bewerken" onClick={() => startEditLog(row.original)}>
              <Edit className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(row.original.id)} title="Verwijderen">
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [eurFormatter, handleDeleteLog, types, handleViewLog, startEditLog]);

  const table = useReactTable({
    data: txFiltered,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financiën"
        icon={<CircleDollarSign className="size-9" />}
        description="Beheer financiële types en transacties."
      >
        <div className="flex items-center gap-2">
          {/* <div className="flex gap-2 items-center">
            <DatePicker value={rangeStart} onChange={setRangeStart} />
            <DatePicker value={rangeEnd} onChange={setRangeEnd} />
          </div> */}
          <div className="flex gap-2">
            <Button onClick={() => { setEditingLogId(null); setOpenLogDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nieuwe Transactie
            </Button>
            <Button variant="outline" onClick={() => setOpenTypeDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nieuw Type
            </Button>
          </div>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="inline-flex cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            Overzicht
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="inline-flex cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            Transacties
          </TabsTrigger>
          <TabsTrigger
            value="manage_types"
            className="inline-flex cursor-pointer rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            Types beheren
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <FinanceStatCard
              icon={TrendingUp}
              title="Totaal inkomen"
              value={eurFormatter.format(totalIncome)}
              accentClass="bg-primary/20 text-primary"
              valueClass="text-primary"
            />
            <FinanceStatCard
              icon={TrendingDown}
              title="Totaal uitgaven"
              value={eurFormatter.format(totalExpenses)}
              accentClass="bg-rose-100 text-rose-700"
              valueClass="text-rose-700"
            />
            <FinanceStatCard
              icon={Calculator}
              title="Netto"
              value={eurFormatter.format(netBalance)}
              accentClass={netBalance < 0 ? 'bg-rose-100 text-rose-700' : 'bg-primary/30 text-primary'}
              valueClass={netBalance < 0 ? 'text-rose-700' : 'text-primary'}
            />
            <FinanceStatCard
              icon={ReceiptText}
              title="Aantal transacties"
              value={String(logsInRange.length)}
              accentClass="bg-blue-100 text-blue-700"
              valueClass="text-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Card className="p-4">
                <h4 className="text-lg font-medium mb-2">Inkomen en uitgaven</h4>
                <ChartContainer className="h-[200px] md:h-[220px] aspect-auto items-center" config={lineChartConfig}>
                  <LineChart data={groupedByDate} margin={{ top: 8, right: 12, bottom: 8, left: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend wrapperStyle={{ position: 'absolute', bottom: 4, left: 8, right: 8 }} content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="income" name="Inkomen" stroke="var(--color-income)" strokeWidth={1.75} dot={{ r: 1.5 }} />
                    <Line type="monotone" dataKey="expense" name="Uitgaven" stroke="var(--color-expense)" strokeWidth={1.75} dot={{ r: 1.5 }} />
                  </LineChart>
                </ChartContainer>
              </Card>
            </div>
            <div>
              <ExpensesByTypeDonut title="Uitgaven per type" expenseByType={expenseByType} donutColors={donutColors} />
            </div>
          </div>

          <Card className="p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Recente transacties</h3>
              <Button variant="link" onClick={() => setActiveTab('transactions')}>Alles bekijken</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Leerling</TableHead>
                  <TableHead>Lespakket</TableHead>
                  <TableHead>Bedrag</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTx.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{formatDateNl(l.date)}</TableCell>
                    <TableCell>{l.transaction_type === 'income' ? 'Inkomen' : 'Uitgave'}</TableCell>
                    <TableCell>{l.student || '-'}</TableCell>
                    <TableCell>{l.course || '-'}</TableCell>
                    <TableCell className={l.transaction_type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(l.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLog(l.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {recentTx.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Geen transacties gevonden.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Select value={txFilters.type} onValueChange={(v) => setTxFilters((prev) => ({ ...prev, type: v }))}>
              <SelectTrigger className="h-8 w-[180px]"><SelectValue placeholder="Alle types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle types</SelectItem>
                {types.map((t) => <SelectItem key={t.id} value={String(t.name)}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={txFilters.method} onValueChange={(v) => setTxFilters((prev) => ({ ...prev, method: v }))}>
              <SelectTrigger className="h-8 w-[140px]"><SelectValue placeholder="Methode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle methodes</SelectItem>
                <SelectItem value="iDEAL">iDEAL</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="w-full overflow-auto">
              <DataTable table={table} columns={columns} />
            </div>
          </div>
        </TabsContent>

        {/* MANAGE TYPES */}
        <TabsContent value="manage_types" className="mt-6">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Types</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <TypeChip
                        name={t.name}
                        iconName={t.icon || 'Wallet'}
                        colorToken={t.color || null}
                        ariaLabel={`Type: ${t.name}`}
                      />
                    </TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteType(t.id)} title="Verwijderen">
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {types.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">Geen types gevonden.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Type Dialog */}
      <Dialog open={openTypeDialog} onOpenChange={setOpenTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw Financieel Type</DialogTitle>
          </DialogHeader>
          <Form {...typeForm}>
            <form
              onSubmit={typeForm.handleSubmit(handleAddType)}
              className="space-y-4"
            >
              <FormField
                control={typeForm.control}
                name="name"
                rules={{ required: 'Naam is verplicht' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Bijv. Lesgeld" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Input placeholder="Korte omschrijving" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Color Picker */}
              <FormField
                control={typeForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kleur (optioneel)</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select
                        value={field.value ?? undefined}
                        onValueChange={(v) => field.onChange(v)}
                      >
                        <SelectTrigger aria-label="Kleur kiezen" className="w-[220px]">
                          <SelectValue placeholder="Geen kleur" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_TOKENS.map((t) => (
                            <SelectItem key={t} value={t}>
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${COLOR_STYLES[t].bg}`} aria-hidden="true" />
                                <span>{COLOR_LABELS[t]}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => field.onChange(null)}
                        aria-label="Kleur wissen"
                      >
                        Wissen
                      </Button>
                    </div>
                  </FormItem>
                )}
              />

              {/* Icon Picker */}
              <FormField
                control={typeForm.control}
                name="icon"
                render={({ field }) => {
                  const selected = field.value;
                  return (
                    <FormItem>
                      <FormLabel>Pictogram (optioneel)</FormLabel>
                      <div role="radiogroup" aria-label="Pictogram kiezen" className="grid grid-cols-7 gap-2 sm:grid-cols-7">
                        {ICON_OPTIONS.map((opt) => {
                          const IconComp = ICON_MAP[opt] || Wallet;
                          const isSelected = selected === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              aria-label={ICON_ACCESSIBLE_LABEL[opt] || opt}
                              onClick={() => field.onChange(isSelected ? null : opt)}
                              className={`h-9 w-9 inline-flex items-center justify-center rounded-md border bg-white hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary ${isSelected ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                            >
                              <IconComp className="size-4" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                          aria-label="Pictogram wissen"
                        >
                          Wissen
                        </Button>
                      </div>
                    </FormItem>
                  );
                }}
              />

              {/* Live Preview */}
              <div className="flex items-center justify-between rounded-md border p-2">
                {(() => {
                  const namePrev = typeForm.watch('name');
                  const iconPrev = typeForm.watch('icon');
                  const colorPrev = typeForm.watch('color');
                  const label = namePrev?.trim() ? namePrev : 'T';
                  return (
                    <TypeChip
                      name={label}
                      iconName={iconPrev || 'Wallet'}
                      colorToken={colorPrev || null}
                      ariaLabel={`Voorbeeld: ${label}`}
                    />
                  );
                })()}
                <span className="text-xs text-muted-foreground">Voorbeeld</span>
              </div>
              <DialogFooter>
                <Button type="submit">Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Log Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transactie</DialogTitle>
          </DialogHeader>
          {viewLog ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Datum</span>
                <span>{formatDateNl(viewLog.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <TypeChip name={viewLog.type || 'Onbekend'} iconName={(types.find(t => t.name === viewLog.type)?.icon) || 'Wallet'} colorToken={(types.find(t => t.name === viewLog.type)?.color) || null} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transactie</span>
                <span>{viewLog.transaction_type === 'income' ? 'Inkomen' : 'Uitgave'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Leerling</span>
                <span>{viewLog.student || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lespakket</span>
                <span>{viewLog.course || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Methode</span>
                <span>{viewLog.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bedrag</span>
                <span className={viewLog.transaction_type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {eurFormatter.format(viewLog.amount)}
                </span>
              </div>
              {viewLog.notes ? (
                <div>
                  <div className="text-muted-foreground">Opmerking</div>
                  <div className="mt-1 whitespace-pre-wrap">{viewLog.notes}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Log Dialog */}
      <Dialog
        open={openLogDialog}
        onOpenChange={(v) => {
          setOpenLogDialog(v);
          if (v) {
            if (editingLogId == null) {
              logForm.reset({
                type_id: '',
                student_id: '',
                course_id: '',
                amount: '',
                method: 'iDEAL',
                notes: '',
                transaction_type: 'income',
              });
            }
          } else {
            setEditingLogId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLogId != null ? 'Transactie bewerken' : 'Nieuwe Transactie'}</DialogTitle>
          </DialogHeader>
          <Form {...logForm}>
            <form
              onSubmit={logForm.handleSubmit(handleSubmitLog)}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={logForm.control}
                  name="type_id"
                  rules={{ required: 'Type is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kies type" />
                        </SelectTrigger>
                        <SelectContent>
                          {types.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="amount"
                  rules={{ required: 'Bedrag is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrag (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={logForm.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leerling (optioneel)</FormLabel>
                      <FormControl>
                        <ComboboxField
                          items={students}
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            const detected = studentIdToCourseId.get(String(v));
                            if (detected) {
                              logForm.setValue('course_id', detected);
                            }
                          }}
                          placeholder="Kies leerling"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="course_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lespakket (optioneel)</FormLabel>
                      <FormControl>
                        <ComboboxField
                          items={courses}
                          value={field.value}
                          onChange={(v) => field.onChange(v)}
                          placeholder="Kies lespakket"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Methode</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kies methode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iDEAL">iDEAL</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transactie</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Inkomen</SelectItem>
                          <SelectItem value="expense">Uitgave</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={logForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opmerking</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white"
                        placeholder="Optioneel"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
