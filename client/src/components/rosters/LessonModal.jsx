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
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z
  .object({
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

const LessonModal = ({
  open,
  onOpenChange,
  selectedEvent,
  selectedSlot,
  classes,
  subjects,
  teachers,
  classrooms,
  onSave,
}) => {
  const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
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
    if (selectedEvent) {
      const r = selectedEvent.resource;
      form.reset({
        class_id: r.classId?.toString() || '',
        subject_id: r.subjectId?.toString() || '',
        teacher_id: r.teacherId?.toString() || '',
        classroom_id: r.classroomId?.toString() || '',
        start_time: format(selectedEvent.start, 'HH:mm'),
        end_time: format(selectedEvent.end, 'HH:mm'),
      });
    } else if (selectedSlot) {
      form.reset({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        classroom_id: '',
        start_time: format(selectedSlot.start, 'HH:mm'),
        end_time: format(selectedSlot.end, 'HH:mm'),
      });
    }
  }, [open, selectedEvent, selectedSlot, form]);

  const handleSubmit = async (values) => {
    try {
      const data = {
        class_id: parseInt(values.class_id),
        subject_id: parseInt(values.subject_id),
        teacher_id: parseInt(values.teacher_id),
        classroom_id: parseInt(values.classroom_id),
      };

      if (selectedEvent) {
        await rosterAPI.update_roster({
          ...data,
          id: selectedEvent.id,
          day_of_week: capitalizeFirst(
            format(selectedEvent.start, 'EEEE', { locale: nl })
          ),
          start_time: values.start_time,
          end_time: values.end_time,
        });
        toast.success('Les succesvol bijgewerkt');
      } else if (selectedSlot) {
        await rosterAPI.add_roster({
          ...data,
          day_of_week: capitalizeFirst(
            format(selectedSlot.start, 'EEEE', { locale: nl })
          ),
          start_time: values.start_time,
          end_time: values.end_time,
        });
        toast.success('Les succesvol toegevoegd (wekelijks terugkerend)');
      }

      onSave();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Opslaan mislukt');
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      setIsDeleting(true);
      await rosterAPI.delete_roster(selectedEvent.id);
      toast.success('Les succesvol verwijderd');
      onSave();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Verwijderen mislukt');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTimeDisplay = () => {
    if (selectedEvent) {
      return `${format(selectedEvent.start, 'HH:mm')} - ${format(
        selectedEvent.end,
        'HH:mm'
      )}`;
    }
    if (selectedSlot) {
      return `${format(selectedSlot.start, 'HH:mm')} - ${format(
        selectedSlot.end,
        'HH:mm'
      )}`;
    }
    return '';
  };

  const getDateDisplay = () => {
    const date = selectedEvent?.start || selectedSlot?.start;
    return date
      ? capitalizeFirst(format(date, 'EEEE d MMMM yyyy', { locale: nl }))
      : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* wider modal + full width */}
      <DialogContent className="w-[min(92vw,550px)] sm:max-w-[720px] p-6">
        <DialogHeader className="gap-1 pr-10">
          <DialogTitle className="text-xl">
            {selectedEvent ? 'Les Bewerken' : 'Nieuwe Les'}
          </DialogTitle>
          <p className="text-base text-muted-foreground">
            {getDateDisplay()} · {getTimeDisplay()}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="pt-1 space-y-5"
          >
            {/* Tijd */}
            <div className="space-y-2">
              {/* <h3 className="text-sm font-medium text-muted-foreground">Tijd</h3> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem className="w-full ">
                      <FormLabel>Starttijd</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          step={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Eindtijd */}
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Eindtijd</FormLabel>
                      <FormControl>
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          step={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Lesdetails */}
            <div className="space-y-1.5">
              <h3 className="text-base font-medium text-foreground mb-2.5">
                Lesdetails
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vak */}
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
                        .map((s) => ({
                          value: String(s.id),
                          label: s.name,
                        }))}
                    />
                  )}
                />

                {/* Klas */}
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
                        .map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        }))}
                    />
                  )}
                />

                {/* Docent */}
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

                {/* Lokaal */}
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
                        .map((r) => ({
                          value: String(r.id),
                          label: r.name,
                        }))}
                    />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="mt-6 w-full justify-between">
              <div className="flex-1">
                {selectedEvent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    Verwijderen
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !form.formState.isValid || form.formState.isSubmitting
                  }
                >
                  {selectedEvent ? 'Bijwerken' : 'Toevoegen'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonModal;
