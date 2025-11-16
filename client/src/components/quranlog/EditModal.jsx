import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuranRelations } from '@/hooks/useQuranRelations';
import { parsePoint, serializePoint } from '@/utils/quran';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function asPointStrings(p) {
  return {
    surahId: p?.surahId ? String(p.surahId) : '',
    hizb: p?.hizb ? String(p.hizb) : '',
    ayah: p?.ayah ? String(p.ayah) : '',
  };
}

export default function EditQuranLogModal({
  open,
  onOpenChange,
  value,
  onChange,
  onSave,
}) {
  const {
    loading,
    surahItems: allSurahItems,
    ayahsFor,
    hizbFor,
  } = useQuranRelations();

  const [begin, setBegin] = useState(asPointStrings(parsePoint(value?.from)));
  const [end, setEnd] = useState(asPointStrings(parsePoint(value?.to)));
  const [date, setDate] = useState(value?.date || '');
  const [description, setDescription] = useState(value?.description || '');
  const [memorized, setMemorized] = useState(Boolean(value?.memorized));
  const [errors, setErrors] = useState({
    beginSurah: '',
    beginAyah: '',
    endSurah: '',
    endAyah: '',
    date: '',
  });

  useEffect(() => {
    if (!value) return;
    const parsed = asPointStrings(parsePoint(value.from));
    if (!parsed.hizb && parsed.surahId && parsed.ayah) {
      const h = hizbFor(parsed.surahId, parsed.ayah);
      if (h) parsed.hizb = String(h);
    }
    setBegin(parsed);
    const parsedEnd = asPointStrings(parsePoint(value.to));
    if (!parsedEnd.hizb && parsedEnd.surahId && parsedEnd.ayah) {
      const h2 = hizbFor(parsedEnd.surahId, parsedEnd.ayah);
      if (h2) parsedEnd.hizb = String(h2);
    }
    setEnd(parsedEnd);
    setDate(value.date || '');
    setDescription(value.description || '');
    setMemorized(Boolean(value.memorized));
  }, [value]);

  useEffect(() => {
    if (open) {
      setErrors({
        beginSurah: '',
        beginAyah: '',
        endSurah: '',
        endAyah: '',
        date: '',
      });
    }
  }, [open]);

  function deriveHizb(surahId, ayah) {
    const h = hizbFor(surahId, ayah);
    return h ? String(h) : '';
  }

  function pushBegin(patch) {
    let next = asPointStrings({ ...begin, ...patch });
    if (patch.surahId !== undefined) {
      next.surahId = String(patch.surahId);
      next.ayah = '';
      next.hizb = '';
    }
    if (patch.ayah !== undefined) next.ayah = String(patch.ayah);
    if (next.surahId && next.ayah) next.hizb = deriveHizb(next.surahId, next.ayah);
    setBegin(next);
    emitIfChanged(next, undefined);
  }
  function pushEnd(patch) {
    let next = asPointStrings({ ...end, ...patch });
    if (patch.surahId !== undefined) {
      next.surahId = String(patch.surahId);
      next.ayah = '';
      next.hizb = '';
    }
    if (patch.ayah !== undefined) next.ayah = String(patch.ayah);
    if (next.surahId && next.ayah) next.hizb = deriveHizb(next.surahId, next.ayah);
    setEnd(next);
    emitIfChanged(undefined, next);
  }

  const beginSurahItems = useMemo(
    () => allSurahItems,
    [allSurahItems]
  );
  const beginAyahItems = useMemo(
    () => ayahsFor(begin.surahId, undefined),
    [begin.surahId, ayahsFor]
  );
  const endSurahItems = useMemo(
    () => allSurahItems,
    [allSurahItems]
  );
  const endAyahItems = useMemo(
    () => ayahsFor(end.surahId, undefined),
    [end.surahId, ayahsFor]
  );

  function emitIfChanged(
    nextBegin,
    nextEnd,
    nextDate = date,
    nextDesc = description
  ) {
    if (!open || !value) return;
    const snapshotBegin = nextBegin ?? begin;
    const snapshotEnd = nextEnd ?? end;
    const next = {
      ...value,
      from: serializePoint(snapshotBegin),
      to: serializePoint(snapshotEnd),
      date: nextDate,
      description: nextDesc,
      memorized,
    };
    const same =
      value &&
      value.from === next.from &&
      value.to === next.to &&
      value.date === next.date &&
      (value.description || '') === (next.description || '') &&
      Boolean(value.memorized) === Boolean(next.memorized);
    if (!same) onChange?.(next);
  }
  function handleSave() {
    const nextErrors = {
      beginSurah: '',
      beginAyah: '',
      endSurah: '',
      endAyah: '',
      date: '',
    };
    let hasError = false;

    if (!begin.surahId) {
      nextErrors.beginSurah = 'Selecteer een begin-surah.';
      hasError = true;
    }
    if (!begin.ayah) {
      nextErrors.beginAyah = 'Selecteer een begin-ayah.';
      hasError = true;
    }
    if (!end.surahId) {
      nextErrors.endSurah = 'Selecteer een einde-surah.';
      hasError = true;
    }
    if (!end.ayah) {
      nextErrors.endAyah = 'Selecteer een einde-ayah.';
      hasError = true;
    }
    if (!date) {
      nextErrors.date = 'Selecteer een datum.';
      hasError = true;
    }

    setErrors(nextErrors);
    if (hasError) return;

    onSave?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qur'an Log Bewerken</DialogTitle>
          <DialogDescription>
            Pas de velden aan en klik op Opslaan om de log te bijwerken.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Student (read-only) */}
          <div className="grid gap-2">
            <Label>Leerling</Label>
            <Input
              readOnly
              className="bg-muted/30"
              value={(value?.studentLabel || (value?.studentId ? `Student ${value.studentId}` : '—'))}
            />
          </div>
          {/* Begin */}
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">Begin</h2>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end">
              <ComboboxField
                label="Surah"
                items={beginSurahItems}
                value={begin.surahId}
                onChange={(v) => {
                  pushBegin({ surahId: v });
                  setErrors((prev) => ({
                    ...prev,
                    beginSurah: '',
                    beginAyah: '',
                  }));
                }}
                placeholder="—"
                error={errors.beginSurah}
              />
              <ComboboxField
                label="Ayah"
                items={beginAyahItems}
                value={begin.ayah}
                onChange={(v) => {
                  pushBegin({ ayah: v });
                  setErrors((prev) => ({ ...prev, beginAyah: '' }));
                }}
                placeholder={
                  begin.surahId
                    ? beginAyahItems.length
                      ? 'Kies ayah'
                      : 'Geen ayah'
                    : 'Kies eerst surah'
                }
                disabled={!begin.surahId || beginAyahItems.length === 0}
                error={errors.beginAyah}
              />
              <div className="flex flex-col">
                <Label>Hizb</Label>
                <div className={
                  `h-10 flex items-center px-3 rounded-md border ` +
                  (begin.surahId && begin.ayah
                    ? 'bg-white text-muted-foreground'
                    : 'bg-muted/30 text-muted-foreground')
                }>
                  {begin.surahId && begin.ayah ? `Hizb ${hizbFor(begin.surahId, begin.ayah) || '—'}` : '—'}
                </div>
              </div>
              <div className="flex flex-col">
                <Label>&nbsp;</Label>
                <Button
                  variant="ghost"
                  className="bg-white border h-10 w-10 rounded-full p-0 justify-center"
                  onClick={() => pushBegin({ surahId: '', ayah: '' })}
                  aria-label="Begin wissen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Einde */}
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">Einde</h2>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end">
              <ComboboxField
                label="Surah"
                items={endSurahItems}
                value={end.surahId}
                onChange={(v) => {
                  pushEnd({ surahId: v });
                  setErrors((prev) => ({
                    ...prev,
                    endSurah: '',
                    endAyah: '',
                  }));
                }}
                placeholder="—"
                error={errors.endSurah}
              />
              <ComboboxField
                label="Ayah"
                items={endAyahItems}
                value={end.ayah}
                onChange={(v) => {
                  pushEnd({ ayah: v });
                  setErrors((prev) => ({ ...prev, endAyah: '' }));
                }}
                placeholder={
                  end.surahId
                    ? endAyahItems.length
                      ? 'Kies ayah'
                      : 'Geen ayah'
                    : 'Kies eerst surah'
                }
                disabled={!end.surahId || endAyahItems.length === 0}
                error={errors.endAyah}
              />
              <div className="flex flex-col">
                <Label>Hizb</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-white text-muted-foreground">
                  {end.surahId && end.ayah ? `Hizb ${hizbFor(end.surahId, end.ayah) || '—'}` : '—'}
                </div>
              </div>
              <div className="flex flex-col">
                <Label>&nbsp;</Label>
                <Button
                  variant="ghost"
                  className="bg-white border h-10 w-10 rounded-full p-0 justify-center"
                  onClick={() => pushEnd({ surahId: '', ayah: '' })}
                  aria-label="Einde wissen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Date & description */}
          <hr />
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div className="grid gap-2 col-span-1">
              <Label>Datum</Label>
              <DatePicker
                buttonClassName="bg-white py-5"
                value={date}
                toYear={new Date().getFullYear()}
                onChange={(d) => {
                  const toLocalYMD = (dt) => {
                    if (!dt) return '';
                    const y = dt.getFullYear();
                    const m = String(dt.getMonth() + 1).padStart(2, '0');
                    const day = String(dt.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                  };
                  const nextDate = d ? toLocalYMD(d) : '';
                  setDate(nextDate);
                  emitIfChanged(undefined, undefined, nextDate, undefined);
                }}
              />
              {errors.date ? (
                <p className="text-sm text-destructive mt-1">{errors.date}</p>
              ) : null}
            </div>
            <div className="grid gap-2 w-full col-span-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Input
                id="description"
                className="w-full"
                value={description}
                onChange={(e) => {
                  const nextDesc = e.target.value;
                  setDescription(nextDesc);
                  emitIfChanged(undefined, undefined, undefined, nextDesc);
                }}
                placeholder="Optioneel"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
