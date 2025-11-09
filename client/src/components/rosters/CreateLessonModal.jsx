import rosterAPI from '@/apis/rosterAPI';
import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TimePicker from '@/components/ui/time-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const dayItems = [
  { value: 'Monday', label: 'Maandag' },
  { value: 'Tuesday', label: 'Dinsdag' },
  { value: 'Wednesday', label: 'Woensdag' },
  { value: 'Thursday', label: 'Donderdag' },
  { value: 'Friday', label: 'Vrijdag' },
  { value: 'Saturday', label: 'Zaterdag' },
  { value: 'Sunday', label: 'Zondag' },
];

const formSchema = z
  .object({
    day_of_week: z.string().min(1, 'Dag is verplicht'),
    class_id: z.string().min(1, 'Klas is verplicht'),
    subject_id: z.string().min(1, 'Vak is verplicht'),
    teacher_id: z.string().min(1, 'Docent is verplicht'),
    classroom_id: z.string().min(1, 'Lokaal is verplicht'),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: 'Ongeldig tijdformaat. Gebruik HH:mm',
    }),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: 'Ongeldig tijdformaat. Gebruik HH:mm',
    }),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: 'Eindtijd moet na starttijd zijn',
    path: ['end_time'],
  });

export default function CreateLessonModal({
  open,
  onOpenChange,
  classes,
  subjects,
  teachers,
  classrooms,
  onSave,
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      day_of_week: '',
      class_id: '',
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      start_time: '',
      end_time: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      day_of_week: '',
      class_id: '',
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      start_time: '',
      end_time: '',
    });
  }, [open, form]);

  const handleSubmit = async (values) => {
    try {
      const payload = {
        day_of_week: values.day_of_week,
        class_id: parseInt(values.class_id),
        subject_id: parseInt(values.subject_id),
        teacher_id: parseInt(values.teacher_id),
        classroom_id: parseInt(values.classroom_id),
        start_time: values.start_time,
        end_time: values.end_time,
      };

      await rosterAPI.add_roster(payload);
      toast.success('Les succesvol ingepland (wekelijks terugkerend)');
      onSave();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Opslaan mislukt');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,550px)] sm:max-w-[720px] p-6">
        <DialogHeader className="gap-1 pr-10">
          <DialogTitle className="text-xl">Les Inplannen</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="pt-1 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <ComboboxField
                    label="Dag"
                    value={field.value}
                    onChange={field.onChange}
                    items={dayItems}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="subject_id"
                render={({ field }) => (
                  <ComboboxField
                    label="Vak"
                    value={field.value}
                    onChange={field.onChange}
                    items={(subjects ?? [])
                      .filter((s) => s?.id != null)
                      .map((s) => ({ value: String(s.id), label: s.name }))}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <ComboboxField
                    label="Klas"
                    value={field.value}
                    onChange={field.onChange}
                    items={(classes ?? [])
                      .filter((c) => c?.id != null)
                      .map((c) => ({ value: String(c.id), label: c.name }))}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="teacher_id"
                render={({ field }) => (
                  <ComboboxField
                    label="Docent"
                    value={field.value}
                    onChange={field.onChange}
                    items={(teachers ?? [])
                      .filter((t) => t?.id != null)
                      .map((t) => ({
                        value: String(t.id),
                        label: `${t.first_name} ${t.last_name}`,
                      }))}
                  />
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classroom_id"
                render={({ field }) => (
                  <ComboboxField
                    label="Lokaal"
                    value={field.value}
                    onChange={field.onChange}
                    items={(classrooms ?? [])
                      .filter((r) => r?.id != null)
                      .map((r) => ({ value: String(r.id), label: r.name }))}
                  />
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem className="w-full ">
                      <FormLabel>Starttijd</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} step={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Eindtijd</FormLabel>
                      <FormControl>
                        <TimePicker value={field.value} onChange={field.onChange} step={10} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mt-6 w-full justify-end">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={!form.formState.isValid || form.formState.isSubmitting}
                >
                  Inplannen
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


