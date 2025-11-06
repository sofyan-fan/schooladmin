import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileSpreadsheet, FileText } from 'lucide-react';

const ExportDialog = ({
  isOpen,
  onClose,
  onExportExcel,
  onExportPDF,
  title = 'Exporteer gegevens',
  description = 'Kies een bestandsformaat voor het exporteren.',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-6">
          <Button
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-secondary hover:border-primary"
            onClick={() => {
              onExportExcel();
              onClose();
            }}
          >
            <FileSpreadsheet className="size-16 text-green-600" />
            <div className="text-center">
              <div className="font-semibold text-lg">Excel</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-secondary hover:border-primary"
            onClick={() => {
              onExportPDF();
              onClose();
            }}
          >
            <FileText className="size-16 text-red-600" />
            <div className="text-center">
              <div className="font-semibold text-lg">PDF</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
