import { get_teachers } from '@/apis/teachersAPI';
import { timeRegisterAPI } from '@/apis/timeregisterAPI';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

import { useAuth } from '@/hooks/useAuth';
import { Archive, Banknote, Calendar, Check, Clock, Edit, Eye, LayoutGrid, List, Lock, User, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const TimeRegisterPage = () => {
  const { user } = useAuth();
  const [timeRegistrations, setTimeRegistrations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filter registrations into active (unpaid) and archived (paid)
  const activeRegistrations = useMemo(
    () => timeRegistrations.filter((r) => !r.paid),
    [timeRegistrations]
  );
  const archivedRegistrations = useMemo(
    () => timeRegistrations.filter((r) => r.paid),
    [timeRegistrations]
  );

  // Get current registrations based on active tab
  const currentRegistrations = activeTab === 'active' ? activeRegistrations : archivedRegistrations;

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

  // Detail view state
  const [viewDetailReg, setViewDetailReg] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

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

    // Validate teacher selection
    if (!timeRegForm.teacher_id) {
      toast.error('Selecteer een docent');
      return;
    }

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

      const teacherId = parseInt(timeRegForm.teacher_id, 10);
      if (isNaN(teacherId)) {
        toast.error('Ongeldige docent geselecteerd');
        setLoading(false);
        return;
      }

      const data = {
        teacher_id: teacherId,
        week_start: start.toISOString(),
        week_end: end.toISOString(),
        ...numericDays,
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

  const handleToggleApproval = async (registration) => {
    if (user?.role !== 'admin') return;

    if (registration.paid) {
      toast.error('Uitbetaalde registraties kunnen niet worden gewijzigd');
      return;
    }

    setLoading(true);
    try {
      if (registration.approved) {
        await timeRegisterAPI.unapproveTimeRegistration(registration.id);
        toast.success('Tijd registratie teruggezet naar in afwachting');
      } else {
        await timeRegisterAPI.approveTimeRegistration(registration.id, user.id);
        toast.success('Tijd registratie succesvol goedgekeurd');
      }
      fetchData();
    } catch {
      toast.error('Wijzigen van goedkeuringsstatus mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (user?.role !== 'admin' || selectedIds.size === 0) return;

    const toApprove = activeRegistrations.filter(
      (r) => selectedIds.has(r.id) && !r.approved && !r.paid
    );

    if (toApprove.length === 0) {
      toast.info('Geen registraties om goed te keuren');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        toApprove.map((r) => timeRegisterAPI.approveTimeRegistration(r.id, user.id))
      );
      toast.success(`${toApprove.length} registratie(s) goedgekeurd`);
      setSelectedIds(new Set());
      fetchData();
    } catch {
      toast.error('Bulk goedkeuren mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUnapprove = async () => {
    if (user?.role !== 'admin' || selectedIds.size === 0) return;

    const toUnapprove = activeRegistrations.filter(
      (r) => selectedIds.has(r.id) && r.approved && !r.paid
    );

    if (toUnapprove.length === 0) {
      toast.info('Geen registraties om af te keuren');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        toUnapprove.map((r) => timeRegisterAPI.unapproveTimeRegistration(r.id))
      );
      toast.success(`${toUnapprove.length} registratie(s) afgekeurd`);
      setSelectedIds(new Set());
      fetchData();
    } catch {
      toast.error('Bulk afkeuren mislukt');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentRegistrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentRegistrations.map((r) => r.id)));
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
    if (registration.paid) {
      toast.error('Uitbetaalde registraties kunnen niet worden bewerkt');
      return;
    }

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

  const viewRegistrationDetails = (registration) => {
    setViewDetailReg(registration);
    setIsDetailModalOpen(true);
  };

  const getTotalHours = () => {
    return Object.values(timeRegForm)
      .filter((value, index) => index > 2 && index < 10)
      .reduce((sum, hours) => sum + parseFloat(hours || 0), 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatDateFull = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Onbekend';
  };

  const getStatusBadge = (registration) => {
    if (registration.paid) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Banknote className="w-3 h-3 mr-1" />
          Uitbetaald
        </Badge>
      );
    }
    if (registration.approved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Goedgekeurd
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        In afwachting
      </Badge>
    );
  };

  const dayLabels = [
    { key: 'monday', label: 'Ma', fullLabel: 'Maandag' },
    { key: 'tuesday', label: 'Di', fullLabel: 'Dinsdag' },
    { key: 'wednesday', label: 'Wo', fullLabel: 'Woensdag' },
    { key: 'thursday', label: 'Do', fullLabel: 'Donderdag' },
    { key: 'friday', label: 'Vr', fullLabel: 'Vrijdag' },
    { key: 'saturday', label: 'Za', fullLabel: 'Zaterdag' },
    { key: 'sunday', label: 'Zo', fullLabel: 'Zondag' },
  ];

  // Count selected items that can be approved/unapproved
  const selectedPendingCount = activeRegistrations.filter(
    (r) => selectedIds.has(r.id) && !r.approved && !r.paid
  ).length;
  const selectedApprovedCount = activeRegistrations.filter(
    (r) => selectedIds.has(r.id) && r.approved && !r.paid
  ).length;

  const renderCardView = (registrations, emptyMessage) => {
    if (registrations.length === 0) {
      return (
        <Card className="col-span-full p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Geen registraties</h3>
          <p className="text-muted-foreground mt-1">{emptyMessage}</p>
        </Card>
      );
    }

    return registrations.map((registration) => (
      <Card key={registration.id} className={`overflow-hidden ${selectedIds.has(registration.id) ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {activeTab === 'active' && (
                <Checkbox
                  checked={selectedIds.has(registration.id)}
                  onCheckedChange={() => toggleSelection(registration.id)}
                />
              )}
              <div className="space-y-1">
                <h3 className="font-semibold leading-none">
                  {getTeacherName(registration.teacher_id)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(registration.week_start)} - {formatDate(registration.week_end)}
                </p>
              </div>
            </div>
            {getStatusBadge(registration)}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Hours summary - compact view */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold">{registration.total_hours}</span>
            <span className="text-muted-foreground">uur totaal</span>
          </div>

          {/* Compact day breakdown */}
          <div className="flex gap-1 mb-4">
            {dayLabels.map(({ key, label }) => (
              <div
                key={key}
                className={`flex-1 text-center py-1.5 rounded text-xs ${registration[key] > 0
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'bg-muted text-muted-foreground'
                  }`}
                title={`${label}: ${registration[key] || 0} uur`}
              >
                <div className="font-medium">{label}</div>
                <div>{registration[key] || '-'}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => viewRegistrationDetails(registration)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>

            {registration.paid ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Uitbetaalde registraties kunnen niet worden bewerkt"
              >
                <Lock className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => editTimeRegistration(registration)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}

            {user?.role === 'admin' && !registration.paid && (
              <Button
                variant={registration.approved ? 'outline' : 'outline'}
                size="sm"
                onClick={() => handleToggleApproval(registration)}
                title={registration.approved ? 'Goedkeuring intrekken' : 'Goedkeuren'}
              >
                {registration.approved ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderTableView = (registrations, emptyMessage) => {
    if (registrations.length === 0) {
      return (
        <Card className="p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Geen registraties</h3>
          <p className="text-muted-foreground mt-1">{emptyMessage}</p>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {activeTab === 'active' && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === registrations.length && registrations.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>Docent</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Ma</TableHead>
                <TableHead>Di</TableHead>
                <TableHead>Wo</TableHead>
                <TableHead>Do</TableHead>
                <TableHead>Vr</TableHead>
                <TableHead>Za</TableHead>
                <TableHead>Zo</TableHead>
                <TableHead>Totaal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id} className={selectedIds.has(registration.id) ? 'bg-primary/5' : ''}>
                  {activeTab === 'active' && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(registration.id)}
                        onCheckedChange={() => toggleSelection(registration.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {getTeacherName(registration.teacher_id)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(registration.week_start)} - {formatDate(registration.week_end)}
                  </TableCell>
                  <TableCell>{registration.monday || '-'}</TableCell>
                  <TableCell>{registration.tuesday || '-'}</TableCell>
                  <TableCell>{registration.wednesday || '-'}</TableCell>
                  <TableCell>{registration.thursday || '-'}</TableCell>
                  <TableCell>{registration.friday || '-'}</TableCell>
                  <TableCell>{registration.saturday || '-'}</TableCell>
                  <TableCell>{registration.sunday || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{registration.total_hours} uur</Badge>
                  </TableCell>
                  <TableCell>
                    {user?.role === 'admin' && !registration.paid ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-0"
                        onClick={() => handleToggleApproval(registration)}
                      >
                        {getStatusBadge(registration)}
                      </Button>
                    ) : (
                      getStatusBadge(registration)
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => viewRegistrationDetails(registration)}
                        title="Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {registration.paid ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          title="Uitbetaalde registraties kunnen niet worden bewerkt"
                        >
                          <Lock className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editTimeRegistration(registration)}
                          title="Bewerken"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {user?.role === 'admin' && !registration.paid && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleApproval(registration)}
                          title={registration.approved ? 'Goedkeuring intrekken' : 'Goedkeuren'}
                        >
                          {registration.approved ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
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
    );
  };

  return (
    <>
      <PageHeader
        title="Tijd Registraties"
        icon={<Clock className="size-9" />}
        description="Beheer tijd registraties voor docenten."
        buttonText="Nieuwe Registratie"
        onAdd={() => setIsTimeRegModalOpen(true)}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isTimeRegModalOpen} onOpenChange={setIsTimeRegModalOpen}>
        <DialogTrigger asChild><span /></DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTimeReg ? 'Tijd Registratie Bewerken' : 'Nieuwe Tijd Registratie'}
            </DialogTitle>
            <DialogDescription>
              Vul de uren in voor elke dag van de week.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTimeRegSubmit} className="space-y-4">
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
                    setTimeRegForm((prev) => ({ ...prev, teacher_id: value }))
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
                      week_start: date ? date.toISOString().split('T')[0] : '',
                    }))
                  }
                  buttonClassName="h-10"
                />
              </div>
            </div>

            <div className="rounded-md border divide-y">
              {dayLabels.map(({ key, fullLabel }) => (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <Label htmlFor={key} className="w-28 font-medium">
                    {fullLabel}
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
                        [key]: e.target.value === '' ? '' : parseFloat(e.target.value),
                      }))
                    }
                    className="h-10 w-24 text-right"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 text-right font-semibold">
              Totaal Uren: {getTotalHours()} uur
            </div>

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

      {/* Detail View Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registratie Details</DialogTitle>
          </DialogHeader>
          {viewDetailReg && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Docent</span>
                </div>
                <span className="font-medium">{getTeacherName(viewDetailReg.teacher_id)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Week</span>
                </div>
                <span className="font-medium">
                  {formatDateFull(viewDetailReg.week_start)} - {formatDateFull(viewDetailReg.week_end)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(viewDetailReg)}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Uren per dag</h4>
                <div className="space-y-2">
                  {dayLabels.map(({ key, fullLabel }) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground">{fullLabel}</span>
                      <span className={viewDetailReg[key] > 0 ? 'font-medium' : 'text-muted-foreground'}>
                        {viewDetailReg[key] || 0} uur
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t mt-3 pt-3">
                  <span className="font-medium">Totaal</span>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {viewDetailReg.total_hours} uur
                  </Badge>
                </div>
              </div>

              {viewDetailReg.paid && viewDetailReg.paid_at && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uitbetaald op</span>
                    <span>{formatDateFull(viewDetailReg.paid_at)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabs for Active and Archived */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md hover:cursor-pointer">
              <Clock className="h-4 w-4" />
              Actief
              {activeRegistrations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeRegistrations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md hover:cursor-pointer">
              <Archive className="h-4 w-4" />
              Archief
              {archivedRegistrations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {archivedRegistrations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            {/* Bulk actions for admin in active tab */}
            {user?.role === 'admin' && activeTab === 'active' && selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedIds.size} geselecteerd</span>
                {selectedPendingCount > 0 && (
                  <Button size="sm" onClick={handleBulkApprove} disabled={loading}>
                    <Check className="w-4 h-4 mr-1" />
                    Goedkeuren ({selectedPendingCount})
                  </Button>
                )}
                {selectedApprovedCount > 0 && (
                  <Button size="sm" variant="outline" onClick={handleBulkUnapprove} disabled={loading}>
                    <X className="w-4 h-4 mr-1" />
                    Afkeuren ({selectedApprovedCount})
                  </Button>
                )}
              </div>
            )}

            {/* View mode toggle */}
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
              <ToggleGroupItem value="card" aria-label="Kaartweergave" title="Kaartweergave">
                <LayoutGrid className="h-4 w-4 data-[state=on]:text-white hover:cursor-pointer" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Tabelweergave" title="Tabelweergave">
                <List className="h-4 w-4 data-[state=on]:text-white hover:cursor-pointer" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <TabsContent value="active" className="mt-0">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderCardView(
                activeRegistrations,
                'Er zijn geen openstaande tijd registraties.'
              )}
            </div>
          ) : (
            renderTableView(
              activeRegistrations,
              'Er zijn geen openstaande tijd registraties.'
            )
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderCardView(
                archivedRegistrations,
                'Er zijn nog geen uitbetaalde registraties.'
              )}
            </div>
          ) : (
            renderTableView(
              archivedRegistrations,
              'Er zijn nog geen uitbetaalde registraties.'
            )
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default TimeRegisterPage;
