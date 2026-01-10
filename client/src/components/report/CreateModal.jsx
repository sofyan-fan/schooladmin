import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CreateModal({ open, onOpenChange, onSave, subjects, existingSubjectIds }) {
  const [subjectId, setSubjectId] = useState('');
  const [required, setRequired] = useState(true);
  const [passingType, setPassingType] = useState('minimum_grade');
  const [minimumGrade, setMinimumGrade] = useState('5.5');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const availableSubjects = subjects.filter(
    (s) => !existingSubjectIds.includes(s.id)
  );

  const subjectItems = availableSubjects.map((s) => ({
    value: s.id.toString(),
    label: s.name,
  }));

  useEffect(() => {
    if (open) {
      setSubjectId('');
      setRequired(true);
      setPassingType('minimum_grade');
      setMinimumGrade('5.5');
      setError('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!subjectId) {
      setError('Selecteer een vak.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const selectedSubject = subjects.find((s) => s.id === parseInt(subjectId));
      const configData = {
        id: Date.now(),
        subject_id: parseInt(subjectId),
        subject_name: selectedSubject?.name || '',
        required,
        passing_type: passingType,
        minimum_grade: passingType === 'minimum_grade' ? parseFloat(minimumGrade) : null,
      };
      if (onSave) onSave(configData);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vak Toevoegen</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {/* Row 1: Vak label */}
          <div className="space-y-2">
            <Label>Vak</Label>
            <div className="flex items-center gap-4">
              <ComboboxField
                items={subjectItems}
                value={subjectId}
                onChange={setSubjectId}
                placeholder="Selecteer een vak"
                disabled={loading}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Switch
                  id="required"
                  checked={required}
                  onCheckedChange={setRequired}
                  disabled={loading}
                />
                <Label htmlFor="required" className="cursor-pointer text-sm">Verplicht</Label>
              </div>
            </div>
            {availableSubjects.length === 0 && (
              <p className="text-xs text-muted-foreground">Alle vakken zijn al toegevoegd.</p>
            )}
          </div>

          <Separator />

          {/* Row 2: Slaagcriteria + Minimumcijfer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Slagingsnormering</Label>
              <Select value={passingType} onValueChange={setPassingType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimum_grade">Minimumcijfer</SelectItem>
                  <SelectItem value="pass_fail">Geslaagd / Gezakt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minimumcijfer</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="10"
                value={minimumGrade}
                onChange={(e) => setMinimumGrade(e.target.value)}
                disabled={loading || passingType !== 'minimum_grade'}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>Annuleren</Button>
            </DialogClose>
            <Button type="submit" disabled={loading || availableSubjects.length === 0}>
              <Check className="h-4 w-4 mr-1" />
              {loading ? 'Opslaan...' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
