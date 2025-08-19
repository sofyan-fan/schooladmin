import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RosterForm from './RosterForm';

export default function CreateRosterModal({
  isOpen,
  onClose,
  onRosterCreated,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Roster</DialogTitle>
        </DialogHeader>
        <RosterForm
          onSubmit={async (data) => {
            await onRosterCreated(data);
            onClose(); // Close modal on success
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
