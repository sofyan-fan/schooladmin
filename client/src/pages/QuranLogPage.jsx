import studentLogAPI from '@/apis/studentLogAPI';
import PageHeader from '@/components/shared/PageHeader';
import QuranLogDialog from '@/components/students/QuranLogDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ComboboxField from '@/components/ui/combobox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookCheck, FileDown, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function QuranLogPage() {
  const [students, setStudents] = useState([]);
  const [subjects] = useState([{ value: 'quran', label: "Qur'an" }]);
  const [subjectTypes] = useState([
    { value: 'reading', label: 'Lezen' },
    { value: 'memorization', label: 'Memorisatie' },
    { value: 'revision', label: 'Herhaling' },
  ]);

  const [filters, setFilters] = useState({
    subjectType: 'memorization',
    subject: 'quran',
    studentId: '',
  });

  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState({
    from: '',
    to: '',
    date: '',
    description: '',
    memorized: false,
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Load all logs once; in a real app, you might filter server-side
        const all = await studentLogAPI.get_logs();
        if (!mounted) return;
        setLogs(
          (all || []).map((l) => ({
            id: l.id,
            studentId: String(l.student_id),
            from: l.start_log,
            to: l.end_log,
            date: l.date ? new Date(l.date).toISOString().slice(0, 10) : '',
            description: l.comment || '',
            memorized: Boolean(l.completed),
          }))
        );

        // Minimal students list from logs (fallback until dedicated endpoint)
        const unique = new Map();
        for (const l of all || []) {
          const id = String(l.student_id);
          if (!unique.has(id)) {
            const name = l.student
              ? `${l.student.first_name ?? ''} ${
                  l.student.last_name ?? ''
                }`.trim() || `Student ${id}`
              : `Student ${id}`;
            unique.set(id, { value: id, label: name });
          }
        }
        if (unique.size > 0) setStudents(Array.from(unique.values()));
      } catch (e) {
        console.error('Failed to load student logs', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addLog = async () => {
    if (!filters.studentId || !newLog.from || !newLog.to) return false;
    try {
      const payload = {
        student_id: Number(filters.studentId),
        date: newLog.date || new Date().toISOString().slice(0, 10),
        start_log: String(newLog.from),
        end_log: String(newLog.to),
        completed: Boolean(newLog.memorized),
        comment: newLog.description || null,
      };
      const created = await studentLogAPI.create_log(payload);
      setLogs((prev) => [
        {
          id: created?.id ?? crypto.randomUUID(),
          studentId: String(payload.student_id),
          from: payload.start_log,
          to: payload.end_log,
          date: payload.date,
          description: payload.comment || '',
          memorized: payload.completed,
        },
        ...prev,
      ]);
      setNewLog({
        from: '',
        to: '',
        date: '',
        description: '',
        memorized: false,
      });
      return true;
    } catch (e) {
      console.error('Failed to create log', e);
      return false;
    }
  };

  const selectedStudent = useMemo(
    () => students.find((s) => s.value === filters.studentId)?.label || '-',
    [students, filters.studentId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qur'an Log"
        description="Registreer en beheer Qur'an-logs voor leerlingen."
        icon={<BookCheck className="size-9" />}
      >
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </PageHeader>

      <Card className=" space-y-4 flex flex-row bg-transparent shadow-none border-none  ">
        <div className="grid gap-4 sm:grid-cols-3">
          <ComboboxField
            label="Type"
            items={subjectTypes}
            value={filters.subjectType}
            onChange={(v) => setFilters((s) => ({ ...s, subjectType: v }))}
            placeholder="Kies type"
          />
          <ComboboxField
            label="Vak"
            items={subjects}
            value={filters.subject}
            onChange={(v) => setFilters((s) => ({ ...s, subject: v }))}
            placeholder="Kies vak"
          />
          <ComboboxField
            label="Leerling"
            items={students}
            value={filters.studentId}
            onChange={(v) => setFilters((s) => ({ ...s, studentId: v }))}
            placeholder="Kies leerling"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-4 items-end ">
          {/* <div className="grid gap-2">
            <Label htmlFor="from">Begin</Label>
            <Input
              id="from"
              value={newLog.from}
              onChange={(e) =>
                setNewLog((s) => ({ ...s, from: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to">Einde</Label>
            <Input
              id="to"
              value={newLog.to}
              onChange={(e) => setNewLog((s) => ({ ...s, to: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={newLog.date}
              onChange={(e) =>
                setNewLog((s) => ({ ...s, date: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor="memorized">Memorisatie</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="memorized"
                checked={newLog.memorized}
                onCheckedChange={(v) =>
                  setNewLog((s) => ({ ...s, memorized: Boolean(v) }))
                }
              />
              <span className="text-sm text-muted-foreground">Geleerd</span>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Omschrijving</Label>
          <Input
            id="description"
            value={newLog.description}
            onChange={(e) =>
              setNewLog((s) => ({ ...s, description: e.target.value }))
            }
            placeholder="Optioneel"
          />*/}
        </div>

        <div className="flex items-center">
          <Button onClick={() => setOpenAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Log toevoegen
          </Button>
        </div>
      </Card>

      <QuranLogDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        newLog={newLog}
        setNewLog={setNewLog}
        onSave={() => {
          const ok = addLog();
          if (ok) setOpenAddDialog(false);
        }}
      />

      <Card className="p-4 ">
        <h3 className="text-lg font-semibold mb-3">
          Logs voor: {selectedStudent}
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leerling</TableHead>
              <TableHead>Begin</TableHead>
              <TableHead>Einde</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead>Memo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs
              .filter(
                (l) =>
                  !filters.studentId ||
                  l.studentId === String(filters.studentId)
              )
              .map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{selectedStudent}</TableCell>
                  <TableCell>Vers {l.from}</TableCell>
                  <TableCell>Vers {l.to}</TableCell>
                  <TableCell>{l.date || '-'}</TableCell>
                  <TableCell>{l.description || '-'}</TableCell>
                  <TableCell>{l.memorized ? '✓' : '-'}</TableCell>
                </TableRow>
              ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Geen logs toegevoegd.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
