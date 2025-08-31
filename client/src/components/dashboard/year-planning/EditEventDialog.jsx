import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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

const EditEventDialog = ({
  isOpen,
  onClose,
  editedItem,
  onInputChange,
  onSaveChanges,
}) => {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Activiteit bewerken</DialogTitle>
          <DialogDescription>
            Pas de gegevens van de activiteit aan. Klik op opslaan als je klaar
            bent.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Activiteit
            </Label>
            <Input
              id="name"
              name="name"
              value={editedItem.name}
              onChange={onInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Datum
            </Label>
            <div className="col-span-3">
              <DatePicker
                id="date"
                value={editedItem.date ? new Date(editedItem.date) : undefined}
                onChange={(date) => {
                  const event = {
                    target: {
                      name: 'date',
                      value: date ? date.toISOString().split('T')[0] : '',
                    },
                  };
                  onInputChange(event);
                }}
                placeholder="Selecteer datum"
                fromYear={new Date().getFullYear() - 1}
                toYear={new Date().getFullYear() + 5}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Beschrijving
            </Label>
            <Textarea
              id="description"
              name="description"
              value={editedItem.description}
              onChange={onInputChange}
              className="col-span-3"
              rows={3}
              placeholder="Voeg een beschrijving toe..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" onClick={onSaveChanges}>
            Wijzigingen opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
