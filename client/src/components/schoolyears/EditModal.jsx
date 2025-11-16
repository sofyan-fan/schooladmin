import schoolyearAPI from '@/apis/schoolyearAPI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';

export default function EditModal({ open, onOpenChange, onSave, schoolYear }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolYear && open) {
      setName(schoolYear.name || '');
      setStartDate(schoolYear.start_date?.slice(0, 10) || '');
      setEndDate(schoolYear.end_date?.slice(0, 10) || '');
      setError('');
      setLoading(false);
    } else if (open) {
      setName('');
      setStartDate('');
      setEndDate('');
      setError('');
      setLoading(false);
    }
  }, [schoolYear, open]);

  const handleSave = async () => {
    if (!schoolYear) return;
    if (!name.trim()) {
      setError('Vul een naam voor het schooljaar in.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start- en einddatum zijn verplicht.');
      return;
    }
    if (startDate >= endDate) {
      setError('De startdatum moet vóór de einddatum liggen.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
      };
      const savedYear = await schoolyearAPI.updateSchoolYear(
        schoolYear.id,
        payload
      );
      if (onSave) {
        onSave(savedYear);
      }
      onOpenChange(false);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err.message ||
        'Opslaan van schooljaar is mislukt. Probeer het opnieuw.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="520px">
        <DialogHeader>
          <DialogTitle>Schooljaar bewerken</DialogTitle>
        </DialogHeader>
        <form
          className="mt-2 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="sy-edit-name">Naam</Label>
            <Input
              id="sy-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. 2023-2024"
              required
              disabled={loading}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sy-edit-start">Startdatum</Label>
              <Input
                id="sy-edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sy-edit-end">Einddatum</Label>
              <Input
                id="sy-edit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          {error && (
            <div className="mt-1 text-sm text-red-600">
              {error}
            </div>
          )}
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
              >
                Terug
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


