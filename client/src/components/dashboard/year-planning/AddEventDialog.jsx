import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
      <DialogContent className="sm:max-w-[700px]">
        <form onSubmit={onSave}>
          <DialogHeader>
            <DialogTitle>Nieuwe activiteit toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens voor de nieuwe activiteit in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Activity Name Field - Full Width */}
            <div className="space-y-2">
              <Input
                id="name"
                name="name"
                value={newItem.name}
                onChange={onNewItemChange}
                placeholder="Naam van activiteit"
                className="w-full"
              />
            </div>

            {/* Date & Time Section */}
            <div className="space-y-3">
              {/* <Label className="text-sm font-medium">Datum & Tijd</Label> */}
              <div>
                <DateTimePicker
                  date={newItem.date || undefined}
                  startTime={newItem.startTime || ''}
                  endTime={newItem.endTime || ''}
                  highlightToday={false}
                  onDateChange={(date) => {
                    const event = {
                      target: {
                        name: 'date',
                        value: date
                          ? `${date.getFullYear()}-${String(
                              date.getMonth() + 1
                            ).padStart(2, '0')}-${String(
                              date.getDate()
                            ).padStart(2, '0')}`
                          : '',
                      },
                    };
                    onNewItemChange(event);
                  }}
                  onStartTimeChange={(time) => {
                    const event = {
                      target: {
                        name: 'startTime',
                        value: time,
                      },
                    };
                    onNewItemChange(event);
                  }}
                  onEndTimeChange={(time) => {
                    const event = {
                      target: {
                        name: 'endTime',
                        value: time,
                      },
                    };
                    onNewItemChange(event);
                  }}
                  fromYear={new Date().getFullYear() - 1}
                  toYear={new Date().getFullYear() + 5}
                />
              </div>
            </div>

            {/* Description Field - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Beschrijving
              </Label>
              <Textarea
                id="description"
                name="description"
                value={newItem.description}
                onChange={onNewItemChange}
                rows={3}
                placeholder="Voer hier een beschrijving in..."
                className="w-full"
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
