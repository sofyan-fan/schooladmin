import moduleAPI from '@/apis/moduleAPI';
import studentAPI from '@/apis/studentAPI';
import BookCard from '@/components/books/BookCard';
import { createColumns } from '@/components/books/columns';
import DeleteBookDialog from '@/components/books/DeleteDialog';
import BookEditModal from '@/components/books/EditModal';
import BookViewModal from '@/components/books/ViewModal';
import ViewToggle from '@/components/books/ViewToggle';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LibraryBig } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'boekenvoorraadRecords';

function safeJsonParseArray(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = safeJsonParseArray(raw);
    return arr;
  } catch (e) {
    console.warn('Failed to read local book ledger records', e);
    return [];
  }
}

function saveLocalRecords(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to save local book ledger records', e);
  }
}

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function toNonNegativeInt(raw, fallback = 0) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i < 0 ? 0 : i;
}

function normalizeAllocations(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      const studentId =
        a?.studentId !== undefined && a?.studentId !== null
          ? String(a.studentId).trim()
          : '';
      const qty = toNonNegativeInt(a?.qty, 0);
      return { studentId, qty };
    })
    .filter((a) => a.studentId && a.qty > 0);
}

function isAggregatedRecord(r) {
  return (
    r &&
    (r.totalCount !== undefined ||
      r.total_amount !== undefined ||
      Array.isArray(r.allocations))
  );
}

function migrateLocalRecords(rawRecords) {
  const now = new Date().toISOString();
  const input = Array.isArray(rawRecords) ? rawRecords : [];

  const aggregated = [];
  const legacy = [];

  for (const r of input) {
    if (isAggregatedRecord(r)) aggregated.push(r);
    else legacy.push(r);
  }

  const normalizedAggregated = aggregated
    .map((r) => {
      const id = r?.id ? String(r.id) : newId();
      const title = String(r?.title || '').trim();
      const moduleId =
        r?.moduleId !== undefined && r?.moduleId !== null
          ? String(r.moduleId)
          : r?.courseModuleId !== undefined && r?.courseModuleId !== null
            ? String(r.courseModuleId)
            : '';
      const totalCount = toNonNegativeInt(
        r?.totalCount !== undefined ? r.totalCount : r?.total_amount,
        0
      );
      const allocations = normalizeAllocations(r?.allocations);
      const notes = String(r?.notes || '').trim();
      const addedAt = r?.addedAt || r?.createdAt || now;
      const updatedAt = r?.updatedAt || now;

      return {
        id,
        title,
        moduleId,
        totalCount,
        allocations,
        notes,
        addedAt,
        updatedAt,
      };
    })
    .filter((r) => r.title && r.moduleId);

  if (!legacy.length) {
    return { records: normalizedAggregated, didMigrate: aggregated.length !== normalizedAggregated.length };
  }

  // Legacy format migration: one row per physical copy (optionally with studentId).
  // We group by (moduleId, title) and convert to aggregated totals + per-student quantities.
  const groups = new Map();
  for (const r of legacy) {
    const title = String(r?.title || '').trim();
    const moduleId =
      r?.moduleId !== undefined && r?.moduleId !== null ? String(r.moduleId) : '';
    if (!title || !moduleId) continue;
    const key = `${moduleId}\u0000${title}`;
    const arr = groups.get(key) || [];
    arr.push(r);
    groups.set(key, arr);
  }

  const migratedLegacy = Array.from(groups.values()).map((group) => {
    const sample = group[0] || {};
    const title = String(sample?.title || '').trim();
    const moduleId =
      sample?.moduleId !== undefined && sample?.moduleId !== null
        ? String(sample.moduleId)
        : '';

    const allocMap = new Map();
    for (const item of group) {
      const sid =
        item?.studentId !== undefined && item?.studentId !== null
          ? String(item.studentId).trim()
          : '';
      if (!sid) continue;
      allocMap.set(sid, (allocMap.get(sid) || 0) + 1);
    }

    const allocations = Array.from(allocMap.entries()).map(([studentId, qty]) => ({
      studentId,
      qty,
    }));

    const addedAt =
      group
        .map((g) => g?.addedAt)
        .filter(Boolean)
        .sort()[0] || now;
    const updatedAt =
      group
        .map((g) => g?.updatedAt)
        .filter(Boolean)
        .sort()
        .slice(-1)[0] || now;

    return {
      id: sample?.id ? String(sample.id) : newId(),
      title,
      moduleId,
      totalCount: group.length,
      allocations,
      notes: '',
      addedAt,
      updatedAt,
    };
  });

  return {
    records: [...normalizedAggregated, ...migratedLegacy],
    didMigrate: true,
  };
}

