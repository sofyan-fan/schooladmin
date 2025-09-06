import { Badge } from '@/components/ui/badge';
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
import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function EditModal({
  open,
  onOpenChange,
  onSave,
  subjects,
  module,
}) {
  const [name, setName] = useState('');
  const [moduleItems, setModuleItems] = useState([]);
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
        const label = String(mat.material ?? mat.name ?? mat.title ?? id);
        return { id, label };
      }
      return { id: String(mat), label: String(mat) };
    });
  }, [selectedSubject]);

  useEffect(() => {
    if (open && module) {
      setName(module.name ?? '');
      // Prefill en normaliseren van bestaande items (enforce single)
      setModuleItems(
        (module.subjects || []).slice(0, 1).map((s) => {
          const subjId =
            s.subjectId ?? s.subject_id ?? s.subject?.id ?? s.id ?? '';
          const subjName = s.subjectName ?? s.subject?.name ?? s.name ?? '';

          const lvl = s.level ?? s.levelObj;
          const mat = s.material ?? s.materialObj;

          const levelId =
            typeof lvl === 'object' && lvl !== null ? lvl.id ?? '' : '';
          const levelLabel =
            typeof lvl === 'object' && lvl !== null
              ? lvl.level ?? lvl.name ?? ''
              : typeof lvl !== 'undefined' && lvl !== null
              ? String(lvl)
              : '';

          const materialId =
            typeof mat === 'object' && mat !== null ? mat.id ?? '' : '';
          const materialLabel =
            typeof mat === 'object' && mat !== null
              ? mat.name ?? mat.title ?? mat.material ?? ''
              : typeof mat !== 'undefined' && mat !== null
              ? String(mat)
              : '';

          return {
            subjectId: Number(subjId),
            subjectName: subjName,
            levelId: levelId ? String(levelId) : '',
            levelLabel: levelLabel || '',
            materialId: materialId ? String(materialId) : '',
            materialLabel: materialLabel || '',
          };
        })
      );
      // Reset combinator inputs bij openen
      setSelectedSubjectId('');
      setSelectedLevel('');
      setSelectedMaterial('');
      setError('');
    }
  }, [module, open]);

  const resetComboInputs = () => {
    setSelectedSubjectId('');
    setSelectedLevel('');
    setSelectedMaterial('');
  };

  const handleAddCombo = () => {
    if (!selectedSubjectId || !selectedLevel || !selectedMaterial) return;

    const levelObj = normalizedLevels.find(
      (l) => String(l.id) === String(selectedLevel)
    );
    const materialObj = normalizedMaterials.find(
      (m) => String(m.id) === String(selectedMaterial)
    );

    // Enforce single subject per module: replace any existing item
    setModuleItems([
      {
        subjectId: Number(selectedSubjectId),
        subjectName: selectedSubject?.name || '',
        levelId: levelObj?.id || '',
        levelLabel: levelObj?.label || '',
        materialId: materialObj?.id || '',
        materialLabel: materialObj?.label || '',
      },
    ]);

    resetComboInputs();
  };

  const removeCombo = (idx) =>
    setModuleItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Geef de module een naam.');
      return;
    }
    if (moduleItems.length === 0) {
      setError('Voeg ten minste één vak toe aan deze module.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: module.id,
        name: name.trim(),
        subjects: [
          {
            subject_id: Number(moduleItems[0].subjectId),
            level: String(moduleItems[0].levelLabel),
            material: String(moduleItems[0].materialLabel),
          },
        ],
      });
      console.log('moduleItems', moduleItems);
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
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
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

            {/* Add */}
            <Button
              type="button"
              onClick={handleAddCombo}
              variant="outline"
              size="icon"
              disabled={
                !selectedSubjectId ||
                !selectedLevel ||
                !selectedMaterial ||
                loading
              }
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Voeg toe</span>
            </Button>
          </div>

          {/* Geselecteerde combinaties */}
          <div className="space-y-2">
            <Label>Toegevoegde vakken</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
              {moduleItems.length > 0 ? (
                moduleItems.map((item, i) => (
                  <Badge
                    key={`${item.subjectId}-${item.levelId}-${item.materialId}-${i}`}
                    variant="secondary"
                    className="flex items-center gap-2 py-1.5 px-3 text-sm"
                  >
                    <span>
                      {String(item.subjectName || '')} –{' '}
                      {String(item.levelLabel || '')} –{' '}
                      {String(item.materialLabel || '')}
                    </span>
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-background/50"
                      onClick={() => removeCombo(i)}
                      aria-label="Remove item"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic px-2">
                  Nog geen vakken toegevoegd.
                </p>
              )}
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
