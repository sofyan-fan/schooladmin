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

export default function EditModal({ open, onOpenChange, onSave, config }) {
  const [required, setRequired] = useState(true);
  const [passingType, setPassingType] = useState('minimum_grade');
  const [minimumGrade, setMinimumGrade] = useState('5.5');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setRequired(config.required ?? true);
      setPassingType(config.passing_type || 'minimum_grade');
      setMinimumGrade(config.minimum_grade?.toString() || '5.5');
    }
    setError('');
  }, [config]);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const updatedConfig = {
        ...config,
        required,
        passing_type: passingType,
        minimum_grade: passingType === 'minimum_grade' ? parseFloat(minimumGrade) : null,
      };
      if (onSave) onSave(updatedConfig);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vak Bewerken</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          {/* Row 1: Vak display + Required switch */}
          <div className="space-y-2">
            <Label>Vak</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1 py-2 px-3 border rounded-md bg-muted/50 text-sm">
                {config?.subject_name}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="required-edit"
                  checked={required}
                  onCheckedChange={setRequired}
                  disabled={loading}
                />
                <Label htmlFor="required-edit" className="cursor-pointer text-sm">Verplicht</Label>
              </div>
            </div>
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
            <Button type="submit" disabled={loading}>
              <Check className="h-4 w-4 mr-1" />
              {loading ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