function seedInitialRecords({ modules, students }) {
  const now = new Date().toISOString();
  const m = (modules || []).slice(0, 4);
  const s = (students || []).slice(0, 4);
  if (!m.length) return [];

  const records = [];

  m.forEach((mod, idx) => {
    const s1 = s[idx % (s.length || 1)];
    const s2 = s[(idx + 1) % (s.length || 1)];

    const allocationsLesboek = [];
    if (s1?.id != null) allocationsLesboek.push({ studentId: String(s1.id), qty: 1 });
    if (s2?.id != null && String(s2.id) !== String(s1?.id))
      allocationsLesboek.push({ studentId: String(s2.id), qty: 1 });

    records.push({
      id: newId(),
      title: 'Lesboek',
      moduleId: String(mod.id),
      totalCount: 20,
      allocations: allocationsLesboek,
      notes: '',
      addedAt: now,
      updatedAt: now,
    });

    const allocationsWerkboek = [];
    if (s1?.id != null) allocationsWerkboek.push({ studentId: String(s1.id), qty: 1 });

    records.push({
      id: newId(),
      title: 'Werkboek',
      moduleId: String(mod.id),
      totalCount: 18,
      allocations: allocationsWerkboek,
      notes: '',
      addedAt: now,
      updatedAt: now,
    });
  });

  return records;
}

