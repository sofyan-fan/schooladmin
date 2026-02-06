import moduleApi from '@/apis/moduleAPI';
import { Button } from '@/components/ui/button';
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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ModuleSettingsModal({
  open,
  onOpenChange,
  module,
  onSaved,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [criteria, setCriteria] = useState({
    passing_min: '',
    passing_norm: '',
    passing_max: '',
  });

  // Seed local state whenever module changes or modal opens
  useEffect(() => {
    if (!open || !module) return;
    setCriteria({
      passing_min:
        module.passing_min !== undefined && module.passing_min !== null
          ? String(module.passing_min)
          : '',
      passing_norm:
        module.passing_norm !== undefined && module.passing_norm !== null
          ? String(module.passing_norm)
          : '',
      passing_max:
        module.passing_max !== undefined && module.passing_max !== null
          ? String(module.passing_max)
          : '',
    });
  }, [open, module]);

  const handleChangeValue = (key, value) => {
    setCriteria((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!module) return;

    const payload = {
      passing_min:
        criteria.passing_min === '' ? null : Number(criteria.passing_min),
      passing_norm:
        criteria.passing_norm === '' ? null : Number(criteria.passing_norm),
      passing_max:
        criteria.passing_max === '' ? null : Number(criteria.passing_max),
    };

    // Validate that values are finite numbers or null
    for (const [key, val] of Object.entries(payload)) {
      if (val !== null && !Number.isFinite(val)) {
        toast.error(`Ongeldige waarde voor ${key}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const updatedModule = await moduleApi.update_passing_criteria(
        module.id,
        payload
      );
      toast.success('Slagingsnormering opgeslagen!');
      onSaved?.(updatedModule);
      onOpenChange?.(false);
    } catch (error) {
      console.error('Failed to save passing criteria:', error);
      toast.error('Kon de slagingsnormering niet opslaan.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!module) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="480px">
        <DialogHeader>
          <DialogTitle>Slagingsnormering</DialogTitle>
          <DialogDescription>
            Stel de slagingsnormering in voor:{' '}
            <span className="font-bold">{module.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passing_min">Minimum</Label>
              <Input
                id="passing_min"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="10"

                value={criteria.passing_min}
                onChange={(e) =>
                  handleChangeValue('passing_min', e.target.value)
                }
                disabled={isLoading}
              />

            </div>


            <div className="space-y-2">
              <Label htmlFor="passing_max">Maximum</Label>
              <Input
                id="passing_max"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="10"

                value={criteria.passing_max}
                onChange={(e) =>
                  handleChangeValue('passing_max', e.target.value)
                }
                disabled={isLoading}
              />

            </div>
            <div className="space-y-2">
              <Label htmlFor="passing_norm">Voldoende</Label>
              <Input
                id="passing_norm"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="10"

                value={criteria.passing_norm}
                onChange={(e) =>
                  handleChangeValue('passing_norm', e.target.value)
                }
                disabled={isLoading}
                className="border-primary"
              />

            </div>

          </div>


        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={isLoading}
          >
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
