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
    hizbItemsAll,
    hizbsForSurah,
    surahsForHizb,
    ayahsFor,
  } = useQuranRelations();

  const [begin, setBegin] = useState(asPointStrings(parsePoint(value?.from)));
  const [end, setEnd] = useState(asPointStrings(parsePoint(value?.to)));
  const [date, setDate] = useState(value?.date || '');
  const [description, setDescription] = useState(value?.description || '');
  const [memorized, setMemorized] = useState(Boolean(value?.memorized));

  useEffect(() => {
    if (!value) return;
    const parsed = asPointStrings(parsePoint(value.from));
    setBegin(parsed);
    const parsedEnd = asPointStrings(parsePoint(value.to));
    setEnd(parsedEnd);
    setDate(value.date || '');
    setDescription(value.description || '');
    setMemorized(Boolean(value.memorized));
  }, [value]);

  // Helpers to maintain valid combos
  function ensureHizbValidForSurah(hizb, surahId) {
    if (!surahId || !hizb) return hizb;
    const allowed = hizbsForSurah(surahId);
    return allowed.some((i) => String(i.value) === String(hizb)) ? hizb : '';
  }
  function ensureSurahValidForHizb(surahId, hizb) {
    if (!hizb || !surahId) return surahId;
    const allowed = surahsForHizb(hizb);
    return allowed.some((i) => String(i.value) === String(surahId))
      ? surahId
      : '';
  }

  function pushBegin(patch) {
    let next = asPointStrings({ ...begin, ...patch });
    if (patch.surahId !== undefined) {
      next.surahId = String(patch.surahId);
      next.hizb = ensureHizbValidForSurah(next.hizb, next.surahId);
      next.ayah = '';
    }
    if (patch.hizb !== undefined) {
      next.hizb = String(patch.hizb);
      next.surahId = ensureSurahValidForHizb(next.surahId, next.hizb);
      next.ayah = '';
    }
    if (patch.ayah !== undefined) next.ayah = String(patch.ayah);
    setBegin(next);
    emitIfChanged(next, undefined);
  }
  function pushEnd(patch) {
    let next = asPointStrings({ ...end, ...patch });
    if (patch.surahId !== undefined) {
      next.surahId = String(patch.surahId);
      next.hizb = ensureHizbValidForSurah(next.hizb, next.surahId);
      next.ayah = '';
    }
    if (patch.hizb !== undefined) {
      next.hizb = String(patch.hizb);
      next.surahId = ensureSurahValidForHizb(next.surahId, next.hizb);
      next.ayah = '';
    }
    if (patch.ayah !== undefined) next.ayah = String(patch.ayah);
    setEnd(next);
    emitIfChanged(undefined, next);
  }

  const beginSurahItems = useMemo(
    () => (begin.hizb ? surahsForHizb(begin.hizb) : allSurahItems),
    [begin.hizb, surahsForHizb, allSurahItems]
  );
  const beginHizbItems = useMemo(
    () => (begin.surahId ? hizbsForSurah(begin.surahId) : hizbItemsAll),
    [begin.surahId, hizbsForSurah, hizbItemsAll]
  );
  const beginAyahItems = useMemo(
    () => ayahsFor(begin.surahId, begin.hizb),
    [begin.surahId, begin.hizb, ayahsFor]
  );
  const endSurahItems = useMemo(
    () => (end.hizb ? surahsForHizb(end.hizb) : allSurahItems),
    [end.hizb, surahsForHizb, allSurahItems]
  );
  const endHizbItems = useMemo(
    () => (end.surahId ? hizbsForSurah(end.surahId) : hizbItemsAll),
    [end.surahId, hizbsForSurah, hizbItemsAll]
  );
  const endAyahItems = useMemo(
    () => ayahsFor(end.surahId, end.hizb),
    [end.surahId, end.hizb, ayahsFor]
  );

  const canSave = useMemo(
    () => serializePoint(begin) && serializePoint(end) && !loading,
    [begin, end, loading]
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
          {/* Begin */}
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">Begin</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <ComboboxField
                label="Surah"
                items={beginSurahItems}
                value={begin.surahId}
                onChange={(v) => pushBegin({ surahId: v })}
                placeholder="—"
              />
              <ComboboxField
                label="Hizb"
                items={beginHizbItems}
                value={begin.hizb}
                onChange={(v) => pushBegin({ hizb: v })}
                placeholder="—"
              />
              <ComboboxField
                label="Ayah"
                items={beginAyahItems}
                value={begin.ayah}
                onChange={(v) => pushBegin({ ayah: v })}
                placeholder={
                  begin.surahId
                    ? beginAyahItems.length
                      ? 'Kies ayah'
                      : 'Geen ayah in intersectie'
                    : 'Kies eerst surah of hizb'
                }
                disabled={!begin.surahId || beginAyahItems.length === 0}
              />
            </div>
          </div>

          {/* Einde */}
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">Einde</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <ComboboxField
                label="Surah"
                items={endSurahItems}
                value={end.surahId}
                onChange={(v) => pushEnd({ surahId: v })}
                placeholder="—"
              />
              <ComboboxField
                label="Hizb"
                items={endHizbItems}
                value={end.hizb}
                onChange={(v) => pushEnd({ hizb: v })}
                placeholder="—"
              />
              <ComboboxField
                label="Ayah"
                items={endAyahItems}
                value={end.ayah}
                onChange={(v) => pushEnd({ ayah: v })}
                placeholder={
                  end.surahId
                    ? endAyahItems.length
                      ? 'Kies ayah'
                      : 'Geen ayah in intersectie'
                    : 'Kies eerst surah of hizb'
                }
                disabled={!end.surahId || endAyahItems.length === 0}
              />
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
                onChange={(d) => {
                  const nextDate = d ? d.toISOString().slice(0, 10) : '';
                  setDate(nextDate);
                  emitIfChanged(undefined, undefined, nextDate, undefined);
                }}
              />
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
          <Button onClick={onSave} disabled={!canSave}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
