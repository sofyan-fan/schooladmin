import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

export default function ViewCourseDialog({ course, open, onOpenChange }) {
  if (!course) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-bold">
            {course.name}
          </DialogTitle>
          <DialogDescription>
            {course.description || 'Gedetailleerd overzicht van het lespakket.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-lg">Inbegrepen Modules</h3>
            <Badge variant="secondary" className="text-lg">
              €{course.price}
            </Badge>
          </div>
          {course.modules && course.modules.length > 0 ? (
            <ul className="space-y-2">
              {course.modules.map((module) => (
                <li
                  key={module.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{module.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Dit lespakket bevat nog geen modules.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
