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
import { useEffect, useState } from 'react';

export default function CourseModuleModal({
  open,
  onOpenChange,
  onSave,
  subjects,
  module,
}) {
  const [name, setName] = useState('');
  const [moduleItems, setModuleItems] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditMode = !!module;

  useEffect(() => {
    if (isEditMode) {
      setName(module.name);
      setModuleItems(
        module.subjects.map((s) => ({
          subjectId: s.subject_id,
          subjectName: s.subject.name,
          level: s.level,
          material: s.material,
        }))
      );
    }
  }, [module, isEditMode]);

  const selectedSubject = Array.isArray(subjects)
    ? subjects.find((s) => s.id === Number(selectedSubjectId))
    : undefined;

  const resetComboInputs = () => {
    setSelectedSubjectId('');
    setSelectedLevel('');
    setSelectedMaterial('');
  };

  const handleAddCombo = () => {
    if (!selectedSubjectId || !selectedLevel || !selectedMaterial) return;
    setModuleItems((prev) => [
      ...prev,
      {
        subjectId: Number(selectedSubjectId),
        subjectName: selectedSubject?.name || '',
        level: selectedLevel,
        material: selectedMaterial,
      },
    ]);
    resetComboInputs();
  };

  const removeCombo = (idx) =>
    setModuleItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Please enter a module name.');
      return;
    }
    if (moduleItems.length === 0) {
      setError('Add at least one subject to this module.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSave({
        id: isEditMode ? module.id : undefined,
        name: name.trim(),
        subjects: moduleItems.map(({ subjectId, level, material }) => ({
          subject_id: subjectId,
          level,
          material,
        })),
      });
      setName('');
      setModuleItems([]);
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Lespakket' : 'Nieuw Lespakket Toevoegen'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Bewerk de gegevens van het lespakket.'
              : 'Creëer een nieuw lespakket door een naam op te geven en de bijbehorende vakken te selecteren.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {/* Module Name Input */}
          <div className="space-y-2">
            <Label htmlFor="moduleName">Lespakket naam</Label>
            <Input
              id="moduleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
          </div>

          {/* Subject/Level/Material Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
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
                  {/* ====== FIX IS HERE ====== */}
                  {(selectedSubject?.levels || []).map((level) => (
                    <SelectItem key={level.id} value={level.level}>
                      {level.level}
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
                  {/* ====== FIX IS HERE ====== */}
                  {(selectedSubject?.materials || []).map((material) => (
                    <SelectItem key={material.id} value={material.material}>
                      {material.material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {/* Display for Added Combos */}
          <div className="space-y-2">
            <Label>Toegevoegde vakken</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/50">
              {moduleItems.length > 0 ? (
                moduleItems.map((item, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-2 py-1.5 px-3 text-sm"
                  >
                    <span>
                      {item.subjectName} – {item.level} – {item.material}
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
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Opslaan...'
                : isEditMode
                ? 'Wijzigingen Opslaan'
                : 'Lespakket Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
