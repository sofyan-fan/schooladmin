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
import { useEffect, useMemo, useState } from 'react';

export default function CourseSettingsModal({
  open,
  onOpenChange,
  onSave,
  course,
}) {
  const modules = useMemo(() => course?.modules || [], [course]);

  // Local editable state: { [moduleId]: { min: string, norm: string, max: string } }
  const [criteriaByModuleId, setCriteriaByModuleId] = useState({});

  // Seed local state whenever course changes or modal opens
  useEffect(() => {
    if (!open) return;
    const seed = {};
    for (const module of modules) {
      const pc = module?.passingCriteria || {};
      seed[module.id] = {
        min: pc.min !== undefined && pc.min !== null ? String(pc.min) : '',
        norm: pc.norm !== undefined && pc.norm !== null ? String(pc.norm) : '',
        max: pc.max !== undefined && pc.max !== null ? String(pc.max) : '',
      };
    }
    setCriteriaByModuleId(seed);
  }, [open, modules]);

  const handleChangeValue = (moduleId, key, value) => {
    setCriteriaByModuleId((prev) => ({
      ...prev,
      [moduleId]: {
        min: prev[moduleId]?.min ?? '',
        norm: prev[moduleId]?.norm ?? '',
        max: prev[moduleId]?.max ?? '',
        [key]: value,
      },
    }));
  };

  //   const handleSave = () => {
  //     const cleaned = {};
  //     for (const module of modules) {
  //       const entry = criteriaByModuleId[module.id];

  //       if (!entry) continue;
  //       if (entry.operator === 'none') continue;
  //       const thresholdNum =
  //         entry.threshold === '' ? NaN : Number(entry.threshold);

  //       if (!Number.isFinite(thresholdNum)) continue;
  //       cleaned[module.id] = {
  //         operator: entry.operator,
  //         threshold: thresholdNum,
  //       };
  //     }
  //     onSave?.(cleaned);
  //     onOpenChange?.(false);
  //   };

  const handleSave = () => {
    const cleaned = {};
    for (const module of modules) {
      const entry = criteriaByModuleId[module.id] || {};
      const minVal = entry.min === '' ? null : Number(entry.min);
      const normVal = entry.norm === '' ? null : Number(entry.norm);
      const maxVal = entry.max === '' ? null : Number(entry.max);

      const hasAny = entry.min !== '' || entry.norm !== '' || entry.max !== '';
      if (!hasAny) continue;

      cleaned[module.id] = {
        min: Number.isFinite(minVal) ? minVal : null,
        norm: Number.isFinite(normVal) ? normVal : null,
        max: Number.isFinite(maxVal) ? maxVal : null,
      };
    }
    onSave?.(cleaned);
    onOpenChange?.(false);
  };

  // const handleSave = () => {
  //   console.log('handleSave', passingCriteria);
  // };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="820px">
        <DialogHeader>
          <DialogTitle>Lespakket Slagingsnormering</DialogTitle>
          <DialogDescription>
            Stel slagingsnormering per module in
            {/* <span className="font-medium">{'> 8'}</span> is voldoende. */}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 bg-white/80">
          {modules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Dit lespakket heeft nog geen modules.
            </p>
          ) : (
            <div className="space-y-3">
              {/* <div className="grid grid-cols-12 items-center text-xs text-muted-foreground">
                <div className="col-span-5">Module</div>
                <div className="col-span-2">Min</div>
                <div className="col-span-2">Norm</div>
                <div className="col-span-2">Max</div>
              </div> */}
              <div className="divide-y rounded-md border">
                {modules.map((module) => {
                  const current = criteriaByModuleId[module.id] || {
                    min: '',
                    norm: '',
                    max: '',
                  };
                  return (
                    <div
                      key={module.id}
                      className="grid grid-cols-12 items-center gap-3 p-3"
                    >
                      <div className="col-span-6">
                        <Label className="block text-sm mb-1">
                          {module.name}
                        </Label>
                        {/* <p className="text-xs text-muted-foreground">
                          Stel slagingsnormering in
                        </p> */}
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            placeholder="Min"
                            value={current.min ?? ''}
                            onChange={(e) =>
                              handleChangeValue(
                                module.id,
                                'min',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            placeholder="Max"
                            value={current.max ?? ''}
                            onChange={(e) =>
                              handleChangeValue(
                                module.id,
                                'max',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            placeholder="Norm"
                            value={current.norm ?? ''}
                            className="border border-primary"
                            onChange={(e) =>
                              handleChangeValue(
                                module.id,
                                'norm',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="bg-white"
            variant="outline"
            onClick={() => onOpenChange?.(false)}
          >
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={modules.length === 0}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
