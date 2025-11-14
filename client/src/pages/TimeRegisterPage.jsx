import { get_teachers } from '@/apis/teachersAPI';
import { timeRegisterAPI } from '@/apis/timeregisterAPI';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ComboboxField from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, Edit } from 'lucide-react';
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
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: '',
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
    if (!timeRegForm.week_start) {
      toast.error('Selecteer een weekstart datum');
      return;
    }
    setLoading(true);

    try {
      const { start, end } = calculateWeekDates(timeRegForm.week_start);
      const dayKeys = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      const numericDays = dayKeys.reduce((acc, day) => {
        const value = timeRegForm[day];
        acc[day] = value === '' ? 0 : parseFloat(value || 0);
        return acc;
      }, {});
      const data = {
        ...timeRegForm,
        ...numericDays,
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
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: '',
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
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Onbekend';
  };

  return (
    <div className="container mx-auto">
      <PageHeader
        title="Tijd Registraties"
        icon={<Clock className="size-9" />}
        description="Beheer tijd registraties voor docenten."
        buttonText="Nieuwe Registratie"
        onAdd={() => setIsTimeRegModalOpen(true)}
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">

          <Dialog
            open={isTimeRegModalOpen}
            onOpenChange={setIsTimeRegModalOpen}
          >
            <DialogTrigger asChild>

            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nieuwe Tijd Registratie</DialogTitle>
                <DialogDescription>
                  Vul de uren in voor elke dag van de week.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTimeRegSubmit} className="space-y-4">
                {/* Header section: Docent (left) and Week Start (right) */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <ComboboxField
                      label="Docent"
                      items={teachers.map((t) => ({
                        value: t.id.toString(),
                        label: `${t.first_name} ${t.last_name}`,
                      }))}
                      value={timeRegForm.teacher_id}
                      onChange={(value) =>
                        setTimeRegForm((prev) => ({
                          ...prev,
                          teacher_id: value,
                        }))
                      }
                      placeholder="Selecteer docent"
                    />
                  </div>
                  <div className="w-56 ml-auto space-y-2">
                    <Label htmlFor="week_start">Weekstart</Label>
                    <DatePicker
                      id="week_start"
                      value={timeRegForm.week_start}
                      onChange={(date) =>
                        setTimeRegForm((prev) => ({
                          ...prev,
                          week_start: date
                            ? date.toISOString().split('T')[0]
                            : '',
                        }))
                      }
                      buttonClassName="h-10"
                    />
                  </div>
                </div>

                {/* Main section: Vertical day rows with separators */}
                <div className="rounded-md border divide-y">
                  {[
                    { key: 'monday', label: 'Maandag' },
                    { key: 'tuesday', label: 'Dinsdag' },
                    { key: 'wednesday', label: 'Woensdag' },
                    { key: 'thursday', label: 'Donderdag' },
                    { key: 'friday', label: 'Vrijdag' },
                    { key: 'saturday', label: 'Zaterdag' },
                    { key: 'sunday', label: 'Zondag' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <Label htmlFor={key} className="w-28 font-medium">
                        {label}
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        step="0.5"
                        min={key === 'monday' ? '1' : '0'}
                        max="24"
                        value={timeRegForm[key]}
                        onChange={(e) =>
                          setTimeRegForm((prev) => ({
                            ...prev,
                            [key]:
                              e.target.value === ''
                                ? ''
                                : parseFloat(e.target.value),
                          }))
                        }
                        className="h-10 w-24 text-right"
                      />
                    </div>
                  ))}
                </div>

                {/* Footer section: Total (right-aligned) */}
                <div className="pt-2 text-right font-semibold">
                  Totaal Uren: {getTotalHours()} uur
                </div>

                {/* Footer buttons: bottom-right */}
                <DialogFooter className="justify-end">
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
