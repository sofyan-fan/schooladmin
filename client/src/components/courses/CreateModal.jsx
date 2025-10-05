import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';

export default function CreateModal({
  open,
  onOpenChange,
  onSave,
  availableModules = [],
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setPrice('');
      setSelectedModuleIds(new Set());
      setError('');
    }
  }, [open]);

  const handleModuleToggle = (moduleId) => {
    setSelectedModuleIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim() || !price) {
      setError('Naam en prijs zijn verplicht.');
      return;
    }
    if (selectedModuleIds.size === 0) {
      setError('Selecteer ten minste één module.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        moduleIds: Array.from(selectedModuleIds),
      });
      onOpenChange(false); // Close modal on success
    } catch (err) {
      setError(err.message || 'Kon het lespakket niet opslaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nieuw Lespakket Toevoegen</DialogTitle>
          <DialogDescription>
            Creëer een nieuw lespakket door een naam, prijs en de bijbehorende
            modules te selecteren.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6 pt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courseName">Naam lespakket</Label>
              <Input
                id="courseName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseDescription">Omschrijving</Label>
              <Textarea
                id="courseDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                placeholder="Geef een korte omschrijving van het lespakket..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coursePrice">Prijs (€)</Label>
              <Input
                id="coursePrice"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Selecteer Modules</Label>
            <div className="max-h-60 overflow-y-auto p-3 border rounded-md bg-muted/50 space-y-3">
              {availableModules.length > 0 ? (
                availableModules.map((module) => (
                  <div key={module.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedModuleIds.has(module.id)}
                      onCheckedChange={() => handleModuleToggle(module.id)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor={`module-${module.id}`}
                      className="font-normal cursor-pointer"
                    >
                      {module.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Geen modules beschikbaar. Maak eerst een module aan.
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
              {loading ? 'Opslaan...' : 'Lespakket Opslaan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
