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
              <Input
                type="date"
                id="date"
                name="date"
                value={newItem.date}
                onChange={onNewItemChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Beschrijving
              </Label>
              <Input
                type="textarea"
                id="description"
                name="description"
                value={newItem.description}
                onChange={onNewItemChange}
                className="col-span-3"
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
