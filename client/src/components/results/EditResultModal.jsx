import resultAPI from '@/apis/resultAPI';
import { Button } from '@/components/ui/button';
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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditResultModal({
  open,
  onOpenChange,
  result,
  onSave,
}) {
  const [grade, setGrade] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (result) {
      setGrade(result.grade);
    }
  }, [result]);

  const handleSave = async () => {
    if (!reason) {
      toast.error('Een reden voor de wijziging is vereist.');
      return;
    }

    setIsLoading(true);
    try {
      const updatedResult = await resultAPI.update_result({
        id: result.id,
        grade: parseFloat(grade),
        // In a real scenario, we'd also send the 'reason' to a logging endpoint
      });
      toast.success('Resultaat bijgewerkt!');
      onSave(updatedResult); // Pass the updated result back to the parent
      onOpenChange(false);
    } catch (error) {
      console.error('Kon het resultaat niet bijwerken', error);
      toast.error('Kon het resultaat niet bijwerken.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="550px">
        <DialogHeader>
          <DialogTitle>Wijzig Resultaat</DialogTitle>
          <DialogDescription>
            Wijzig het cijfer voor{' '}
            <strong>
              {result.student.first_name} {result.student.last_name}
            </strong>{' '}
            voor de toets <strong>{result.assessment.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Cijfer</Label>
            <Input
              id="grade"
              type="number"
              step="0.1"
              min="1"
              max="10"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reden voor wijziging</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="bg-white"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
