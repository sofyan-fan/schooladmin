import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ClassroomForm from './ClassroomForm';

export default function EditClassroomModal({
  isOpen,
  onClose,
  classroom,
  onSave,
}) {
  if (!classroom) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lokaal Bewerken</DialogTitle>
        </DialogHeader>
        <ClassroomForm
          defaultValues={classroom}
          onSave={async (data) => {
            await onSave({ ...classroom, ...data });
            onClose();
          }}
          isEditing
        />
      </DialogContent>
    </Dialog>
  );
}
