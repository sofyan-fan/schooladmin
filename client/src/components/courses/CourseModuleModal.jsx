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
import { X } from 'lucide-react';
import { useState } from 'react';
import courseModuleApi from '../../apis/courses/courseModuleAPI';

function ComboTag({ children, onRemove }) {
  return (
    <span className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-2">
      {children}
      <button
        type="button"
        className="ml-1 text-gray-400 hover:text-gray-600"
        onClick={onRemove}
        tabIndex={-1}
        aria-label="Remove"
      >
        <X size={14} />
      </button>
    </span>
  );
}

/**
 * @param {object[]} subjects - [{id, name, levels, materials}]
 */
export default function CourseModuleModal({
  open,
  onOpenChange,
  onSave,
  subjects,
}) {
  const [name, setName] = useState('');
  // "moduleItems" = [{subjectId, level, material, subjectName}]
  const [moduleItems, setModuleItems] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
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
      const savedModule = await courseModuleApi.add_coursemodule({
        name: name.trim(),
        subjects: moduleItems,
      });
      if (onSave) onSave(savedModule);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lespakket toevoegen</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4 mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div>
            <label className="block mb-1 font-medium">Lespakket naam</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Vak</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedLevel('');
                  setSelectedMaterial('');
                }}
                disabled={loading}
              >
                <option value="">Kies een vak...</option>
                {Array.isArray(subjects) &&
                  subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Niveau</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                disabled={!selectedSubjectId || loading}
              >
                <option value="">Kies niveau...</option>
                {selectedSubject?.levels.map((level, i) => (
                  <option key={i} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Literatuur</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                disabled={!selectedSubjectId || loading}
              >
                <option value="">Kies literatuur...</option>
                {selectedSubject?.materials.map((material, i) => (
                  <option key={i} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={handleAddCombo}
              variant="secondary"
              className="ml-2 h-10"
              disabled={
                !selectedSubjectId ||
                !selectedLevel ||
                !selectedMaterial ||
                loading
              }
            >
              +
            </Button>
          </div>
          <div>
            <label className="block mb-1 font-medium">Gekozen vakken</label>
            <div className="flex flex-wrap min-h-[28px]">
              {moduleItems.map((item, i) => (
                <ComboTag key={i} onRemove={() => removeCombo(i)}>
                  {item.subjectName} – {item.level} – {item.material}
                </ComboTag>
              ))}
            </div>
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <DialogFooter className="flex justify-between pt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={loading}>
                Terug
              </Button>
            </DialogClose>
            <Button type="submit" variant="default" disabled={loading}>
              {loading ? 'Opslaan...' : 'Opslaan lespakket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
