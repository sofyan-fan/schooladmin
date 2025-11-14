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
import { X } from 'lucide-react';

import ComboboxField from '@/components/ui/combobox';
import { useEffect, useMemo, useState } from 'react';

import studentAPI from '@/apis/studentAPI';
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
    ayahsFor,
    endSurahsBefore,
    endAyahsBefore,
    hizbFor,
  } = useQuranRelations();

  // geordende Begin en Einde; behoud als strings om te matchen met ComboboxField
  const [begin, setBegin] = useState(asPointStrings(parsePoint(newLog.from)));
  const [end, setEnd] = useState(asPointStrings(parsePoint(newLog.to)));
  const [studentItems, setStudentItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await studentAPI.get_students();
        if (cancelled) return;
        const mapped = (all || []).map((s) => ({
          value: String(s.id),
          label: `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Student ${s.id}`,
        }));
        setStudentItems(mapped);
      } catch (e) {
        // fail silently; creation can still proceed with temporary student
        // and will be saved locally by the caller
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    () => allSurahItems,
    [allSurahItems]
  );
  const beginAyahItems = useMemo(
    () => ayahsFor(begin.surahId, undefined),
    [begin.surahId, ayahsFor]
  );

  const endSurahItems = useMemo(() => endSurahsBefore(begin), [begin, endSurahsBefore]);
  const endAyahItems = useMemo(
    () => endAyahsBefore(end.surahId, undefined, begin),
    [end.surahId, begin, endAyahsBefore]
  );

  // Keep end selection valid as begin changes
  useEffect(() => {
    const allowedSurahs = endSurahsBefore(begin);
    if (end.surahId && !allowedSurahs.some((o) => o.value === end.surahId)) {
      const next = { ...end, surahId: '', ayah: '' };
      setEnd(next);
      setNewLog((s) => ({ ...s, to: serializePoint(next) }));
      return;
    }
    if (end.surahId) {
      const allowedAyahs = endAyahsBefore(end.surahId, undefined, begin);
      if (end.ayah && !allowedAyahs.some((o) => o.value === end.ayah)) {
        const next = { ...end, ayah: '' };
        setEnd(next);
        setNewLog((s) => ({ ...s, to: serializePoint(next) }));
      }
    }
  }, [begin, end.surahId]);

  // derive hizb automatically from surah+ayah
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
    if (patch.ayah !== undefined) {
      next.ayah = String(patch.ayah);
    }
    if (next.surahId && next.ayah) {
      next.hizb = deriveHizb(next.surahId, next.ayah);
    }
    setBegin(next);
    setNewLog((s) => ({ ...s, from: serializePoint(next) }));
  }

  function pushEnd(patch) {
    let next = asPointStrings({ ...end, ...patch });
    if (patch.surahId !== undefined) {
      next.surahId = String(patch.surahId);
      next.ayah = '';
      next.hizb = '';
    }
    if (patch.ayah !== undefined) {
      next.ayah = String(patch.ayah);
    }
    if (next.surahId && next.ayah) {
      next.hizb = deriveHizb(next.surahId, next.ayah);
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

  const beginAyahHint = null;
  const endAyahHint = null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Qur'an Log</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Student */}
          <div className="grid gap-2">
            <ComboboxField
              label="Leerling"
              items={studentItems}
              value={newLog.studentId || ''}
              onChange={(v) => setNewLog((s) => ({ ...s, studentId: v }))}
              placeholder="Kies leerling"
            />
          </div>

          <div className="grid gap-2">
            {/* Begin */}
            <h2 className="text-lg font-semibold">Begin</h2>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end">
              <ComboboxField
                label="Surah"
                items={beginSurahItems}
                value={begin.surahId}
                onChange={(v) => pushBegin({ surahId: v })}
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
                      : 'Geen ayah'
                    : 'Kies eerst surah'
                }
                disabled={!begin.surahId || beginAyahItems.length === 0}
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
                  onClick={clearBegin}
                  aria-label="Begin wissen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {beginAyahHint ? (
                <div className="sm:col-span-4 text-sm text-muted-foreground">
                  {beginAyahHint}
                </div>
              ) : null}
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
                onChange={(v) => pushEnd({ surahId: v })}
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
                      : 'Geen ayah'
                    : 'Kies eerst surah'
                }
                disabled={!end.surahId || endAyahItems.length === 0}
              />
              <div className="flex flex-col">
                <Label>Hizb</Label>
                <div className={
                  `h-10 flex items-center px-3 rounded-md border ` +
                  (end.surahId && end.ayah
                    ? 'bg-white text-muted-foreground'
                    : 'bg-muted/30 text-muted-foreground')
                }>
                  {end.surahId && end.ayah ? `Hizb ${hizbFor(end.surahId, end.ayah) || '—'}` : '—'}
                </div>
              </div>
              <div className="flex flex-col">
                <Label>&nbsp;</Label>
                <Button
                  variant="ghost"
                  className="bg-white border h-10 w-10 rounded-full p-0 justify-center"
                  onClick={clearEnd}
                  aria-label="Einde wissen"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {endAyahHint ? (
                <div className="sm:col-span-4 text-sm text-muted-foreground">
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
                toYear={new Date().getFullYear()}
                onChange={(date) => {
                  const toLocalYMD = (d) => {
                    if (!d) return '';
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`; // nl-friendly YYYY-MM-DD
                  };
                  setNewLog((s) => ({
                    ...s,
                    date: date ? toLocalYMD(date) : '',
                  }));
                }}
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
