import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DeleteEventDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Weet je het zeker?</DialogTitle>
          <DialogDescription>
            Deze actie kan niet ongedaan worden gemaakt. Dit zal de activiteit
            permanent verwijderen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" onClick={onConfirm}>
            Verwijderen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEventDialog;
