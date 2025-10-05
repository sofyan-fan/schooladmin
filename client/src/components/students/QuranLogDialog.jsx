import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function QuranLogDialog({
  open,
  onOpenChange,
  newLog,
  setNewLog,
  onSave,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Qur'an Log</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-4 items-end">
          <div className="grid gap-2">
            <Label htmlFor="from">Begin</Label>
            <Input
              id="from"
              value={newLog.from}
              onChange={(e) =>
                setNewLog((s) => ({ ...s, from: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="to">Einde</Label>
            <Input
              id="to"
              value={newLog.to}
              onChange={(e) => setNewLog((s) => ({ ...s, to: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Datum</Label>
            <DatePicker
              id="date"
              buttonClassName="bg-white py-5"
              className=""
              value={newLog.date}
              onChange={(date) =>
                setNewLog((s) => ({
                  ...s,
                  date: date ? date.toISOString().slice(0, 10) : '',
                }))
              }
            />
          </div>
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor="memorized">Memorisatie</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="memorized"
                checked={newLog.memorized}
                onCheckedChange={(v) =>
                  setNewLog((s) => ({ ...s, memorized: Boolean(v) }))
                }
              />
              <span className="text-sm text-muted-foreground">Geleerd</span>
            </div>
          </div>
          <div className="grid gap-2 sm:col-span-4">
            <Label htmlFor="description">Omschrijving</Label>
            <Input
              id="description"
              value={newLog.description}
              onChange={(e) =>
                setNewLog((s) => ({ ...s, description: e.target.value }))
              }
              placeholder="Optioneel"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={onSave}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
