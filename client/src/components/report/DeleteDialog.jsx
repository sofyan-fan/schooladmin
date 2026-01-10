import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DeleteDialog = ({ isOpen, onClose, onConfirm, subjectName }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Weet je het zeker?</AlertDialogTitle>
          <AlertDialogDescription>
            {subjectName
              ? `Dit zal "${subjectName}" uit de rapport configuratie verwijderen.`
              : 'Dit zal het vak uit de rapport configuratie verwijderen.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={onClose}
          >
            Annuleren
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Verwijderen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
