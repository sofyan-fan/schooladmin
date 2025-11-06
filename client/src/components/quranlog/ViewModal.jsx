import { getChapters } from '@/apis/quranAPI';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuranRelations } from '@/hooks/useQuranRelations';
import { parsePoint } from '@/utils/quran';
import { BookCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
function valueOrDash(v) {
  return v ? String(v) : '-';
}

function formatDateNL(raw) {
  if (!raw) return '-';
  try {
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split('-');
      return `${d}-${m}-${y}`;
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('nl-NL');
  } catch {
    // ignore
  }
  return String(raw);
}

export default function ViewQuranLogDialog({
  open,
  onOpenChange,
  log,
  studentLabel,
}) {
  const { hizbFor } = useQuranRelations();

  // Load chapters to map surah id -> full surah name (e.g., Al-Fatihah)
  const [chapters, setChapters] = useState([]);
  useEffect(() => {
    getChapters()
      .then((c) => setChapters(c || []))
      .catch(() => {});
  }, []);
  const chapterById = useMemo(
    () => new Map(chapters.map((c) => [String(c.id), c])),
    [chapters]
  );

  const fp = parsePoint(log?.from);
  const tp = parsePoint(log?.to);
  const fromSurah = fp.surahId || '';
  const fromAyah = fp.ayah || '';
  const fromHizb = fp.hizb || hizbFor(fp.surahId, fp.ayah) || '';
  const toSurah = tp.surahId || '';
  const toAyah = tp.ayah || '';
  const toHizb = tp.hizb || hizbFor(tp.surahId, tp.ayah) || '';

  // Compose expanded lines like the provided mock: SurahName - Hizb X - Ayah Y.
  function renderExpanded(s, h, a) {
    if (!s && !h && !a) return '-';
    const segs = [];
    if (s) {
      const name = chapterById.get(String(s))?.name_simple || `Surah ${s}`;
      segs.push(name);
    }
    if (h) segs.push(`Hizb ${h}`);
    if (a) segs.push(`Ayah ${a}`);
    return segs.join('  -  ');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,500px)] border border-primary rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookCheck className="size-5" /> Qur'an Log voor{' '}
            {valueOrDash(studentLabel)}
          </DialogTitle>
          <hr className="my-2" />
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid sm:grid-cols-3 gap-3 items-center">
            <Label className="text-muted-foreground">Begin</Label>
            <div className="sm:col-span-2">
              {renderExpanded(fromSurah, fromHizb, fromAyah)}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 items-center">
            <Label className="text-muted-foreground">Einde</Label>
            <div className="sm:col-span-2">
              {renderExpanded(toSurah, toHizb, toAyah)}
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 items-center">
            <Label className="text-muted-foreground">Datum</Label>
            <div className="sm:col-span-2">{formatDateNL(log?.date)}</div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 items-center">
            <Label className="text-muted-foreground">Gememoriseerd</Label>
            <div className="sm:col-span-2">{log?.memorized ? 'Ja' : 'Nee'}</div>
          </div>

          <hr className="my-2" />
          <div className="grid sm:grid-cols-3 gap-3 items-start">
            <Label className="text-muted-foreground mt-1">Omschrijving</Label>
            <div className="sm:col-span-2 whitespace-pre-wrap break-words">
              {valueOrDash(log?.description)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
