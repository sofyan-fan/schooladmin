import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PropTypes from 'prop-types';
import RegisterWizard from './RegisterWizard';

function RegisterWizardDialog({
  open,
  onOpenChange,
  title = 'Registreren',
  initialRole = null,
  lockRole = false,
  silent = false,
  createStudentOnly = false,
  onSuccess,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        maxWidth="1000px"
        showCloseButton
        className="max-h-[calc(100vh-1rem)] sm:max-h-[94vh]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {/* Keep internal sections contained; avoid extra scroll wrappers */}
        <RegisterWizard
          initialRole={initialRole}
          lockRole={lockRole}
          silent={silent}
          createStudentOnly={createStudentOnly}
          inDialog
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

RegisterWizardDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string,
  initialRole: PropTypes.string,
  lockRole: PropTypes.bool,
  silent: PropTypes.bool,
  createStudentOnly: PropTypes.bool,
  onSuccess: PropTypes.func,
};

export default RegisterWizardDialog;