export default function BooksStockPage() {
  const [records, setRecords] = useState([]);
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('table'); // 'table' | 'cards'

  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // table state
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    let mounted = true;

    // Load local first so offline usage works immediately
    const rawLocal = readLocalRecords();
    const { records: migrated, didMigrate } = migrateLocalRecords(rawLocal);
    if (didMigrate) saveLocalRecords(migrated);
    if (mounted && migrated.length) setRecords(migrated);

    (async () => {
      setLoading(true);
      try {
        const [modulesData, studentsData] = await Promise.all([
          moduleAPI.get_modules(),
          studentAPI.get_students(),
        ]);

        const mappedModules = (modulesData || []).map((m) => ({
          id: m.id,
          name: m.name || m.title || `Module ${m.id}`,
        }));
        const mappedStudents = (studentsData || []).map((s) => ({
          id: s.id,
          firstName: s.first_name || '',
          lastName: s.last_name || '',
        }));

        if (!mounted) return;
        setModules(mappedModules);
        setStudents(mappedStudents);

        // If nothing stored locally, seed with a few example books that reference real modules/students
        const latestRaw = readLocalRecords();
        const { records: latest, didMigrate: didMigrateAgain } =
          migrateLocalRecords(latestRaw);
        if (didMigrateAgain) saveLocalRecords(latest);

        if (!latest.length && mappedModules.length) {
          const seeded = seedInitialRecords({
            modules: mappedModules,
            students: mappedStudents,
          });
          setRecords(seeded);
          saveLocalRecords(seeded);
          if (seeded.length) toast.info('Voorbeeldboeken zijn toegevoegd (lokaal).');
        }
      } catch (e) {
        console.error('Failed to load modules/students for boekenvoorraad', e);
        toast.error('Kon modules/leerlingen niet laden voor Boekenvoorraad.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const studentsById = useMemo(
    () => new Map((students || []).map((s) => [String(s.id), s])),
    [students]
  );
  const modulesById = useMemo(
    () => new Map((modules || []).map((m) => [String(m.id), m])),
    [modules]
  );

  const rows = useMemo(() => {
    return (records || []).map((r) => {
      const module = modulesById.get(String(r.moduleId));
      const moduleName =
        module?.name || (r.moduleId ? `Module ${String(r.moduleId)}` : '—');

      const totalCount = toNonNegativeInt(r?.totalCount, 0);
      const allocations = normalizeAllocations(r?.allocations);
      const ownedCount = allocations.reduce((sum, a) => sum + (a.qty || 0), 0);
      const inStoreCount = Math.max(totalCount - ownedCount, 0);

      const allocationsDetailed = allocations
        .map((a) => {
          const st = studentsById.get(String(a.studentId));
          const studentName = st
            ? `${st.firstName || ''} ${st.lastName || ''}`.trim() ||
              `Student ${a.studentId}`
            : `Student ${a.studentId}`;
          return { ...a, studentName };
        })
        .sort((a, b) => a.studentName.localeCompare(b.studentName, 'nl'));

      return {
        ...r,
        moduleName,
        totalCount,
        allocations,
        allocationsDetailed,
        ownedCount,
        inStoreCount,
      };
    });
  }, [records, modulesById, studentsById]);

  const stats = useMemo(() => {
    const titles = rows.length;
    const total = rows.reduce((sum, r) => sum + (r?.totalCount || 0), 0);
    const owned = rows.reduce((sum, r) => sum + (r?.ownedCount || 0), 0);
    const inStore = rows.reduce((sum, r) => sum + (r?.inStoreCount || 0), 0);
    return { titles, total, owned, inStore };
  }, [rows]);

  const handleAddNew = useCallback(() => {
    setSelected({});
    setOpenEdit(true);
  }, []);

  const handleViewChange = useCallback((next) => {
    if (next) setView(next);
  }, []);

  const handleView = useCallback((record) => {
    setSelected(record);
    setOpenView(true);
  }, []);

  const handleEdit = useCallback((record) => {
    setSelected(record);
    setOpenEdit(true);
  }, []);

  const handleDelete = useCallback((id) => {
    if (!id) return;
    setPendingDeleteId(id);
    setOpenDelete(true);
  }, []);

  const handleSave = useCallback(
    (updated) => {
      const now = new Date().toISOString();
      const isEdit = Boolean(updated?.id);

      const totalCount = toNonNegativeInt(updated?.totalCount, 0);
      const allocations = normalizeAllocations(updated?.allocations);
      const ownedCount = allocations.reduce((sum, a) => sum + (a.qty || 0), 0);
      if (ownedCount > totalCount) {
        toast.error('In bezit kan niet groter zijn dan het totaal.');
        return;
      }

      if (isEdit) {
        setRecords((prev) => {
          const next = (prev || []).map((r) =>
            r.id === updated.id
              ? {
                  ...r,
                  title: String(updated?.title || '').trim(),
                  moduleId: String(updated?.moduleId || '').trim(),
                  totalCount,
                  allocations,
                  notes: String(updated?.notes || '').trim(),
                  updatedAt: now,
                }
              : r
          );
          saveLocalRecords(next);
          return next;
        });
        toast.success('Boek is succesvol bijgewerkt.');
      } else {
        const created = {
          id: newId(),
          title: String(updated?.title || '').trim(),
          moduleId: String(updated?.moduleId || '').trim(),
          totalCount,
          allocations,
          notes: String(updated?.notes || '').trim(),
          addedAt: now,
          updatedAt: now,
        };
        setRecords((prev) => {
          const next = [created, ...(prev || [])];
          saveLocalRecords(next);
          return next;
        });
        toast.success('Boek is succesvol toegevoegd.');
      }
      setOpenEdit(false);
    },
    [setRecords]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteId) return;
    const toDelete = records.find((r) => r.id === pendingDeleteId);
    const title = toDelete?.title || 'Boek';

    setRecords((prev) => {
      const next = (prev || []).filter((r) => r.id !== pendingDeleteId);
      saveLocalRecords(next);
      return next;
    });

    if (selected?.id === pendingDeleteId) {
      setOpenEdit(false);
      setOpenView(false);
      setSelected(null);
    }
    setOpenDelete(false);
    setPendingDeleteId(null);
    toast.success(`"${title}" is verwijderd.`);
  }, [pendingDeleteId, records, selected?.id]);

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const NoDataRow = (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <LibraryBig className="size-12 text-gray-400" />
          <h3 className="text-xl font-semibold">Geen boeken gevonden</h3>
          <p className="text-muted-foreground">
            Begin door een nieuw boek toe te voegen.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <PageHeader
        title="Boekenvoorraad"
        icon={<LibraryBig className="size-9" />}
        description="Beheer hier de boekenvoorraad en registreer welke leerling welk boek heeft."
        buttonText="Nieuw boek"
        onAdd={handleAddNew}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="secondary" className="px-2.5 py-0.5">
          Titels: {stats.titles}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2.5 py-0.5 bg-amber-50 text-amber-800"
        >
          In bezit: {stats.owned}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700"
        >
          In store: {stats.inStore}
        </Badge>
        <Badge variant="secondary" className="px-2.5 py-0.5">
          Totaal: {stats.total}
        </Badge>
      </div>

      <Toolbar
        table={table}
        filterColumn="title"
        rightActions={<ViewToggle view={view} onViewChange={handleViewChange} />}
      />

      {view === 'table' ? (
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[720px]">
            <DataTable
              table={table}
              loading={loading}
              columns={columns}
              NoDataComponent={NoDataRow}
            />
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-6 shadow-sm space-y-3"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : table.getRowModel().rows?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {table.getRowModel().rows.map((row) => (
            <BookCard
              key={row.id}
              book={row.original}
              onView={() => handleView(row.original)}
              onEdit={() => handleEdit(row.original)}
              onDelete={() => handleDelete(row.original.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <LibraryBig className="size-12 text-gray-400" />
            <h3 className="text-xl font-semibold">Geen boeken gevonden</h3>
            <p className="text-muted-foreground">
              Begin door een nieuw boek toe te voegen.
            </p>
          </div>
        </div>
      )}

      <BookViewModal
        open={openView}
        onOpenChange={setOpenView}
        book={selected}
        onEdit={
          selected
            ? () => {
                setOpenView(false);
                setOpenEdit(true);
              }
            : undefined
        }
      />

      <BookEditModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        book={selected || {}}
        modules={modules}
        students={students}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <DeleteBookDialog
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleConfirmDelete}
        bookTitle={(() => {
          const r = records.find((x) => x.id === pendingDeleteId);
          return r?.title || '';
        })()}
      />
    </>
  );
}


