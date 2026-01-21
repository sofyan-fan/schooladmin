import teacherPaymentAPI from '@/apis/teacherPaymentAPI';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, BanknoteIcon, Check, CreditCard, Eye, History, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function TeacherPaymentTab({ onPaymentComplete }) {
  const { user } = useAuth();
  const [unpaidTeachers, setUnpaidTeachers] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedRegistrations, setSelectedRegistrations] = useState(new Map());
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('unpaid');
  const [openPaymentConfirmDialog, setOpenPaymentConfirmDialog] = useState(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState(null);
  const [openPaymentDetailDialog, setOpenPaymentDetailDialog] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [openCompensationDialog, setOpenCompensationDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newCompensation, setNewCompensation] = useState('');

  const eurFormatter = useMemo(
    () => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }),
    []
  );

  const formatDateNl = (value) => {
    try {
      return new Date(value).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(value ?? '');
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [unpaidRes, historyRes] = await Promise.all([
        teacherPaymentAPI.getApprovedUnpaidRegistrations(),
        teacherPaymentAPI.getPaymentHistory(),
      ]);
      setUnpaidTeachers(unpaidRes.data || []);
      setPaymentHistory(historyRes.data || []);
    } catch (e) {
      console.error('Failed to load teacher payment data', e);
      toast.error('Kon docentenbetalingen niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summaryTotals = useMemo(() => {
    let totalHours = 0;
    let totalCompensation = 0;
    for (const teacher of unpaidTeachers) {
      totalHours += teacher.total_hours;
      totalCompensation += teacher.total_compensation;
    }
    return { totalHours, totalCompensation };
  }, [unpaidTeachers]);

  const toggleRegistration = (teacherId, registrationId) => {
    setSelectedRegistrations((prev) => {
      const newMap = new Map(prev);
      const teacherSet = newMap.get(teacherId) || new Set();
      if (teacherSet.has(registrationId)) {
        teacherSet.delete(registrationId);
      } else {
        teacherSet.add(registrationId);
      }
      if (teacherSet.size === 0) {
        newMap.delete(teacherId);
      } else {
        newMap.set(teacherId, new Set(teacherSet));
      }
      return newMap;
    });
  };

  const selectAllForTeacher = (teacherId, registrations) => {
    setSelectedRegistrations((prev) => {
      const newMap = new Map(prev);
      const allIds = registrations.map((r) => r.id);
      const currentSet = newMap.get(teacherId) || new Set();
      const allSelected = allIds.every((id) => currentSet.has(id));
      if (allSelected) {
        newMap.delete(teacherId);
      } else {
        newMap.set(teacherId, new Set(allIds));
      }
      return newMap;
    });
  };

  const isAllSelectedForTeacher = (teacherId, registrations) => {
    const selected = selectedRegistrations.get(teacherId);
    if (!selected) return false;
    return registrations.every((r) => selected.has(r.id));
  };

  const getSelectedTotals = (teacherData) => {
    const selected = selectedRegistrations.get(teacherData.teacher.id);
    if (!selected || selected.size === 0) return { hours: 0, compensation: 0 };
    let hours = 0;
    for (const reg of teacherData.registrations) {
      if (selected.has(reg.id)) {
        hours += reg.total_hours;
      }
    }
    return { hours, compensation: hours * teacherData.teacher.compensation };
  };

  const preparePayment = (teacherData) => {
    const selected = selectedRegistrations.get(teacherData.teacher.id);
    if (!selected || selected.size === 0) {
      toast.error('Selecteer eerst registraties om uit te betalen');
      return;
    }
    const selectedRegs = teacherData.registrations.filter((r) => selected.has(r.id));
    const totalHours = selectedRegs.reduce((sum, r) => sum + r.total_hours, 0);
    const totalAmount = totalHours * teacherData.teacher.compensation;
    setPaymentToConfirm({
      teacher: teacherData.teacher,
      registrations: selectedRegs,
      registration_ids: Array.from(selected),
      totalHours,
      totalAmount,
    });
    setOpenPaymentConfirmDialog(true);
  };

  const prepareSinglePayment = (teacherData, registration) => {
    if (!teacherData.teacher.compensation || teacherData.teacher.compensation <= 0) {
      toast.error('Stel eerst een uurtarief in voor deze docent');
      return;
    }
    const totalAmount = registration.total_hours * teacherData.teacher.compensation;
    setPaymentToConfirm({
      teacher: teacherData.teacher,
      registrations: [registration],
      registration_ids: [registration.id],
      totalHours: registration.total_hours,
      totalAmount,
    });
    setOpenPaymentConfirmDialog(true);
  };

  const confirmPayment = async () => {
    if (!paymentToConfirm) return;
    setProcessingPayment(true);
    try {
      await teacherPaymentAPI.processPayment({
        teacher_id: paymentToConfirm.teacher.id,
        registration_ids: paymentToConfirm.registration_ids,
        confirmed_by: user.id,
        payment_method: 'Bankoverschrijving',
      });
      toast.success(
        `Betaling van ${eurFormatter.format(paymentToConfirm.totalAmount)} verwerkt`
      );
      setSelectedRegistrations((prev) => {
        const newMap = new Map(prev);
        newMap.delete(paymentToConfirm.teacher.id);
        return newMap;
      });
      setOpenPaymentConfirmDialog(false);
      setPaymentToConfirm(null);
      fetchData();
      if (onPaymentComplete) onPaymentComplete();
    } catch (e) {
      console.error('Payment processing failed', e);
      toast.error(e.response?.data?.message || 'Betaling verwerken mislukt');
    } finally {
      setProcessingPayment(false);
    }
  };

  const viewPaymentDetails = async (paymentId) => {
    try {
      const res = await teacherPaymentAPI.getPaymentById(paymentId);
      setViewPayment(res.data);
      setOpenPaymentDetailDialog(true);
    } catch (e) {
      toast.error('Kon betalingsdetails niet laden');
    }
  };

  const openEditCompensation = (teacher) => {
    setEditingTeacher(teacher);
    setNewCompensation(String(teacher.compensation || ''));
    setOpenCompensationDialog(true);
  };

  const saveCompensation = async () => {
    if (!editingTeacher) return;
    try {
      await teacherPaymentAPI.updateTeacherCompensation(editingTeacher.id, parseFloat(newCompensation));
      toast.success('Uurtarief bijgewerkt');
      setOpenCompensationDialog(false);
      setEditingTeacher(null);
      fetchData();
    } catch (e) {
      toast.error('Bijwerken uurtarief mislukt');
    }
  };

  if (loading && unpaidTeachers.length === 0 && paymentHistory.length === 0) {
    return <div className="flex items-center justify-center py-12"><div className="text-muted-foreground">Laden...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaande uren</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryTotals.totalHours} uur</div>
            <p className="text-xs text-muted-foreground">Van {unpaidTeachers.length} docent{unpaidTeachers.length !== 1 ? 'en' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaande vergoeding</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{eurFormatter.format(summaryTotals.totalCompensation)}</div>
            <p className="text-xs text-muted-foreground">Nog uit te betalen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betalingen dit jaar</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentHistory.length}</div>
            <p className="text-xs text-muted-foreground">Totaal verwerkt</p>
          </CardContent>
        </Card>
      </div> */}

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="unpaid" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md hover:cursor-pointer"><BanknoteIcon className="h-4 w-4" />Openstaand</TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md hover:cursor-pointer"><History className="h-4 w-4" />Betalingsgeschiedenis</TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid" className="mt-4">
          {unpaidTeachers.length === 0 ? (
            <Card className="p-8 text-center">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Geen openstaande betalingen</h3>
              <p className="text-muted-foreground mt-1">Alle goedgekeurde uren zijn uitbetaald.</p>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {unpaidTeachers.map((teacherData) => {
                const selectedTotals = getSelectedTotals(teacherData);
                const hasSelection = selectedTotals.hours > 0;
                return (
                  <AccordionItem key={teacherData.teacher.id} value={String(teacherData.teacher.id)} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <div className="font-medium">{teacherData.teacher.first_name} {teacherData.teacher.last_name}</div>
                            <div className="text-sm text-muted-foreground">Uurtarief: {eurFormatter.format(teacherData.teacher.compensation || 0)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{teacherData.total_hours} uur</Badge>
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700">{eurFormatter.format(teacherData.total_compensation)}</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox id={`select-all-${teacherData.teacher.id}`} checked={isAllSelectedForTeacher(teacherData.teacher.id, teacherData.registrations)} onCheckedChange={() => selectAllForTeacher(teacherData.teacher.id, teacherData.registrations)} />
                            <Label htmlFor={`select-all-${teacherData.teacher.id}`} className="text-sm">Alles selecteren ({teacherData.registrations.length} weken)</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditCompensation(teacherData.teacher)}>Uurtarief aanpassen</Button>
                            <Button size="sm" disabled={!hasSelection} onClick={() => preparePayment(teacherData)}>Uitbetalen ({eurFormatter.format(selectedTotals.compensation)})</Button>
                          </div>
                        </div>
                        {(!teacherData.teacher.compensation || teacherData.teacher.compensation <= 0) && (
                          <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 text-amber-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Stel eerst een uurtarief in voor deze docent om te kunnen uitbetalen.</span>
                          </div>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Week</TableHead>
                              <TableHead>Ma</TableHead>
                              <TableHead>Di</TableHead>
                              <TableHead>Wo</TableHead>
                              <TableHead>Do</TableHead>
                              <TableHead>Vr</TableHead>
                              <TableHead>Za</TableHead>
                              <TableHead>Zo</TableHead>
                              <TableHead>Totaal</TableHead>
                              <TableHead>Goedgekeurd</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teacherData.registrations.map((reg) => {
                              const isSelected = selectedRegistrations.get(teacherData.teacher.id)?.has(reg.id) || false;
                              const singleAmount = reg.total_hours * (teacherData.teacher.compensation || 0);
                              return (
                                <TableRow key={reg.id}>
                                  <TableCell><Checkbox checked={isSelected} onCheckedChange={() => toggleRegistration(teacherData.teacher.id, reg.id)} /></TableCell>
                                  <TableCell>{formatDateNl(reg.week_start)} - {formatDateNl(reg.week_end)}</TableCell>
                                  <TableCell>{reg.monday || '-'}</TableCell>
                                  <TableCell>{reg.tuesday || '-'}</TableCell>
                                  <TableCell>{reg.wednesday || '-'}</TableCell>
                                  <TableCell>{reg.thursday || '-'}</TableCell>
                                  <TableCell>{reg.friday || '-'}</TableCell>
                                  <TableCell>{reg.saturday || '-'}</TableCell>
                                  <TableCell>{reg.sunday || '-'}</TableCell>
                                  <TableCell className="font-medium">{reg.total_hours} uur</TableCell>
                                  <TableCell><Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />{formatDateNl(reg.approved_at)}</Badge></TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => prepareSinglePayment(teacherData, reg)}
                                      disabled={!teacherData.teacher.compensation || teacherData.teacher.compensation <= 0}
                                      title={`Betaal ${eurFormatter.format(singleAmount)}`}
                                    >
                                      <CreditCard className="w-4 h-4 mr-1" />
                                      Betaal
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {paymentHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Geen betalingsgeschiedenis</h3>
              <p className="text-muted-foreground mt-1">Er zijn nog geen betalingen verwerkt.</p>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Docent</TableHead>
                    <TableHead>Uren</TableHead>
                    <TableHead>Uurtarief</TableHead>
                    <TableHead>Totaal</TableHead>
                    <TableHead>Weken</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDateNl(payment.paid_at)}</TableCell>
                      <TableCell className="font-medium">{payment.teacher.first_name} {payment.teacher.last_name}</TableCell>
                      <TableCell>{payment.total_hours} uur</TableCell>
                      <TableCell>{eurFormatter.format(payment.hourly_rate)}</TableCell>
                      <TableCell className="font-medium text-rose-600">{eurFormatter.format(payment.total_amount)}</TableCell>
                      <TableCell><Badge variant="outline">{payment.time_registrations?.length || 0} weken</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => viewPaymentDetails(payment.id)}><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openPaymentConfirmDialog} onOpenChange={setOpenPaymentConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Betaling bevestigen</DialogTitle>
            <DialogDescription>Bevestig de uitbetaling voor {paymentToConfirm?.teacher.first_name} {paymentToConfirm?.teacher.last_name}.</DialogDescription>
          </DialogHeader>
          {paymentToConfirm && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Docent</span><span className="font-medium">{paymentToConfirm.teacher.first_name} {paymentToConfirm.teacher.last_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Totaal uren</span><span className="font-medium">{paymentToConfirm.totalHours} uur</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Uurtarief</span><span className="font-medium">{eurFormatter.format(paymentToConfirm.teacher.compensation)}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="font-medium">Totaal uit te betalen</span><span className="font-bold text-lg text-rose-600">{eurFormatter.format(paymentToConfirm.totalAmount)}</span></div>
              </div>
              {/* <div className="text-sm text-muted-foreground">
                <p>Na bevestiging gebeurt het volgende:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>De geselecteerde weken worden gemarkeerd als uitbetaald</li>
                  <li>De betaling wordt toegevoegd aan de uitgaven in het financieel overzicht</li>
                  <li>De registraties kunnen niet meer worden gewijzigd</li>
                </ul>
              </div> */}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPaymentConfirmDialog(false)} disabled={processingPayment}>Annuleren</Button>
            <Button onClick={confirmPayment} disabled={processingPayment}>{processingPayment ? 'Verwerken...' : 'Bevestigen'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openPaymentDetailDialog} onOpenChange={setOpenPaymentDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Betalingsdetails</DialogTitle></DialogHeader>
          {viewPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-sm text-muted-foreground">Docent</div><div className="font-medium">{viewPayment.teacher.first_name} {viewPayment.teacher.last_name}</div></div>
                <div><div className="text-sm text-muted-foreground">Betaaldatum</div><div className="font-medium">{formatDateNl(viewPayment.paid_at)}</div></div>
                <div><div className="text-sm text-muted-foreground">Totaal uren</div><div className="font-medium">{viewPayment.total_hours} uur</div></div>
                <div><div className="text-sm text-muted-foreground">Uurtarief</div><div className="font-medium">{eurFormatter.format(viewPayment.hourly_rate)}</div></div>
                <div className="col-span-2"><div className="text-sm text-muted-foreground">Totaal uitbetaald</div><div className="font-bold text-xl text-rose-600">{eurFormatter.format(viewPayment.total_amount)}</div></div>
              </div>
              {viewPayment.notes && <div><div className="text-sm text-muted-foreground">Opmerking</div><div className="mt-1">{viewPayment.notes}</div></div>}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Opgenomen weken</div>
                <Table>
                  <TableHeader><TableRow><TableHead>Week</TableHead><TableHead>Uren</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {viewPayment.time_registrations?.map((reg) => (
                      <TableRow key={reg.id}><TableCell>{formatDateNl(reg.week_start)} - {formatDateNl(reg.week_end)}</TableCell><TableCell>{reg.total_hours} uur</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openCompensationDialog} onOpenChange={setOpenCompensationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uurtarief aanpassen</DialogTitle>
            <DialogDescription>Pas het uurtarief aan voor {editingTeacher?.first_name} {editingTeacher?.last_name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="compensation">Uurtarief (€)</Label><Input id="compensation" type="number" step="0.01" min="0" value={newCompensation} onChange={(e) => setNewCompensation(e.target.value)} placeholder="0.00" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCompensationDialog(false)}>Annuleren</Button>
            <Button onClick={saveCompensation}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
