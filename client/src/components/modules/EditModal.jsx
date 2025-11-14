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

export default function EditModal({
  open,
  onOpenChange,
  onSave,
  subjects,
  module,
}) {
  const [name, setName] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(''); // stores levelId (string)
  const [selectedMaterial, setSelectedMaterial] = useState(''); // stores materialId (string)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Huidige subject op basis van selectie
  const selectedSubject = useMemo(() => {
    if (!Array.isArray(subjects)) return undefined;
    return subjects.find((s) => String(s.id) === String(selectedSubjectId));
  }, [subjects, selectedSubjectId]);

  // Normaliseer levels en materials van het geselecteerde subject
  const normalizedLevels = useMemo(() => {
    const raw = selectedSubject?.levels || [];
    return raw.map((lvl, idx) => {
      if (lvl && typeof lvl === 'object') {
        // Handle Prisma structure: { id, level, subject_id }
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
        // Handle Prisma structure: { id, material, subject_id }
        const id = String(mat.id ?? idx);
        const label = String(
          mat.material ?? mat.name ?? mat.title ?? mat.label ?? id
        );
        return { id, label };
      }
      return { id: String(mat), label: String(mat) };
    });
  }, [selectedSubject]);

  useEffect(() => {
    if (open && module) {
      setName(module.name ?? '');

      const first = (module.subjects || []).slice(0, 1)[0];
      if (!first) {
        setSelectedSubjectId('');
        setSelectedLevel('');
        setSelectedMaterial('');
        setError('');
        return;
      }

      const subjIdRaw =
        first.subjectId ?? first.subject_id ?? first.subject?.id ?? first.id;
      const subjId = subjIdRaw != null ? String(subjIdRaw) : '';

      const lvlVal = first.level ?? first.levelObj;
      const levelLabel =
        typeof lvlVal === 'object' && lvlVal !== null
          ? lvlVal.level ?? lvlVal.name ?? lvlVal.label ?? ''
          : typeof lvlVal !== 'undefined' && lvlVal !== null
            ? String(lvlVal)
            : '';

      const matVal = first.material ?? first.materialObj;
      const materialLabel =
        typeof matVal === 'object' && matVal !== null
          ? matVal.material ?? matVal.name ?? matVal.title ?? matVal.label ?? ''
          : typeof matVal !== 'undefined' && matVal !== null
            ? String(matVal)
            : '';

      const norm = (v) => String(v ?? '').trim().toLowerCase();
      const selectedSubj = Array.isArray(subjects)
        ? subjects.find((s) => String(s.id) === subjId)
        : undefined;
      const levelMatch = (selectedSubj?.levels || []).find(
        (l) => norm(l.label) === norm(levelLabel)
      );
      const materialMatch = (selectedSubj?.materials || []).find(
        (m) => norm(m.label) === norm(materialLabel)
      );

      const levelId = levelMatch ? String(levelMatch.id) : '';
      const materialId = materialMatch ? String(materialMatch.id) : '';

      // Preselect dropdowns
      setSelectedSubjectId(subjId);
      setSelectedLevel(levelId);
      setSelectedMaterial(materialId);
      setError('');
    }
  }, [module, open, subjects]);

  const resetComboInputs = () => {
    setSelectedSubjectId('');
    setSelectedLevel('');
    setSelectedMaterial('');
  };

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
        id: module.id,
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
      setError(
        err?.message || 'Kon de wijzigingen niet opslaan. Probeer opnieuw.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Module bewerken</DialogTitle>
          <DialogDescription>
            Bewerk de gegevens van deze curriculum module.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {/* Module naam */}
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

          {/* Combinator: Subject / Level / Material */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-3 items-end">
            {/* Subject */}
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

            {/* Level */}
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

            {/* Material */}
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


          {/* Error */}
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          {/* Footer */}
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
              {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
