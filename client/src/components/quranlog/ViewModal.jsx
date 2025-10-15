import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BookCheck } from 'lucide-react';

function valueOrDash(v) {
  return v ? String(v) : '-';
}

export default function ViewQuranLogDialog({
  open,
  onOpenChange,
  log,
  studentLabel,
}) {
  const [fromSurah, fromHizb, fromAyah] = (log?.from || '').split(':');
  const [toSurah, toHizb, toAyah] = (log?.to || '').split(':');

  // Compose expanded lines like the provided mock: SurahName - Hizb X - Ayah Y.
  function renderExpanded(s, h, a) {
    if (!s && !h && !a) return '-';
    const segs = [];
    if (s) segs.push(`Surah ${s}`);
    if (h) segs.push(`Hizb ${h}`);
    if (a) segs.push(`Ayah ${a}`);
    return segs.join('  -  ');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,700px)] border border-primary rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookCheck className="size-5" /> Qur'an Log voor{' '}
            {valueOrDash(studentLabel)}
          </DialogTitle>
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
            <div className="sm:col-span-2">{valueOrDash(log?.date)}</div>
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
