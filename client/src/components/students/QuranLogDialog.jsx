import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import ComboboxField from '@/components/ui/combobox';
import { useEffect, useMemo, useState } from 'react';

import { useQuranRelations } from '@/hooks/useQuranRelations';
import { parsePoint, serializePoint } from '@/utils/quran';

// zorg ervoor dat de state waarden strings zijn voor ComboboxField
function asPointStrings(p) {
  return {
    surahId: p?.surahId ? String(p.surahId) : '',
    hizb: p?.hizb ? String(p.hizb) : '',
    ayah: p?.ayah ? String(p.ayah) : '',
  };
}

export default function QuranLogDialog({
  open,
  onOpenChange,
  newLog,
  setNewLog,
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

  // geordende Begin en Einde; behoud als strings om te matchen met ComboboxField
  const [begin, setBegin] = useState(asPointStrings(parsePoint(newLog.from)));
  const [end, setEnd] = useState(asPointStrings(parsePoint(newLog.to)));

  // beveiligde synchronisatie om feedbacklus op Ayah verandering te voorkomen
  useEffect(() => {
    const parsed = asPointStrings(parsePoint(newLog.from));
    if (serializePoint(parsed) !== serializePoint(begin)) setBegin(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newLog.from]);
  useEffect(() => {
    const parsed = asPointStrings(parsePoint(newLog.to));
    if (serializePoint(parsed) !== serializePoint(end)) setEnd(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newLog.to]);

  // gefilterde items; elke lijst respecteert de andere selectie
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

  // houd afhankelijke velden geldig
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
      next.ayah = ''; // ayah hangt af van surah en misschien hizb
    }
    if (patch.hizb !== undefined) {
      next.hizb = String(patch.hizb);
      next.surahId = ensureSurahValidForHizb(next.surahId, next.hizb);
      next.ayah = '';
    }
    if (patch.ayah !== undefined) {
      next.ayah = String(patch.ayah); // raak niet aan surah/hizb bij ayah verandering
    }

    setBegin(next);
    setNewLog((s) => ({ ...s, from: serializePoint(next) }));
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
    if (patch.ayah !== undefined) {
      next.ayah = String(patch.ayah);
    }

    setEnd(next);
    setNewLog((s) => ({ ...s, to: serializePoint(next) }));
  }

  function clearBegin() {
    const next = { surahId: '', hizb: '', ayah: '' };
    setBegin(next);
    setNewLog((s) => ({ ...s, from: serializePoint(next) }));
  }

  function clearEnd() {
    const next = { surahId: '', hizb: '', ayah: '' };
    setEnd(next);
    setNewLog((s) => ({ ...s, to: serializePoint(next) }));
  }

  const canSave = useMemo(() => {
    const hasBegin = serializePoint(begin) !== '';
    const hasEnd = serializePoint(end) !== '';
    return hasBegin && hasEnd && !loading;
  }, [begin, end, loading]);

  const beginAyahHint =
    begin.surahId && begin.hizb && beginAyahItems.length === 0
      ? 'Geen ayah binnen deze combinatie'
      : null;
  const endAyahHint =
    end.surahId && end.hizb && endAyahItems.length === 0
      ? 'Geen ayah binnen deze combinatie'
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Qur'an Log</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            {/* Begin */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Begin</h2>
              <Button variant="ghost" className="bg-white border" onClick={clearBegin}>
                Wissen
              </Button>
            </div>
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
              {beginAyahHint ? (
                <div className="sm:col-span-3 text-sm text-muted-foreground">
                  {beginAyahHint}
                </div>
              ) : null}
            </div>
          </div>

          {/* Einde */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Einde</h2>
              <Button variant="ghost" className="bg-white border" onClick={clearEnd}>
                Wissen
              </Button>
            </div>
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
              {endAyahHint ? (
                <div className="sm:col-span-3 text-sm text-muted-foreground">
                  {endAyahHint}
                </div>
              ) : null}
            </div>
          </div>

          {/* Date */}
          <hr />
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <div className="grid gap-2 col-span-1">
              <Label>Datum</Label>
              <DatePicker
                buttonClassName="bg-white py-5"
                value={newLog.date}
                onChange={(date) =>
                  setNewLog((s) => ({
                    ...s,
                    date: date ? date.toISOString().slice(0, 10) : '',
                  }))
                }
              />
            </div>
            {/* Description */}
            <div className="grid gap-2 w-full col-span-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Input
                id="description"
                className="w-full"
                value={newLog.description}
                onChange={(e) =>
                  setNewLog((s) => ({ ...s, description: e.target.value }))
                }
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
