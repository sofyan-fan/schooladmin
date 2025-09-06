import { get_teachers } from '@/apis/teachersAPI';
import { timeRegisterAPI } from '@/apis/timeregisterAPI';
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
import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, Edit, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const TimeRegisterPage = () => {
  const { user } = useAuth();
  const [timeRegistrations, setTimeRegistrations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const [isTimeRegModalOpen, setIsTimeRegModalOpen] = useState(false);
  const [editingTimeReg, setEditingTimeReg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timeRegData, teacherData] = await Promise.all([
        timeRegisterAPI.getAllTimeRegistrations(),
        get_teachers(),
      ]);

      setTimeRegistrations(timeRegData.data || []);
      setTeachers(teacherData || []);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tijd Registratie</h1>
      </div>

      <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default TimeRegisterPage;
