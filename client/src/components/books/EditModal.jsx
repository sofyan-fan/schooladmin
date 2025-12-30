import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function toNonNegativeInt(raw, fallback = 0) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return fallback;
    const i = Math.floor(n);
    return i < 0 ? 0 : i;
}

function toPositiveInt(raw, fallback = 1) {
    const i = toNonNegativeInt(raw, fallback);
    return i <= 0 ? fallback : i;
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

export default function EditModal({
    open,
    onOpenChange,
    book,
    modules,
    students,
    onSave,
    onDelete,
}) {
    const [form, setForm] = useState(() => ({
        title: '',
        moduleId: '',
        totalCount: '0',
        notes: '',
        allocations: [],
    }));
    const [errors, setErrors] = useState(() => ({
        title: '',
        moduleId: '',
        totalCount: '',
        allocations: '',
    }));
    const [allocDraft, setAllocDraft] = useState(() => ({
        studentId: '',
        qty: '1',
    }));

    useEffect(() => {
        if (!open) return;
        const b = book || {};
        setForm({
            title: b.title || '',
            moduleId: b.moduleId != null ? String(b.moduleId) : '',
            totalCount:
                b.totalCount !== undefined && b.totalCount !== null
                    ? String(b.totalCount)
                    : '0',
            notes: b.notes || '',
            allocations: normalizeAllocations(b.allocations || []),
        });
        setAllocDraft({ studentId: '', qty: '1' });
        setErrors({ title: '', moduleId: '', totalCount: '', allocations: '' });
    }, [book, open]);

    const moduleItems = useMemo(() => {
        const base = (Array.isArray(modules) ? modules : [])
            .filter((m) => m?.id != null)
            .map((m) => ({ value: String(m.id), label: m.name || `Module ${m.id}` }));

        // Ensure the currently selected module exists in the dropdown (even if deleted from DB)
        const byId = new Map(base.map((m) => [String(m.value), m]));
        if (form.moduleId && !byId.has(String(form.moduleId))) {
            byId.set(String(form.moduleId), {
                value: String(form.moduleId),
                label: `Module ${form.moduleId}`,
            });
        }
        return Array.from(byId.values());
    }, [modules, form.moduleId]);

    const studentItems = useMemo(() => {
        const base = (Array.isArray(students) ? students : [])
            .filter((s) => s?.id != null)
            .map((s) => ({
                value: String(s.id),
                label:
                    `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Student ${s.id}`,
            }));

        // Ensure currently referenced studentIds exist as options (even if removed from DB)
        const byId = new Map(base.map((s) => [String(s.value), s]));
        for (const a of form.allocations || []) {
            const id = String(a.studentId || '').trim();
            if (id && !byId.has(id)) byId.set(id, { value: id, label: `Student ${id}` });
        }
        if (allocDraft.studentId && !byId.has(String(allocDraft.studentId))) {
            const id = String(allocDraft.studentId);
            byId.set(id, { value: id, label: `Student ${id}` });
        }
        return Array.from(byId.values());
    }, [students, form.allocations, allocDraft.studentId]);

    const moduleLabel = useMemo(
        () =>
            moduleItems.find((m) => String(m.value) === String(form.moduleId))?.label ||
            '',
        [moduleItems, form.moduleId]
    );

    const ownedCount = useMemo(
        () => (form.allocations || []).reduce((sum, a) => sum + (a.qty || 0), 0),
        [form.allocations]
    );
    const totalCountNum = useMemo(
        () => toNonNegativeInt(form.totalCount, 0),
        [form.totalCount]
    );
    const inStoreCount = useMemo(
        () => Math.max(totalCountNum - ownedCount, 0),
        [totalCountNum, ownedCount]
    );

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const updateAllocation = (idx, patch) => {
        setForm((f) => {
            const next = [...(f.allocations || [])];
            const current = next[idx] || {};
            const nextItem = {
                studentId:
                    patch.studentId !== undefined ? String(patch.studentId) : current.studentId,
                qty:
                    patch.qty !== undefined ? toNonNegativeInt(patch.qty, current.qty || 0) : current.qty,
            };
            next[idx] = nextItem;
            return { ...f, allocations: normalizeAllocations(next) };
        });
    };

    const removeAllocation = (idx) => {
        setForm((f) => {
            const next = [...(f.allocations || [])];
            next.splice(idx, 1);
            return { ...f, allocations: next };
        });
    };

    const addAllocation = () => {
        const studentId = String(allocDraft.studentId || '').trim();
        const qty = toPositiveInt(allocDraft.qty, 1);
        if (!studentId) {
            setErrors((e) => ({ ...e, allocations: 'Selecteer een leerling.' }));
            return;
        }
        setErrors((e) => ({ ...e, allocations: '' }));

        setForm((f) => {
            const existingIdx = (f.allocations || []).findIndex(
                (a) => String(a.studentId) === String(studentId)
            );
            if (existingIdx >= 0) {
                const next = [...f.allocations];
                next[existingIdx] = {
                    ...next[existingIdx],
                    qty: toNonNegativeInt(next[existingIdx].qty, 0) + qty,
                };
                return { ...f, allocations: normalizeAllocations(next) };
            }
            return {
                ...f,
                allocations: normalizeAllocations([...(f.allocations || []), { studentId, qty }]),
            };
        });

        setAllocDraft({ studentId: '', qty: '1' });
    };

    const handleSave = () => {
        const nextErrors = { title: '', moduleId: '', totalCount: '', allocations: '' };
        let hasError = false;

        const title = String(form.title || '').trim();
        const moduleId = String(form.moduleId || '').trim();

        if (!title) {
            nextErrors.title = 'Vul een titel in.';
            hasError = true;
        }
        if (!moduleId) {
            nextErrors.moduleId = 'Selecteer een course module.';
            hasError = true;
        }

        if (form.totalCount === '' || form.totalCount === null || form.totalCount === undefined) {
            nextErrors.totalCount = 'Vul een totaal aantal in.';
            hasError = true;
        }

        const totalCount = toNonNegativeInt(form.totalCount, 0);
        const allocations = normalizeAllocations(form.allocations || []);
        const owned = allocations.reduce((sum, a) => sum + a.qty, 0);
        if (owned > totalCount) {
            nextErrors.totalCount =
                'Totaal moet groter of gelijk zijn aan het aantal in bezit.';
            hasError = true;
        }

        setErrors(nextErrors);
        if (hasError) return;

        onSave?.({
            id: book?.id,
            title,
            moduleId,
            totalCount,
            allocations,
            notes: String(form.notes || '').trim(),
        });
    };

    if (!book) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(95vw,820px)] p-0 overflow-hidden rounded-2xl">
                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-2xl font-semibold truncate">
                                    {book?.id ? 'Boek bewerken' : 'Nieuw boek'}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="px-2.5 py-0.5">
                                        Boekenvoorraad
                                    </Badge>
                                    {moduleLabel ? (
                                        <Badge variant="outline" className="px-2.5 py-0.5">
                                            {moduleLabel}
                                        </Badge>
                                    ) : null}
                                    <Badge
                                        variant="secondary"
                                        className="px-2.5 py-0.5 bg-amber-50 text-amber-800"
                                    >
                                        In bezit: {ownedCount}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700"
                                    >
                                        In store: {inStoreCount}
                                    </Badge>
                                    <Badge variant="secondary" className="px-2.5 py-0.5">
                                        Totaal: {totalCountNum}
                                    </Badge>
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <Separator />

                    <div className="pt-5">
                        <div className="grid gap-8 sm:grid-cols-12">
                            <section className="sm:col-span-7">
                                <h3 className="text-base font-medium text-muted-foreground mb-3">
                                    Boekgegevens
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="book-title">Titel</Label>
                                        <Input
                                            id="book-title"
                                            value={form.title}
                                            onChange={(e) => {
                                                update('title', e.target.value);
                                                if (errors.title) setErrors((p) => ({ ...p, title: '' }));
                                            }}
                                            placeholder="Bijv. Lesboek"
                                            className="bg-white"
                                        />
                                        {errors.title ? (
                                            <p className="text-sm text-destructive">{errors.title}</p>
                                        ) : null}
                                    </div>

                                    <div className="space-y-1.5">
                                        <ComboboxField
                                            label="Course module"
                                            value={form.moduleId}
                                            onChange={(v) => {
                                                update('moduleId', v || '');
                                                if (errors.moduleId) setErrors((p) => ({ ...p, moduleId: '' }));
                                            }}
                                            items={moduleItems}
                                            placeholder="Selecteer course module"
                                            error={errors.moduleId}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="book-total">Totaal aantal</Label>
                                        <Input
                                            id="book-total"
                                            type="number"
                                            inputMode="numeric"
                                            min={0}
                                            step={1}
                                            value={form.totalCount}
                                            onChange={(e) => {
                                                update('totalCount', e.target.value);
                                                if (errors.totalCount)
                                                    setErrors((p) => ({ ...p, totalCount: '' }));
                                            }}
                                            className="bg-white"
                                        />
                                        {errors.totalCount ? (
                                            <p className="text-sm text-destructive">{errors.totalCount}</p>
                                        ) : null}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="book-notes">Notities</Label>
                                        <Textarea
                                            id="book-notes"
                                            value={form.notes}
                                            onChange={(e) => update('notes', e.target.value)}
                                            placeholder="Optioneel"
                                            className="bg-white"
                                        />
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-medium">Uitgifte (leerlingen)</h3>
                                            <span className="text-sm text-muted-foreground">
                                                In bezit: <span className="font-medium">{ownedCount}</span>
                                            </span>
                                        </div>

                                        {errors.allocations ? (
                                            <p className="text-sm text-destructive">{errors.allocations}</p>
                                        ) : null}

                                        {(form.allocations || []).length ? (
                                            <div className="space-y-2">
                                                {form.allocations.map((a, idx) => (
                                                    <div
                                                        key={`${a.studentId}-${idx}`}
                                                        className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_130px_auto] gap-2 items-end"
                                                    >
                                                        <ComboboxField
                                                            label={idx === 0 ? 'Leerling' : undefined}
                                                            value={a.studentId}
                                                            onChange={(v) => updateAllocation(idx, { studentId: v })}
                                                            items={studentItems}
                                                            placeholder="Selecteer leerling"
                                                        />
                                                        <div className="space-y-1.5">
                                                            <Label
                                                                htmlFor={`alloc-qty-${idx}`}
                                                                className={idx === 0 ? '' : 'sm:sr-only'}
                                                            >
                                                                Aantal
                                                            </Label>
                                                            <Input
                                                                id={`alloc-qty-${idx}`}
                                                                type="number"
                                                                inputMode="numeric"
                                                                min={1}
                                                                step={1}
                                                                className="bg-white"
                                                                value={String(a.qty ?? '')}
                                                                onChange={(e) => updateAllocation(idx, { qty: e.target.value })}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="h-10 w-10 p-0 rounded-full"
                                                            onClick={() => removeAllocation(idx)}
                                                            title="Verwijderen"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                                                Nog geen uitgiftes geregistreerd.
                                            </div>
                                        )}

                                        <div className="rounded-lg border p-3 bg-white">
                                            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_130px_auto] gap-2 items-end">
                                                <ComboboxField
                                                    label="Nieuwe uitgifte"
                                                    value={allocDraft.studentId}
                                                    onChange={(v) => setAllocDraft((d) => ({ ...d, studentId: v || '' }))}
                                                    items={studentItems}
                                                    placeholder="Selecteer leerling"
                                                />
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="alloc-draft-qty">Aantal</Label>
                                                    <Input
                                                        id="alloc-draft-qty"
                                                        type="number"
                                                        inputMode="numeric"
                                                        min={1}
                                                        step={1}
                                                        className="bg-white"
                                                        value={allocDraft.qty}
                                                        onChange={(e) => setAllocDraft((d) => ({ ...d, qty: e.target.value }))}
                                                    />
                                                </div>
                                                <Button type="button" onClick={addAllocation} className="h-10">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Toevoegen
                                                </Button>
                                            </div>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Let op: In bezit mag niet groter zijn dan het totaal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="sm:col-span-5 sm:border-l border-border/60 sm:pl-7">
                                <h3 className="text-base font-medium text-muted-foreground mb-3">
                                    Overzicht
                                </h3>
                                <div className="space-y-4">
                                    <div className="rounded-lg border bg-muted/20 p-4">
                                        <div className="text-sm text-muted-foreground">Course module</div>
                                        <div className="mt-1 text-lg font-medium truncate">
                                            {moduleLabel || '—'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="text-sm text-muted-foreground">In bezit</div>
                                            <div className="mt-1 text-lg font-medium tabular-nums">
                                                {ownedCount}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="text-sm text-muted-foreground">In store</div>
                                            <div className="mt-1 text-lg font-medium tabular-nums">
                                                {inStoreCount}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="text-sm text-muted-foreground">Totaal</div>
                                            <div className="mt-1 text-lg font-medium tabular-nums">
                                                {totalCountNum}
                                            </div>
                                        </div>
                                    </div>
                                    {form.notes ? (
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <div className="text-sm text-muted-foreground">Notities</div>
                                            <div className="mt-1 text-sm whitespace-pre-wrap break-words">
                                                {form.notes}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => onDelete?.(book?.id)}
                            disabled={!book?.id}
                            title={book?.id ? 'Verwijderen' : 'Sla eerst op om te kunnen verwijderen'}
                        >
                            Verwijderen
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Annuleren
                            </Button>
                            <Button onClick={handleSave}>Opslaan</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


