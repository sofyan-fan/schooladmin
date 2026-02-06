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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';

import ComboboxField from '@/components/ui/combobox';
import { useEffect, useMemo, useState } from 'react';

import studentAPI from '@/apis/studentAPI';
import { useQuranRelations } from '@/hooks/useQuranRelations';
import { parsePoint, serializePoint } from '@/utils/quran';

// JSON array met 17 lessen voor Nourania
const NOURANIA_LESSONS = Array.from({ length: 17 }, (_, i) => ({
  value: `les-${i + 1}`,
  label: `Les ${i + 1}`,
}));

const NOURANIA_STORAGE_KEY = 'nouraniaLogs';

function formatDDMMYYYY(d) {
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function parseDDMMYYYYToDate(raw) {
  if (!raw) return undefined;
  const s = String(raw).trim();

  // Accept DD-MM-YYYY
  const m1 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m1) {
    const dd = Number(m1[1]);
    const mm = Number(m1[2]);
    const yyyy = Number(m1[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? undefined : d;
  }

  // Backwards compatibility: YYYY-MM-DD (old stored format)
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) {
    const yyyy = Number(m2[1]);
    const mm = Number(m2[2]);
    const dd = Number(m2[3]);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? undefined : d;
  }

  return undefined;
}

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
  onNouraniaSave,
}) {
  const {
    loading,
    surahItems: allSurahItems,
    ayahsFor,
    hizbFor,
  } = useQuranRelations();

  // geordende Begin en Einde; behoud als strings om te matchen met ComboboxField
  const [begin, setBegin] = useState(asPointStrings(parsePoint(newLog.from)));
  const [end, setEnd] = useState(asPointStrings(parsePoint(newLog.to)));
  const [studentItems, setStudentItems] = useState([]);
  const [activeTab, setActiveTab] = useState('log');
  const [errors, setErrors] = useState({
    studentId: '',
    beginSurah: '',
    beginAyah: '',
    endSurah: '',
    endAyah: '',
    date: '',
  });

  // Nourania tab form state (stored locally)
  const [nouraniaLog, setNouraniaLog] = useState({
    studentId: '',
    begin: '',
    einde: '',
    date: '',
    description: '',
  });
  const [nouraniaErrors, setNouraniaErrors] = useState({
    studentId: '',
    begin: '',
    einde: '',
    date: '',
  });

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

  // reset validation errors when dialog opens fresh
  useEffect(() => {
    if (open) {
      setErrors({
        studentId: '',
        beginSurah: '',
        beginAyah: '',
        endSurah: '',
        endAyah: '',
        date: '',
      });
      setNouraniaErrors({ studentId: '', begin: '', einde: '', date: '' });
      setActiveTab('log');

      const todayISO = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      })();
      const todayDDMMYYYY = formatDDMMYYYY(new Date());

      // Prefill date with today if empty. The DatePicker UI defaults to today visually,
      // but without this the underlying state can still be empty and fail validation.
      setNewLog((s) => {
        if (s?.date) return s;
        return { ...s, date: todayISO };
      });

      // Reset Nourania form and prefill date
      setNouraniaLog({
        studentId: '',
        begin: '',
        einde: '',
        date: todayDDMMYYYY,
        description: '',
      });
    }
  }, [open]);

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
  const beginSurahItems = useMemo(() => allSurahItems, [allSurahItems]);
  const beginAyahItems = useMemo(
    () => ayahsFor(begin.surahId, undefined),
    [begin.surahId, ayahsFor]
  );

  // End-side now shows all surahs and all ayahs for the chosen surah
  const endSurahItems = useMemo(() => allSurahItems, [allSurahItems]);
  const endAyahItems = useMemo(
    () => ayahsFor(end.surahId, undefined),
    [end.surahId, ayahsFor]
  );

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

  const canSave = useMemo(() => !loading, [loading]);

  function handleNouraniaSave() {
    const nextErrors = { studentId: '', begin: '', einde: '', date: '' };
    let hasError = false;

    if (!nouraniaLog.studentId) {
      nextErrors.studentId = 'Selecteer een leerling.';
      hasError = true;
    }
    if (!nouraniaLog.begin) {
      nextErrors.begin = 'Selecteer een begin-les.';
      hasError = true;
    }
    if (!nouraniaLog.einde) {
      nextErrors.einde = 'Selecteer een einde-les.';
      hasError = true;
    }
    if (!nouraniaLog.date) {
      nextErrors.date = 'Selecteer een datum.';
      hasError = true;
    }

    setNouraniaErrors(nextErrors);
    if (hasError) return;

    // Build entry and delegate to parent
    const entry = {
      ...nouraniaLog,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    onNouraniaSave?.(entry);

    // Reset form and close
    setNouraniaLog({ studentId: '', begin: '', einde: '', date: '', description: '' });
    onOpenChange(false);
  }

  function handleSave() {
    if (activeTab === 'nourania') {
      handleNouraniaSave();
      return;
    }

    const nextErrors = {
      studentId: '',
      beginSurah: '',
      beginAyah: '',
      endSurah: '',
      endAyah: '',
      date: '',
    };
    let hasError = false;

    if (!newLog.studentId) {
      nextErrors.studentId = 'Selecteer een leerling.';
      hasError = true;
    }
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
    if (!newLog.date) {
      nextErrors.date = 'Selecteer een datum.';
      hasError = true;
    }

    setErrors(nextErrors);
    if (hasError) return;

    onSave?.();
  }

  const beginAyahHint = null;
  const endAyahHint = null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Qur'an Log</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 border-b">
            <TabsTrigger value="log" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Qur'an Log
            </TabsTrigger>
            <TabsTrigger value="nourania" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Nourania
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Qur'an Log */}
          <TabsContent value="log" className="min-h-[420px]">
            <div className="grid gap-4">
              {/* Student */}
              <div className="grid gap-2">
                <ComboboxField
                  label="Leerling"
                  items={studentItems}
                  value={newLog.studentId || ''}
                  onChange={(v) => {
                    setNewLog((s) => ({ ...s, studentId: v }));
                    setErrors((prev) => ({ ...prev, studentId: '' }));
                  }}
                  placeholder="Kies leerling"
                  error={errors.studentId}
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
                    maxDate={new Date()}
                    required
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
                      setErrors((prev) => ({ ...prev, date: '' }));
                    }}
                  />
                  {errors.date ? (
                    <p className="text-sm text-destructive mt-1">{errors.date}</p>
                  ) : null}
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
          </TabsContent>

          {/* Tab 2: Nourania */}
          <TabsContent value="nourania" className="min-h-[420px]">
            <div className="grid gap-4">
              {/* Student */}
              <div className="grid gap-2">
                <ComboboxField
                  label="Leerling"
                  items={studentItems}
                  value={nouraniaLog.studentId}
                  onChange={(v) => {
                    setNouraniaLog((s) => ({ ...s, studentId: v }));
                    setNouraniaErrors((prev) => ({ ...prev, studentId: '' }));
                  }}
                  placeholder="Kies leerling"
                  error={nouraniaErrors.studentId}
                />
              </div>

              {/* Begin & Einde on the same row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Begin</Label>
                  <Select
                    clearable
                    value={nouraniaLog.begin}
                    onValueChange={(v) => {
                      setNouraniaLog((s) => ({
                        ...s,
                        begin: v,
                        ...(v ? {} : { einde: '' }),
                      }));
                      setNouraniaErrors((prev) => ({
                        ...prev,
                        begin: '',
                        ...(v ? {} : { einde: '' }),
                      }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kies les" />
                    </SelectTrigger>
                    <SelectContent>
                      {NOURANIA_LESSONS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {nouraniaErrors.begin ? (
                    <p className="text-sm text-destructive -mt-1">{nouraniaErrors.begin}</p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label>Einde</Label>
                  <Select
                    clearable
                    value={nouraniaLog.einde}
                    onValueChange={(v) => {
                      setNouraniaLog((s) => ({ ...s, einde: v }));
                      setNouraniaErrors((prev) => ({ ...prev, einde: '' }));
                    }}
                    disabled={!nouraniaLog.begin}
                  >
                    <SelectTrigger className="w-full" disabled={!nouraniaLog.begin}>
                      <SelectValue placeholder={nouraniaLog.begin ? 'Kies les' : 'Kies eerst begin'} />
                    </SelectTrigger>
                    <SelectContent>
                      {NOURANIA_LESSONS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {nouraniaErrors.einde ? (
                    <p className="text-sm text-destructive -mt-1">{nouraniaErrors.einde}</p>
                  ) : null}
                </div>
              </div>

              {/* Date & Description */}
              <hr />
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <div className="grid gap-2 col-span-1">
                  <Label>Datum</Label>
                  <DatePicker
                    buttonClassName="bg-white py-5"
                    value={parseDDMMYYYYToDate(nouraniaLog.date)}
                    toYear={new Date().getFullYear()}
                    maxDate={new Date()}
                    required
                    onChange={(date) => {
                      setNouraniaLog((s) => ({
                        ...s,
                        date: date ? formatDDMMYYYY(date) : '',
                      }));
                      setNouraniaErrors((prev) => ({ ...prev, date: '' }));
                    }}
                  />
                  {nouraniaErrors.date ? (
                    <p className="text-sm text-destructive mt-1">{nouraniaErrors.date}</p>
                  ) : null}
                </div>
                {/* Description */}
                <div className="grid gap-2 w-full col-span-2">
                  <Label htmlFor="nourania-description">Omschrijving</Label>
                  <Input
                    id="nourania-description"
                    className="w-full"
                    value={nouraniaLog.description}
                    onChange={(e) =>
                      setNouraniaLog((s) => ({ ...s, description: e.target.value }))
                    }
                    placeholder="Optioneel"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
