import financeAPI from '@/apis/financeAPI';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Plus, Trash2, CircleDollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function FinancePage() {
  const [types, setTypes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [openLogDialog, setOpenLogDialog] = useState(false);

  const typeForm = useForm({
    defaultValues: { name: '', description: '' },
    mode: 'onSubmit',
  });

  const logForm = useForm({
    defaultValues: {
      type_id: '',
      student_id: '',
      course_id: '',
      amount: '',
      method: 'iDEAL',
      notes: '',
      transaction_type: 'income',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [t, l] = await Promise.all([
          financeAPI.get_financial_types(),
          financeAPI.get_financial_logs(),
        ]);
        setTypes(t || []);
        setLogs(l || []);
      } catch (e) {
        console.error('Failed to load finance data', e);
        toast.error('Kon financiën niet laden.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddType = async (values) => {
    try {
      const created = await financeAPI.create_financial_type(values);
      setTypes((prev) => [...prev, created.type]);
      setOpenTypeDialog(false);
      typeForm.reset();
      toast.success(`Type "${created.type.name}" aangemaakt`);
    } catch (e) {
      console.error('Create type failed', e);
      toast.error('Aanmaken financieel type mislukt');
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await financeAPI.delete_financial_type(id);
      setTypes((prev) => prev.filter((t) => t.id !== id));
      toast.success('Type verwijderd');
    } catch (e) {
      console.error('Delete type failed', e);
      toast.error('Verwijderen type mislukt (mogelijk gekoppelde logs)');
    }
  };

  const handleAddLog = async (values) => {
    const payload = {
      type_id: Number(values.type_id),
      student_id: values.student_id ? Number(values.student_id) : null,
      course_id: values.course_id ? Number(values.course_id) : null,
      amount: Number(values.amount),
      method: values.method,
      notes: values.notes,
      transaction_type: values.transaction_type,
    };
    try {
      const created = await financeAPI.create_financial_log(payload);
      // API returns { message, log }
      setLogs((prev) => [
        {
          id: created.log.id,
          type: created.log.type?.name ?? '',
          student: created.log.student
            ? `${created.log.student.first_name} ${created.log.student.last_name}`
            : null,
          course: created.log.course ? created.log.course.name : null,
          amount: created.log.amount,
          method: created.log.method,
          notes: created.log.notes,
          date: created.log.date,
          transaction_type: created.log.transaction_type,
        },
        ...prev,
      ]);
      setOpenLogDialog(false);
      logForm.reset({ method: 'iDEAL', transaction_type: 'income' });
      toast.success('Transactie toegevoegd');
    } catch (e) {
      console.error('Create log failed', e);
      toast.error('Aanmaken transactie mislukt');
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await financeAPI.delete_financial_log(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success('Transactie verwijderd');
    } catch (e) {
      console.error('Delete log failed', e);
      toast.error('Verwijderen transactie mislukt');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financiën"
        icon={<CircleDollarSign className="size-9" />}
        description="Beheer financiële types en transacties."
      >
        <div className="flex gap-2">
          <Button onClick={() => setOpenTypeDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nieuw Type
          </Button>
          <Button variant="outline" onClick={() => setOpenLogDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nieuwe Transactie
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Types</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Omschrijving</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteType(t.id)}
                      title="Verwijderen"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {types.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Geen types gevonden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Transacties</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Leerling</TableHead>
                <TableHead>Lespakket</TableHead>
                <TableHead>Bedrag</TableHead>
                <TableHead>Methode</TableHead>
                <TableHead>Opmerking</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {l.transaction_type === 'income' ? 'Inkomen' : 'Uitgave'}
                  </TableCell>
                  <TableCell>{l.student || '-'}</TableCell>
                  <TableCell>{l.course || '-'}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('nl-NL', {
                      style: 'currency',
                      currency: 'EUR',
                    }).format(l.amount)}
                  </TableCell>
                  <TableCell>{l.method}</TableCell>
                  <TableCell>{l.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLog(l.id)}
                      title="Verwijderen"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    Geen transacties gevonden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create Type Dialog */}
      <Dialog open={openTypeDialog} onOpenChange={setOpenTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuw Financieel Type</DialogTitle>
          </DialogHeader>
          <Form {...typeForm}>
            <form
              onSubmit={typeForm.handleSubmit(handleAddType)}
              className="space-y-4"
            >
              <FormField
                control={typeForm.control}
                name="name"
                rules={{ required: 'Naam is verplicht' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Bijv. Lesgeld" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={typeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Omschrijving</FormLabel>
                    <FormControl>
                      <Input placeholder="Korte omschrijving" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Log Dialog */}
      <Dialog open={openLogDialog} onOpenChange={setOpenLogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Transactie</DialogTitle>
          </DialogHeader>
          <Form {...logForm}>
            <form
              onSubmit={logForm.handleSubmit(handleAddLog)}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={logForm.control}
                  name="type_id"
                  rules={{ required: 'Type is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kies type" />
                        </SelectTrigger>
                        <SelectContent>
                          {types.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="amount"
                  rules={{ required: 'Bedrag is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrag (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={logForm.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Methode</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijv. iDEAL / Contant" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={logForm.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transactie</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Inkomen</SelectItem>
                          <SelectItem value="expense">Uitgave</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={logForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opmerking</FormLabel>
                    <FormControl>
                      <Input placeholder="Optioneel" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
