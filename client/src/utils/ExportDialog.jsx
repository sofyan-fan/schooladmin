import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

const ExportDialog = ({
  isOpen,
  onClose,
  onExportExcel,
  onExportPDF,
  title = 'Exporteer gegevens',
  description = 'Kies een bestandsformaat voor het exporteren.',
  // Optional: enable scope/date selection (used by roosters export)
  enableScopeSelection = false,
  defaultScope = 'week', // 'day' | 'week'
  defaultDate,
}) => {
  const [scope, setScope] = useState('week');
  const [selectedDate, setSelectedDate] = useState(defaultDate || new Date());
  const [step, setStep] = useState(1); // 1 = choose date/scope, 2 = choose format

  useEffect(() => {
    setScope('week');
  }, [defaultScope]);

  useEffect(() => {
    if (defaultDate) setSelectedDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {enableScopeSelection ? (
          <>
            {step === 1 ? (
              <div className="space-y-4 mt-2">
                <div className="text-sm text-muted-foreground">Bereik: Week</div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Kies een datum (start van de week)
                  </div>
                  <DatePicker
                    value={selectedDate}
                    onChange={(d) => d && setSelectedDate(d)}
                    placeholder="Selecteer datum"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" onClick={() => setStep(2)}>
                    Volgende
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mt-1">
                  Gekozen: {scope === 'day' ? 'Dag' : 'Week'} –{' '}
                  {selectedDate?.toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="grid grid-cols-2 gap-4 py-6">
                  <Button
                    variant="outline"
                    className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-secondary hover:border-primary"
                    onClick={() => {
                      onExportExcel?.({ scope, date: selectedDate });
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
                      onExportPDF?.({ scope, date: selectedDate });
                      onClose();
                    }}
                  >
                    <FileText className="size-16 text-red-600" />
                    <div className="text-center">
                      <div className="font-semibold text-lg">PDF</div>
                    </div>
                  </Button>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Terug
                  </Button>
                  <div />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-6">
            <Button
              variant="outline"
              className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-secondary hover:border-primary"
              onClick={() => {
                onExportExcel?.();
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
                onExportPDF?.();
                onClose();
              }}
            >
              <FileText className="size-16 text-red-600" />
              <div className="text-center">
                <div className="font-semibold text-lg">PDF</div>
              </div>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
