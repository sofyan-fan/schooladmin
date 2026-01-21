import { getChapters } from '@/apis/quranAPI';
import studentAPI from '@/apis/studentAPI';
import studentLogAPI from '@/apis/studentLogAPI';
import { createColumns as createQuranColumns } from '@/components/quranlog/columns';
import DeleteQuranLogDialog from '@/components/quranlog/DeleteDialog';
import EditQuranLogModal from '@/components/quranlog/EditModal';
import ViewQuranLogDialog from '@/components/quranlog/ViewModal';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import QuranLogDialog from '@/components/students/QuranLogDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ComboboxField from '@/components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { useQuranRelations } from '@/hooks/useQuranRelations';
import { parsePoint } from '@/utils/quran';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { BookCheck, ChevronDown, FileDown, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function QuranLogPage() {
  // Quran relations (for hizb computation)
  const { hizbFor } = useQuranRelations();
  const STORAGE_KEY = 'quranLogs';

  function isNumericId(id) {
    return typeof id === 'number' || /^\d+$/.test(String(id));
  }

  function parseScoreOrNull(raw) {
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 10) {
      throw new Error('Invalid score (must be an integer 0–10).');
    }
    return n;
  }

  function readLocalLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      console.warn('Failed to parse local Quran logs, resetting', e);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  function saveLocalLogs(nextLogs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLogs));
    } catch (e) {
      console.warn('Failed to save Quran logs locally', e);
    }
  }
  const [subjects] = useState([{ value: 'quran', label: "Qur'an" }, { value: 'nourania', label: 'Nourania' }, { value: 'tilawa', label: 'Tilawa' }, { value: 'tajweed', label: 'Tajweed' }, { value: 'hifdh', label: 'Hifdh' }]);
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
  const [dbStudents, setDbStudents] = useState([]);
  const [newLog, setNewLog] = useState({
    studentId: '',
    from: '',
    to: '',
    date: '',
    description: '',
    memorized: false,
    nourania: '',
    tilawa: '',
    tajweed: '',
    hifdh: '',
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editValue, setEditValue] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // table state
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    let mounted = true;

    // Load any locally stored logs immediately so the table can populate offline
    const local = readLocalLogs();
    if (mounted && local.length) {
      setLogs(local);
    }

    (async () => {
      try {
        const all = await studentLogAPI.get_logs();
        if (!mounted) return;
        const mapped = (all || []).map((l) => ({
          id: l.id,
          studentId: String(l.student_id),
          from: l.start_log,
          to: l.end_log,
          date: l.date ? new Date(l.date).toISOString().slice(0, 10) : '',
          description: l.comment || '',
          memorized: Boolean(l.completed),
          nourania: l.nourania_score ?? null,
          tilawa: l.tilawa_score ?? null,
          tajweed: l.tajweed_score ?? null,
          hifdh: l.hifdh_score ?? null,
        }));
        if (mapped.length) {
          setLogs(mapped);
          saveLocalLogs(mapped);
        }
      } catch (e) {
        // Stay silent besides logging; offline/local mode still works
        console.error('Failed to load student logs', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load students from DB for the combobox
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await studentAPI.get_students();
        if (cancelled) return;
        const mapped = (all || []).map((s) => ({
          value: String(s.id),
          label:
            `${s.first_name || ''} ${s.last_name || ''}`.trim() ||
            `Student ${s.id}`,
        }));
        setDbStudents(mapped);
      } catch (e) {
        console.error('Failed to load students', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addLog = async () => {
    if (!newLog.studentId || !newLog.from || !newLog.to || !newLog.date) {
      return false;
    }
    try {
      const selectedStudentId = newLog.studentId || '';
      const studentIdForLog = String(selectedStudentId);
      const canPersistToBackend = isNumericId(studentIdForLog);

      const payload = {
        student_id: canPersistToBackend ? Number(studentIdForLog) : undefined,
        date: newLog.date,
        start_log: String(newLog.from),
        end_log: String(newLog.to),
        completed: Boolean(newLog.memorized),
        comment: newLog.description || null,
        nourania_score: parseScoreOrNull(newLog.nourania),
        tilawa_score: parseScoreOrNull(newLog.tilawa),
        tajweed_score: parseScoreOrNull(newLog.tajweed),
        hifdh_score: parseScoreOrNull(newLog.hifdh),
      };
      let created;
      try {
        if (canPersistToBackend) {
          created = await studentLogAPI.create_log(payload);
        }
      } catch {
        // If backend is unavailable, continue with local-only creation
      }
      setLogs((prev) => {
        const next = [
          {
            id: created?.id ?? crypto.randomUUID(),
            studentId: studentIdForLog,
            from: payload.start_log,
            to: payload.end_log,
            date: payload.date,
            description: payload.comment || '',
            memorized: payload.completed,
            nourania: payload.nourania_score,
            tilawa: payload.tilawa_score,
            tajweed: payload.tajweed_score,
            hifdh: payload.hifdh_score,
          },
          ...prev,
        ];
        saveLocalLogs(next);
        return next;
      });
      setNewLog({
        studentId: '',
        from: '',
        to: '',
        date: '',
        description: '',
        memorized: false,
        nourania: '',
        tilawa: '',
        tajweed: '',
        hifdh: '',
      });
      return true;
    } catch (e) {
      console.error('Failed to create log', e);
      return false;
    }
  };

  const toggleMemorized = useCallback(
    async (id, nextValue) => {
      // Optimistic UI update
      setLogs((curr) => {
        const next = curr.map((l) =>
          l.id === id ? { ...l, memorized: nextValue } : l
        );
        saveLocalLogs(next);
        return next;
      });

      // Skip backend for local/non-numeric ids
      const target = logs.find((l) => l.id === id);
      const isLocal = target && String(target.studentId).startsWith('local:');
      const numericId = typeof id === 'number' || /^\d+$/.test(String(id));
      if (!numericId || isLocal) return;

      try {
        await studentLogAPI.update_log(id, { completed: Boolean(nextValue) });
      } catch (e) {
        console.error('Failed to update memorized state', e);
        // Keep optimistic state (do not revert)
      }
    },
    [logs]
  );

  // chapters for tooltip naming
  const [chapters, setChapters] = useState([]);
  useEffect(() => {
    getChapters()
      .then((c) => setChapters(c || []))
      .catch(() => { });
  }, []);
  const chapterById = useMemo(
    () => new Map(chapters.map((c) => [String(c.id), c])),
    [chapters]
  );
  const formatPointShort = useCallback(
    (raw) => {
      if (!raw) return '—';
      const p = parsePoint(String(raw));
      const s = p.surahId;
      const a = p.ayah;
      const h = p.hizb || hizbFor(s, a);
      // New short format: H{hizb} - {surah}:{ayah}
      if (h && (s || a)) return `H${h} - ${s || '—'}:${a || '—'}`;
      if (h) return `H${h}`;
      if (s || a) return `${s || '—'}:${a || '—'}`;
      return String(raw);
    },
    [hizbFor]
  );
  const renderPointTooltip = useCallback(
    (raw) => {
      if (!raw) return '—';
      const p = parsePoint(String(raw));
      const segs = [];
      if (p.surahId) {
        const name =
          chapterById.get(String(p.surahId))?.name_simple ||
          `Surah ${p.surahId}`;
        segs.push(name);
      }
      const h = p.hizb || hizbFor(p.surahId, p.ayah);
      if (h) segs.push(`Hizb ${h}`);
      if (p.ayah) segs.push(`Ayah ${p.ayah}`);
      if (!segs.length) return '—';
      return (
        <div className="text-sm leading-relaxed">
          {segs.map((ln, i) => (
            <div key={i}>{ln}</div>
          ))}
        </div>
      );
    },
    [chapterById, hizbFor]
  );

  // CRUD handlers
  const handleView = useCallback((record) => {
    setViewLog(record);
    setOpenViewDialog(true);
  }, []);
  const handleEdit = useCallback((record) => {
    setEditValue(record);
    setOpenEditDialog(true);
  }, []);
  const handleDelete = useCallback((id) => {
    setPendingDeleteId(id);
    setOpenDeleteDialog(true);
  }, []);
  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    const loadingToast = toast.loading('Log wordt verwijderd...');
    const numericId = isNumericId(pendingDeleteId);
    try {
      if (numericId) {
        await studentLogAPI.delete_log(pendingDeleteId);
      }
      setLogs((prev) => {
        const next = prev.filter((l) => l.id !== pendingDeleteId);
        saveLocalLogs(next);
        return next;
      });
      toast.success(numericId ? 'Log is verwijderd.' : 'Log is lokaal verwijderd.');
    } catch (e) {
      console.error(e);
      // If it doesn't exist on the server anymore, treat as deleted in UI.
      if (numericId && e?.response?.status === 404) {
        setLogs((prev) => {
          const next = prev.filter((l) => l.id !== pendingDeleteId);
          saveLocalLogs(next);
          return next;
        });
        toast.success('Log is verwijderd.');
      } else {
        toast.error('Verwijderen mislukt.');
      }
    } finally {
      toast.dismiss(loadingToast);
      setOpenDeleteDialog(false);
      setPendingDeleteId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editValue) return;
    const numericId = isNumericId(editValue.id);
    const nextScores = {
      nourania: parseScoreOrNull(editValue.nourania),
      tilawa: parseScoreOrNull(editValue.tilawa),
      tajweed: parseScoreOrNull(editValue.tajweed),
      hifdh: parseScoreOrNull(editValue.hifdh),
    };
    const payload = {
      date: editValue.date,
      start_log: String(editValue.from),
      end_log: String(editValue.to),
      completed: Boolean(editValue.memorized),
      comment: editValue.description || null,
      nourania_score: nextScores.nourania,
      tilawa_score: nextScores.tilawa,
      tajweed_score: nextScores.tajweed,
      hifdh_score: nextScores.hifdh,
    };
    const loadingToast = toast.loading('Opslaan...');
    try {
      if (numericId) {
        await studentLogAPI.update_log(editValue.id, payload);
      }
      setLogs((prev) => {
        const next = prev.map((l) =>
          l.id === editValue.id ? { ...l, ...editValue, ...nextScores } : l
        );
        saveLocalLogs(next);
        return next;
      });
      setOpenEditDialog(false);
      toast.success(numericId ? 'Log opgeslagen.' : 'Log lokaal opgeslagen.');
    } catch (e) {
      console.error(e);
      if (numericId && e?.response?.status === 404) {
        // Treat as local-only if it no longer exists server-side
        setLogs((prev) => {
          const next = prev.map((l) =>
            l.id === editValue.id ? { ...l, ...editValue, ...nextScores } : l
          );
          saveLocalLogs(next);
          return next;
        });
        setOpenEditDialog(false);
        toast.success('Log lokaal opgeslagen.');
      } else {
        toast.error('Opslaan mislukt.');
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const studentItems = useMemo(() => {
    const byId = new Map((dbStudents || []).map((s) => [s.value, s]));
    for (const l of logs || []) {
      const id = String(l.studentId);
      if (id.startsWith('local:') && !byId.has(id)) {
        byId.set(id, { value: id, label: 'Tijdelijke leerling' });
      }
    }
    return Array.from(byId.values());
  }, [dbStudents, logs]);

  // selectedStudent not needed in the new CRUD table

  const rows = useMemo(
    () =>
      (logs || [])
        .filter(
          (l) => !filters.studentId || l.studentId === String(filters.studentId)
        )
        .map((l) => ({
          ...l,
          studentLabel:
            studentItems.find((s) => s.value === l.studentId)?.label ||
            (l.studentId ? `Student ${l.studentId}` : '-'),
        })),
    [logs, studentItems, filters.studentId]
  );

  const columns = useMemo(
    () =>
      createQuranColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleMemo: toggleMemorized,
        formatPointShort,
        renderPointTooltip,
      }),
    [
      handleView,
      handleEdit,
      handleDelete,
      toggleMemorized,
      formatPointShort,
      renderPointTooltip,
    ]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const NoDataRow = (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        className="text-center text-muted-foreground"
      >
        Geen logs toegevoegd.
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qur'an-logboek"
        description="Registreer en beheer Qur'an-logs voor leerlingen."
        icon={<BookCheck className="size-9" />}
      >
        {/* <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div> */}
      </PageHeader>

      <Card className="bg-transparent shadow-none border-none py-1">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-3">
            {/* {(() => {
              const column = table.getColumn('studentLabel');
              return (
                <Input
                  placeholder="Zoek op Leerling"
                  value={column?.getFilterValue() ?? ''}
                  onChange={(e) => column?.setFilterValue(e.target.value)}
                  className="max-w-sm bg-card placeholder:italic"
                />
              );
            })()} */}
            <ComboboxField
              label="Vak"
              items={subjects}
              value={filters.subject}
              onChange={(v) => setFilters((s) => ({ ...s, subject: v }))}
              placeholder="Kies vak"
            />
            <ComboboxField
              label="Leerling"
              items={studentItems}
              value={filters.studentId}
              onChange={(v) => setFilters((s) => ({ ...s, studentId: v }))}
              placeholder="Kies leerling"
            />
          </div>

          <div className="ml-auto flex items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white">
                  Kolommen <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      className="capitalize cursor-pointer hover:text-white hover:bg-primary data-[highlighted]:text-white data-[highlighted]:bg-primary"
                      checked={col.getIsVisible()}
                      onCheckedChange={(value) => col.toggleVisibility(!!value)}
                    >
                      {col.columnDef.displayName ?? col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const rowsToExport = table.getFilteredRowModel().rows || [];
                  const workbook = new ExcelJS.Workbook();
                  const ws = workbook.addWorksheet('Quran Logs');
                  ws.columns = [
                    { header: 'Leerling', key: 'student', width: 28 },
                    { header: 'Begin', key: 'from', width: 22 },
                    { header: 'Einde', key: 'to', width: 22 },
                    { header: 'Datum', key: 'date', width: 14 },
                    { header: 'Gememoriseerd', key: 'memo', width: 10 },
                    { header: 'Nourania', key: 'nourania', width: 10 },
                    { header: 'Tilawa', key: 'tilawa', width: 10 },
                    { header: 'Tajweed', key: 'tajweed', width: 10 },
                    { header: 'Hifdh', key: 'hifdh', width: 10 },
                  ];
                  rowsToExport.forEach((r) => {
                    const o = r.original;
                    ws.addRow({
                      student: o.studentLabel,
                      from: formatPointShort(o.from),
                      to: formatPointShort(o.to),
                      date: o.date || '',
                      memo: o.memorized ? 'Ja' : 'Nee',
                      nourania: o.nourania ?? '',
                      tilawa: o.tilawa ?? '',
                      tajweed: o.tajweed ?? '',
                      hifdh: o.hifdh ?? '',
                    });
                  });
                  ws.getRow(1).font = { bold: true };
                  const buffer = await workbook.xlsx.writeBuffer();
                  const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  });
                  const fname = `quran_logs_${new Date().toISOString().split('T')[0]
                    }.xlsx`;
                  saveAs(blob, fname);
                  toast.success('Excel export gestart.');
                } catch (e) {
                  console.error(e);
                  toast.error('Export mislukt.');
                }
              }}
            >
              <FileDown className="mr-2 h-4 w-4" /> Exporteren
            </Button>

            <Button
              onClick={() => {
                // Prefill the new log with the currently selected student (if any)
                setNewLog((prev) => ({
                  ...prev,
                  studentId: filters.studentId || '',
                }));
                setOpenAddDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Log toevoegen
            </Button>
          </div>
        </div>
      </Card>

      <QuranLogDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        newLog={newLog}
        setNewLog={setNewLog}
        onSave={async () => {
          const ok = await addLog();
          if (ok) setOpenAddDialog(false);
        }}
      />

      {/* Toolbar replaced by consolidated controls above */}
      <DataTable
        table={table}
        loading={false}
        columns={columns}
        NoDataComponent={NoDataRow}
      />

      <ViewQuranLogDialog
        open={openViewDialog}
        onOpenChange={setOpenViewDialog}
        log={viewLog}
        studentLabel={
          viewLog
            ? studentItems.find((s) => s.value === viewLog.studentId)?.label ||
            (viewLog.studentId ? `Student ${viewLog.studentId}` : '-')
            : '-'
        }
      />

      <EditQuranLogModal
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        value={editValue}
        onChange={setEditValue}
        onSave={handleSaveEdit}
      />

      <DeleteQuranLogDialog
        isOpen={openDeleteDialog}
        onClose={setOpenDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
