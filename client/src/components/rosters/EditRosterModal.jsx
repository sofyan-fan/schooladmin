import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RosterForm from './RosterForm';

export default function EditRosterModal({
  isOpen,
  onClose,
  roster,
  onRosterUpdated,
}) {
  if (!roster) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Roster</DialogTitle>
        </DialogHeader>
        <RosterForm
          defaultValues={roster}
          onSubmit={async (data) => {
            await onRosterUpdated({ ...roster, ...data });
            onClose();
          }}
          isEditing
        />
      </DialogContent>
    </Dialog>
  );
}
