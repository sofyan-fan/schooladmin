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

const AddEventDialog = ({
  isOpen,
  onClose,
  newItem,
  onNewItemChange,
  onSave,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSave}>
          <DialogHeader>
            <DialogTitle>Nieuwe activiteit toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens voor de nieuwe activiteit in.
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
                value={newItem.name}
                onChange={onNewItemChange}
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
                  value={newItem.date ? new Date(newItem.date) : undefined}
                  onChange={(date) => {
                    const event = {
                      target: {
                        name: 'date',
                        value: date ? date.toISOString().split('T')[0] : '',
                      },
                    };
                    onNewItemChange(event);
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
                value={newItem.description}
                onChange={onNewItemChange}
                className="col-span-3"
                rows={3}
                placeholder="Voeg een beschrijving toe..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="cursor-pointer hover:bg-gray-200"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuleren
            </Button>
            <Button className="cursor-pointer" type="submit">
              Opslaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
