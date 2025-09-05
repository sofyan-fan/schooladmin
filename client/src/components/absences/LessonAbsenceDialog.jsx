import { absenceAPI } from '@/apis/timeregisterAPI';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Save, UserCheck, Users, UserX, X } from 'lucide-react';
import { useState } from 'react';
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
  editingStudents,
  setEditingStudents,
  setAbsences,
}) => {
  const [loading, setLoading] = useState(false);

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleStudentStatusChange = (studentId, field, value) => {
    setStudentAbsences((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveStudentAbsence = async (studentId) => {
    const studentState = studentAbsences[studentId];
    setLoading(true);

    try {
      if (studentState.status === 'absent') {
        const absenceData = {
          user_id: studentId,
          role: 'student',
          roster_id: selectedRoster.id,
          date: new Date(selectedDate).toISOString(),
          reason:
            studentState.reason === 'Andere'
              ? studentState.custom_reason
              : studentState.reason,
        };

        if (studentState.absenceId) {
          // Update existing absence
          await absenceAPI.updateAbsence(studentState.absenceId, absenceData);
          toast.success('Afwezigheid bijgewerkt');
        } else {
          // Create new absence
          const response = await absenceAPI.createAbsence(absenceData);
          setStudentAbsences((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              absenceId: response.id,
            },
          }));
          toast.success('Afwezigheid geregistreerd');
        }
      } else if (studentState.status === 'present' && studentState.absenceId) {
        // Delete existing absence if student is marked present
        await absenceAPI.deleteAbsence(studentState.absenceId);
        setStudentAbsences((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            absenceId: null,
            reason: '',
            custom_reason: '',
          },
        }));
        toast.success('Afwezigheid verwijderd');
      }

      // Remove from editing set
      setEditingStudents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });

      // Refresh absences data
      const updatedAbsences = await absenceAPI.getAllAbsences();
      setAbsences(updatedAbsences || []);
    } catch (error) {
      toast.error('Fout bij opslaan van afwezigheid');
      console.error('Error saving absence:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEditStudent = (studentId) => {
    setEditingStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setEditingStudents(new Set());
  };

  if (!selectedRoster) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reden</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getClassStudents(selectedRoster).map((student) => {
                  const studentState = studentAbsences[student.id] || {};
                  const isEditing = editingStudents.has(student.id);

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {getStudentName(student.id)}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={studentState.status || 'present'}
                            onValueChange={(value) =>
                              handleStudentStatusChange(
                                student.id,
                                'status',
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                  Aanwezig
                                </div>
                              </SelectItem>
                              <SelectItem value="absent">
                                <div className="flex items-center gap-2">
                                  <UserX className="w-4 h-4 text-red-600" />
                                  Afwezig
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant={
                              studentState.status === 'absent'
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {studentState.status === 'absent' ? (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Afwezig
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" />
                                Aanwezig
                              </>
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing && studentState.status === 'absent' ? (
                          <div className="space-y-2">
                            <Select
                              value={studentState.reason || ''}
                              onValueChange={(value) =>
                                handleStudentStatusChange(
                                  student.id,
                                  'reason',
                                  value
                                )
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Selecteer reden" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Ziek">Ziek</SelectItem>
                                <SelectItem value="Doktersafspraak">
                                  Doktersafspraak
                                </SelectItem>
                                <SelectItem value="Familieomstandigheden">
                                  Familieomstandigheden
                                </SelectItem>
                                <SelectItem value="Vakantie">
                                  Vakantie
                                </SelectItem>
                                <SelectItem value="Religieuze feestdag">
                                  Religieuze feestdag
                                </SelectItem>
                                <SelectItem value="Schoolactiviteit">
                                  Schoolactiviteit
                                </SelectItem>
                                <SelectItem value="Transport problemen">
                                  Transport problemen
                                </SelectItem>
                                <SelectItem value="Andere">Andere</SelectItem>
                              </SelectContent>
                            </Select>
                            {studentState.reason === 'Andere' && (
                              <Input
                                placeholder="Andere reden..."
                                value={studentState.custom_reason || ''}
                                onChange={(e) =>
                                  handleStudentStatusChange(
                                    student.id,
                                    'custom_reason',
                                    e.target.value
                                  )
                                }
                                className="w-48"
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm">
                            {studentState.status === 'absent'
                              ? studentState.reason || 'Geen reden'
                              : '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSaveStudentAbsence(student.id)
                                }
                                disabled={loading}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleEditStudent(student.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleEditStudent(student.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LessonAbsenceDialog;
