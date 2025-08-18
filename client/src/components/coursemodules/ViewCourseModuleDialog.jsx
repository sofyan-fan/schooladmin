import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart3, BookOpen } from 'lucide-react';

export default function ViewCourseModuleDialog({ module, open, onOpenChange }) {
  // We don't render anything if no module is selected
  if (!module) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-bold">
            {module.name}
          </DialogTitle>
          <DialogDescription>
            Overzicht van de inhoud van het module.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold text-lg border-b pb-2">
            Inbegrepen Vakken
          </h3>
          {module.subjects && module.subjects.length > 0 ? (
            <ul className="space-y-3">
              {module.subjects.map((subject, index) => (
                <li key={index} className="p-4 bg-muted/50 rounded-lg border">
                  <div className="font-semibold text-base text-foreground">
                    {subject.subjectName || subject.subjectId}
                  </div>
                  <div className="mt-2 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span>
                      Niveau:{' '}
                      <span className="font-medium text-foreground">
                        {subject.level}
                      </span>
                    </span>

                    <BookOpen className="h-4 w-4" />
                    <span>
                      Literatuur:{' '}
                      <span className="font-medium text-foreground">
                        {subject.material}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">
              Dit module bevat nog geen vakken.
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
