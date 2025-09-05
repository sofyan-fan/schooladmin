import { absenceAPI } from '@/apis/timeregisterAPI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Clock, UserCheck, Users, UserX } from 'lucide-react';
import { toast } from 'sonner';

const LessonAbsenceDialog = ({
  open,
  onOpenChange,
  selectedRoster,
  selectedDate,
  getClassStudents,
  getStudentName,
  studentAbsences,
  setStudentAbsences,
  setAbsences,
}) => {
  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleStatusChangeAndSave = async (studentId, newStatus) => {
    if (!newStatus) return; // Do nothing if a toggle is deselected

    const originalStudentAbsences = JSON.parse(JSON.stringify(studentAbsences));
    const studentName = getStudentName(studentId);

    // Optimistic UI update
    setStudentAbsences((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
      },
    }));

    const studentState = originalStudentAbsences[studentId] || {};

    try {
      if (newStatus === 'present') {
        if (studentState.absenceId) {
          await absenceAPI.deleteAbsence(studentState.absenceId);
          toast.success(`${studentName} is marked as present.`);
          setStudentAbsences((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              absenceId: null,
              reason: '',
            },
          }));
        }
      } else {
        // 'late' or 'absent'
        const reason = newStatus === 'late' ? 'Te Laat' : 'Afwezig';
        const absenceData = {
          user_id: studentId,
          role: 'student',
          roster_id: selectedRoster.id,
          date: new Date(selectedDate).toISOString(),
          reason,
        };

        if (studentState.absenceId) {
          await absenceAPI.updateAbsence(studentState.absenceId, absenceData);
          toast.success(`Status for ${studentName} updated to: ${reason}`);
        } else {
          const response = await absenceAPI.createAbsence(absenceData);
          toast.success(`Status for ${studentName} set to: ${reason}`);
          setStudentAbsences((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              absenceId: response.id,
            },
          }));
        }
        setStudentAbsences((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            reason: reason,
          },
        }));
      }

      // Refresh all absences to stay in sync
      const updatedAbsences = await absenceAPI.getAllAbsences();
      setAbsences(updatedAbsences || []);
    } catch (error) {
      console.error('Error updating absence:', error);
      toast.error(`Failed to update status for ${studentName}.`);
      setStudentAbsences(originalStudentAbsences); // Revert on error
    }
  };

  if (!selectedRoster) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Afwezigheid - {selectedRoster.subject?.name || 'Onbekend Vak'}
          </DialogTitle>
          <DialogDescription>
            {selectedRoster.day_of_week} •{' '}
            {formatTime(selectedRoster.start_time)} -{' '}
            {formatTime(selectedRoster.end_time)} •{' '}
            {selectedRoster.classroom?.name || 'Geen lokaal'} •{' '}
            {formatDate(selectedDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {getClassStudents(selectedRoster).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Geen studenten gevonden voor deze klas.</p>
              <p className="text-sm">
                Controleer of er studenten zijn toegewezen aan de klas van dit
                rooster.
              </p>
            </div>
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">Student</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getClassStudents(selectedRoster).map((student) => {
                  const studentState = studentAbsences[student.id] || {
                    status: 'present',
                  };

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {getStudentName(student.id)}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={
                                    studentState.status === 'present'
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size="icon"
                                  className={`
                                    ${
                                      studentState.status === 'present'
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : ''
                                    }
                                  `}
                                  onClick={() =>
                                    handleStatusChangeAndSave(
                                      student.id,
                                      'present'
                                    )
                                  }
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Aanwezig</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={
                                    studentState.status === 'late'
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size="icon"
                                  className={`
                                    ${
                                      studentState.status === 'late'
                                        ? 'bg-orange-500 hover:bg-orange-600'
                                        : ''
                                    }
                                  `}
                                  onClick={() =>
                                    handleStatusChangeAndSave(
                                      student.id,
                                      'late'
                                    )
                                  }
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Te Laat</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={
                                    studentState.status === 'absent'
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size="icon"
                                  className={`
                                    ${
                                      studentState.status === 'absent'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : ''
                                    }
                                  `}
                                  onClick={() =>
                                    handleStatusChangeAndSave(
                                      student.id,
                                      'absent'
                                    )
                                  }
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Afwezig</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
};

export default LessonAbsenceDialog;
