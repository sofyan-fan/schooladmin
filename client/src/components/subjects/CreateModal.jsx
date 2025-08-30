import subjectAPI from '@/apis/subjectAPI';
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
import { useEffect, useState } from 'react';

function Tag({ children, onRemove }) {
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

export default function CreateModal({ open, onOpenChange, onSave }) {
  const [name, setName] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [levels, setLevels] = useState([]);
  const [materialInput, setMaterialInput] = useState('');
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setLevels([]);
      setMaterials([]);
      setError('');
    }
  }, [open]);

  const addLevel = () => {
    if (levelInput.trim() && !levels.includes(levelInput.trim())) {
      setLevels([...levels, levelInput.trim()]);
      setLevelInput('');
    }
  };

  const removeLevel = (idx) => setLevels(levels.filter((_, i) => i !== idx));

  const addMaterial = () => {
    if (materialInput.trim() && !materials.includes(materialInput.trim())) {
      setMaterials([...materials, materialInput.trim()]);
      setMaterialInput('');
    }
  };

  const removeMaterial = (idx) =>
    setMaterials(materials.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a subject name.');
      return;
    }
    if (levels.length === 0) {
      setError('Please add at least one level.');
      return;
    }
    if (materials.length === 0) {
      setError('Please add at least one material.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const subjectData = {
        name: name.trim(),
        levels,
        materials,
      };

      const savedSubject = await subjectAPI.add_subject(subjectData);
      if (onSave) {
        onSave(savedSubject);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
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
          className="flex flex-col gap-2 mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="mb-4">
            <label className="block mb-1 font-medium ">Naam</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Niveau's</label>
            <div className="flex gap-2">
              <Input
                value={levelInput}
                onChange={(e) => setLevelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLevel();
                  }
                }}
                disabled={loading}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addLevel}
                disabled={loading}
              >
                +
              </Button>
            </div>
            <div className="flex flex-wrap mt-2 min-h-[30px]">
              {levels.map((level, i) => (
                <Tag key={level + i} onRemove={() => removeLevel(i)}>
                  {level}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">Literatuur</label>
            <div className="flex gap-2">
              <Input
                value={materialInput}
                onChange={(e) => setMaterialInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMaterial();
                  }
                }}
                disabled={loading}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addMaterial}
                disabled={loading}
              >
                +
              </Button>
            </div>
            <div className="flex flex-wrap mt-2 min-h-[30px]">
              {materials.map((material, i) => (
                <Tag key={material + i} onRemove={() => removeMaterial(i)}>
                  {material}
                </Tag>
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
              {loading ? 'Opslaan...' : 'Vak opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
