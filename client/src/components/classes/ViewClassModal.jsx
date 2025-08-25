import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '../ui/badge';

export default function ViewClassModal({ isOpen, onClose, classData }) {
  if (!classData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{classData.name}</DialogTitle>
          <DialogDescription>Details of the class.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold">Mentor</h4>
            <p>
              {classData.mentor
                ? `${classData.mentor.first_name} ${classData.mentor.last_name}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Course</h4>
            <p>{classData.course?.name || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold">Students</h4>
            <div className="flex flex-wrap gap-2">
              {classData.students?.length > 0 ? (
                classData.students.map((student) => (
                  <Badge
                    key={student.id}
                    variant="outline"
                  >{`${student.first_name} ${student.last_name}`}</Badge>
                ))
              ) : (
                <p>No students enrolled.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
