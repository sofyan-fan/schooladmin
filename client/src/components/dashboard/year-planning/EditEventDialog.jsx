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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Activiteit bewerken</DialogTitle>
          <DialogDescription>
            Pas de gegevens van de activiteit aan. Klik op opslaan als je klaar
            bent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Activity Name Field - Full Width */}
          <div className="space-y-2">
            <Input
              id="name"
              name="name"
              value={editedItem.name}
              onChange={onInputChange}
              placeholder="Naam van activiteit"
              className="w-full"
            />
          </div>

          {/* Date & Time Section */}
          <div className="space-y-3">
            {/* <Label className="text-sm font-medium">Datum & Tijd</Label> */}
            <div>
              <DateTimePicker
                date={editedItem.date || undefined}
                startTime={editedItem.startTime || ''}
                endTime={editedItem.endTime || ''}
                highlightToday={false}
                onDateChange={(date) => {
                  const event = {
                    target: {
                      name: 'date',
                      value: date
                        ? `${date.getFullYear()}-${String(
                            date.getMonth() + 1
                          ).padStart(2, '0')}-${String(date.getDate()).padStart(
                            2,
                            '0'
                          )}`
                        : '',
                    },
                  };
                  onInputChange(event);
                }}
                onStartTimeChange={(time) => {
                  const event = {
                    target: {
                      name: 'startTime',
                      value: time,
                    },
                  };
                  onInputChange(event);
                }}
                onEndTimeChange={(time) => {
                  const event = {
                    target: {
                      name: 'endTime',
                      value: time,
                    },
                  };
                  onInputChange(event);
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
              value={editedItem.description}
              onChange={onInputChange}
              rows={3}
              placeholder="Voer hier een beschrijving in..."
              className="w-full"
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
