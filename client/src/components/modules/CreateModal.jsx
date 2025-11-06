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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';

export default function CreateModal({ open, onOpenChange, onSave, subjects }) {
  const [name, setName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setError('');
      resetComboInputs();
    }
  }, [open]);

  const selectedSubject = useMemo(() => {
    if (!Array.isArray(subjects)) return undefined;
    return subjects.find((s) => String(s.id) === String(selectedSubjectId));
  }, [subjects, selectedSubjectId]);

  const normalizedLevels = useMemo(() => {
    const raw = selectedSubject?.levels || [];
    return raw.map((lvl, idx) => {
      if (lvl && typeof lvl === 'object') {
        const id = String(lvl.id ?? idx);
        const label = String(lvl.level ?? lvl.name ?? lvl.label ?? id);
        return { id, label };
      }
      return { id: String(lvl), label: String(lvl) };
    });
  }, [selectedSubject]);

  const normalizedMaterials = useMemo(() => {
    const raw = selectedSubject?.materials || [];
    return raw.map((mat, idx) => {
      if (mat && typeof mat === 'object') {
        const id = String(mat.id ?? idx);
        const label = String(
          mat.material ?? mat.name ?? mat.title ?? mat.label ?? id
        );
        return { id, label };
      }
      return { id: String(mat), label: String(mat) };
    });
  }, [selectedSubject]);

  const resetComboInputs = () => {
    setSelectedSubjectId('');
    setSelectedLevel('');
    setSelectedMaterial('');
  };

  // No add/remove combo; we save directly from the selected fields

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Geef de module een naam.');
      return;
    }
    if (!selectedSubjectId || !selectedLevel || !selectedMaterial) {
      setError('Kies een vak, niveau en literatuur.');
      return;
    }

    setLoading(true);
    try {
      const levelObj = normalizedLevels.find(
        (l) => String(l.id) === String(selectedLevel)
      );
      const materialObj = normalizedMaterials.find(
        (m) => String(m.id) === String(selectedMaterial)
      );
      await onSave({
        name: name.trim(),
        subjects: [
          {
            subject_id: Number(selectedSubjectId),
            level: String(levelObj?.label || ''),
            material: String(materialObj?.label || ''),
          },
        ],
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Kon de module niet opslaan. Probeer opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nieuwe Module Toevoegen</DialogTitle>
          <DialogDescription>
            Creëer een nieuwe module door een naam op te geven en de
            bijbehorende vakken te selecteren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="moduleName">Module naam</Label>
            <Input
              id="moduleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="subject">Vak</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(value) => {
                  setSelectedSubjectId(value);
                  setSelectedLevel('');
                  setSelectedMaterial('');
                }}
                disabled={loading}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Kies een vak..." />
                </SelectTrigger>
                <SelectContent>
                  {(subjects || []).map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Niveau</Label>
              <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
                disabled={!selectedSubjectId || loading}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Kies niveau..." />
                </SelectTrigger>
                <SelectContent>
                  {normalizedLevels.map((lvl) => (
                    <SelectItem key={lvl.id} value={lvl.id}>
                      {lvl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Literatuur</Label>
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
                disabled={!selectedSubjectId || loading}
              >
                <SelectTrigger id="material">
                  <SelectValue placeholder="Kies literatuur..." />
                </SelectTrigger>
                <SelectContent>
                  {normalizedMaterials.map((mat) => (
                    <SelectItem key={mat.id} value={mat.id}>
                      {mat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !name.trim() ||
                !selectedSubjectId ||
                !selectedLevel ||
                !selectedMaterial
              }
            >
              {loading ? 'Opslaan...' : 'Module Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
