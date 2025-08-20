import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ClassroomForm from './ClassroomForm';

export default function CreateClassroomModal({ isOpen, onClose, onSave }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuw Lokaal</DialogTitle>
        </DialogHeader>
        <ClassroomForm
          onSave={async (data) => {
            await onSave(data);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
