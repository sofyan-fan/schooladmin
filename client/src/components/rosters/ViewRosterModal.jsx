import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function ViewRosterModal({ isOpen, onClose, roster }) {
  if (!roster) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>View Roster: {roster.className}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Schedules</h3>
          {roster.schedules.map((schedule, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="font-semibold">Day</p>
                  <p>{schedule.day}</p>
                </div>
                <div>
                  <p className="font-semibold">Location</p>
                  <p>{schedule.location}</p>
                </div>
                <div>
                  <p className="font-semibold">Time</p>
                  <p>
                    <Badge variant="outline">{schedule.startTime}</Badge> -{' '}
                    <Badge variant="outline">{schedule.endTime}</Badge>
                  </p>
                </div>
              </div>
              {index < roster.schedules.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
