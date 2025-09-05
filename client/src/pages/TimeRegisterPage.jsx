import rosterAPI from '@/apis/rosterAPI';
import { get_students } from '@/apis/studentAPI';
import { get_teachers } from '@/apis/teachersAPI';
import { absenceAPI, timeRegisterAPI } from '@/apis/timeregisterAPI';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, Edit, Plus, Timer, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const TimeRegisterPage = () => {
  const { user } = useAuth();
  const [timeRegistrations, setTimeRegistrations] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('time-registration');

  // Time Registration Form State
  const [timeRegForm, setTimeRegForm] = useState({
    teacher_id: '',
    week_start: '',
    week_end: '',
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });

  // Absence Form State
  const [absenceForm, setAbsenceForm] = useState({
    user_id: '',
    role: 'student',
    roster_id: '',
    date: '',
    reason: '',
    custom_reason: '',
  });

  const [isTimeRegModalOpen, setIsTimeRegModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [editingTimeReg, setEditingTimeReg] = useState(null);
  const [editingAbsence, setEditingAbsence] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timeRegData, absenceData, teacherData, studentData, rosterData] =
        await Promise.all([
          timeRegisterAPI.getAllTimeRegistrations(),
          absenceAPI.getAllAbsences(),
          get_teachers(),
          get_students(),
          rosterAPI.get_rosters(),
        ]);

      setTimeRegistrations(timeRegData.data || []);
      setAbsences(absenceData || []);
      setTeachers(teacherData || []);
      setStudents(studentData || []);
      setRosters(rosterData || []);
    } catch {
      toast.error('Laden van gegevens mislukt');
    } finally {
      setLoading(false);
    }
  };

  const calculateWeekDates = (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  };

  const handleTimeRegSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { start, end } = calculateWeekDates(timeRegForm.week_start);
      const data = {
        ...timeRegForm,
        week_start: start.toISOString(),
        week_end: end.toISOString(),
        teacher_id: parseInt(timeRegForm.teacher_id),
      };

      if (editingTimeReg) {
        await timeRegisterAPI.updateTimeRegistration(editingTimeReg.id, data);
        toast.success('Tijd registratie succesvol bijgewerkt');
      } else {
        await timeRegisterAPI.createTimeRegistration(data);
        toast.success('Tijd registratie succesvol aangemaakt');
      }

      setIsTimeRegModalOpen(false);
      resetTimeRegForm();
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Opslaan tijd registratie mislukt'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAbsenceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...absenceForm,
        user_id: parseInt(absenceForm.user_id),
        roster_id: parseInt(absenceForm.roster_id),
        date: new Date(absenceForm.date).toISOString(),
        reason:
          absenceForm.reason === 'Andere'
            ? absenceForm.custom_reason
            : absenceForm.reason,
      };

      if (editingAbsence) {
        await absenceAPI.updateAbsence(editingAbsence.id, data);
        toast.success('Afwezigheid succesvol bijgewerkt');
      } else {
        await absenceAPI.createAbsence(data);
        toast.success('Afwezigheid succesvol aangemaakt');
      }

      setIsAbsenceModalOpen(false);
      resetAbsenceForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Opslaan afwezigheid mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTimeRegistration = async (id) => {
    setLoading(true);
    try {
      await timeRegisterAPI.approveTimeRegistration(id, user.id);
      toast.success('Tijd registratie succesvol goedgekeurd');
      fetchData();
    } catch {
      toast.error('Goedkeuren tijd registratie mislukt');
    } finally {
      setLoading(false);
    }
  };

  const resetTimeRegForm = () => {
    setTimeRegForm({
      teacher_id: '',
      week_start: '',
      week_end: '',
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    });
    setEditingTimeReg(null);
  };

  const resetAbsenceForm = () => {
    setAbsenceForm({
      user_id: '',
      role: 'student',
      roster_id: '',
      date: '',
      reason: '',
      custom_reason: '',
    });
    setEditingAbsence(null);
  };

  const editTimeRegistration = (registration) => {
    setTimeRegForm({
      teacher_id: registration.teacher_id.toString(),
      week_start: new Date(registration.week_start).toISOString().split('T')[0],
      week_end: new Date(registration.week_end).toISOString().split('T')[0],
      monday: registration.monday,
      tuesday: registration.tuesday,
      wednesday: registration.wednesday,
      thursday: registration.thursday,
      friday: registration.friday,
      saturday: registration.saturday,
      sunday: registration.sunday,
    });
    setEditingTimeReg(registration);
    setIsTimeRegModalOpen(true);
  };

  const editAbsence = (absence) => {
    const isCustomReason = ![
      'Ziek',
      'Doktersafspraak',
      'Familieomstandigheden',
      'Vakantie',
      'Religieuze feestdag',
      'Schoolactiviteit',
      'Transport problemen',
    ].includes(absence.reason);

    setAbsenceForm({
      user_id: absence.user_id.toString(),
      role: absence.role,
      roster_id: absence.roster_id.toString(),
      date: new Date(absence.date).toISOString().split('T')[0],
      reason: isCustomReason ? 'Andere' : absence.reason,
      custom_reason: isCustomReason ? absence.reason : '',
    });
    setEditingAbsence(absence);
    setIsAbsenceModalOpen(true);
  };

  const getTotalHours = () => {
    return Object.values(timeRegForm)
      .filter((value, index) => index > 2 && index < 10)
      .reduce((sum, hours) => sum + parseFloat(hours || 0), 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown';
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student
      ? `${student.first_name} ${student.last_name}`
      : `Student ID: ${studentId}`;
  };

  const getRosterInfo = (rosterId) => {
    const roster = rosters.find((r) => r.id === rosterId);
    if (!roster) return `Rooster ID: ${rosterId}`;
    return `${roster.subject?.name || 'Onbekend vak'} - ${roster.day_of_week} ${
      roster.start_time
    }-${roster.end_time}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tijd Registratie & Afwezigheid</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="time-registration"
            className="flex items-center gap-2"
          >
            <Timer className="w-4 h-4" />
            Tijd Registratie
          </TabsTrigger>
          <TabsTrigger value="absences" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Afwezigheid
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time-registration" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Tijd Registraties</h2>
            <Dialog
              open={isTimeRegModalOpen}
              onOpenChange={setIsTimeRegModalOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={resetTimeRegForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Registratie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTimeReg ? 'Bewerk' : 'Nieuwe'} Tijd Registratie
                  </DialogTitle>
                  <DialogDescription>
                    Vul de uren in voor elke dag van de week.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTimeRegSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher_id">Docent</Label>
                      <Select
                        value={timeRegForm.teacher_id}
                        onValueChange={(value) =>
                          setTimeRegForm((prev) => ({
                            ...prev,
                            teacher_id: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer docent" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem
                              key={teacher.id}
                              value={teacher.id.toString()}
                            >
                              {teacher.first_name} {teacher.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="week_start">Week Start</Label>
                      <Input
                        type="date"
                        value={timeRegForm.week_start}
                        onChange={(e) =>
                          setTimeRegForm((prev) => ({
                            ...prev,
                            week_start: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ].map((day) => (
                      <div key={day} className="space-y-2">
                        <Label htmlFor={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={timeRegForm[day]}
                          onChange={(e) =>
                            setTimeRegForm((prev) => ({
                              ...prev,
                              [day]: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Totaal Uren:</span>
                      <Badge variant="secondary">{getTotalHours()} uur</Badge>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTimeRegModalOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Docent</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Totaal Uren</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        {getTeacherName(registration.teacher_id)}
                      </TableCell>
                      <TableCell>
                        {formatDate(registration.week_start)} -{' '}
                        {formatDate(registration.week_end)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {registration.total_hours} uur
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {registration.approved ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Goedgekeurd
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            In afwachting
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editTimeRegistration(registration)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!registration.approved && user?.role === 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleApproveTimeRegistration(registration.id)
                              }
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="absences" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Afwezigheden</h2>
            <Dialog
              open={isAbsenceModalOpen}
              onOpenChange={setIsAbsenceModalOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={resetAbsenceForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuwe Afwezigheid
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAbsence ? 'Bewerk' : 'Nieuwe'} Afwezigheid
                  </DialogTitle>
                  <DialogDescription>
                    Registreer een nieuwe afwezigheid.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAbsenceSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol</Label>
                      <Select
                        value={absenceForm.role}
                        onValueChange={(value) => {
                          setAbsenceForm((prev) => ({
                            ...prev,
                            role: value,
                            user_id: '', // Reset user selection when role changes
                          }));
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Docent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_id">
                        {absenceForm.role === 'student' ? 'Student' : 'Docent'}
                      </Label>
                      <Select
                        value={absenceForm.user_id}
                        onValueChange={(value) =>
                          setAbsenceForm((prev) => ({
                            ...prev,
                            user_id: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`Selecteer ${
                              absenceForm.role === 'student'
                                ? 'student'
                                : 'docent'
                            }`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {absenceForm.role === 'student'
                            ? students.map((student) => (
                                <SelectItem
                                  key={student.id}
                                  value={student.id.toString()}
                                >
                                  {student.first_name} {student.last_name}
                                </SelectItem>
                              ))
                            : teachers.map((teacher) => (
                                <SelectItem
                                  key={teacher.id}
                                  value={teacher.id.toString()}
                                >
                                  {teacher.first_name} {teacher.last_name}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="roster_id">Rooster/Les</Label>
                      <Select
                        value={absenceForm.roster_id}
                        onValueChange={(value) =>
                          setAbsenceForm((prev) => ({
                            ...prev,
                            roster_id: value,
                          }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer rooster" />
                        </SelectTrigger>
                        <SelectContent>
                          {rosters.map((roster) => (
                            <SelectItem
                              key={roster.id}
                              value={roster.id.toString()}
                            >
                              {roster.subject?.name || 'Onbekend vak'} -{' '}
                              {roster.day_of_week} {roster.start_time}-
                              {roster.end_time}
                              {roster.classroom?.name &&
                                ` (${roster.classroom.name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Datum</Label>
                      <Input
                        type="date"
                        value={absenceForm.date}
                        onChange={(e) =>
                          setAbsenceForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reden</Label>
                    <Select
                      value={absenceForm.reason}
                      onValueChange={(value) =>
                        setAbsenceForm((prev) => ({ ...prev, reason: value }))
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer reden voor afwezigheid" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ziek">Ziek</SelectItem>
                        <SelectItem value="Doktersafspraak">
                          Doktersafspraak
                        </SelectItem>
                        <SelectItem value="Familieomstandigheden">
                          Familieomstandigheden
                        </SelectItem>
                        <SelectItem value="Vakantie">Vakantie</SelectItem>
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
                  </div>

                  {absenceForm.reason === 'Andere' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom_reason">Andere reden</Label>
                      <Input
                        placeholder="Beschrijf de reden voor afwezigheid"
                        value={absenceForm.custom_reason || ''}
                        onChange={(e) =>
                          setAbsenceForm((prev) => ({
                            ...prev,
                            custom_reason: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAbsenceModalOpen(false)}
                    >
                      Annuleren
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persoon</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Les/Rooster</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Reden</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map((absence) => (
                    <TableRow key={absence.id}>
                      <TableCell>
                        {absence.role === 'student'
                          ? getStudentName(absence.user_id)
                          : getTeacherName(absence.user_id)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            absence.role === 'teacher' ? 'default' : 'secondary'
                          }
                        >
                          {absence.role === 'teacher' ? 'Docent' : 'Student'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div
                          className="truncate"
                          title={getRosterInfo(absence.roster_id)}
                        >
                          {getRosterInfo(absence.roster_id)}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(absence.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{absence.reason}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editAbsence(absence)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeRegisterPage;
