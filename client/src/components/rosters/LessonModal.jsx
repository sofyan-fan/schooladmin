import rosterAPI from '@/apis/rosterAPI';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
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
    path: ['end_time'], // Set error on end_time field
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
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate on change to enable/disable submit button
    defaultValues: {
      class_id: '',
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      start_time: '',
      end_time: '',
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (selectedEvent) {
        // Editing existing event
        const resource = selectedEvent.resource;
        form.reset({
          class_id: resource.classId?.toString() || '',
          subject_id: resource.subjectId?.toString() || '',
          teacher_id: resource.teacherId?.toString() || '',
          classroom_id: resource.classroomId?.toString() || '',
          start_time: format(selectedEvent.start, 'HH:mm'),
          end_time: format(selectedEvent.end, 'HH:mm'),
        });
      } else if (selectedSlot) {
        // Creating new event
        form.reset({
          class_id: '',
          subject_id: '',
          teacher_id: '',
          classroom_id: '',
          start_time: format(selectedSlot.start, 'HH:mm'),
          end_time: format(selectedSlot.end, 'HH:mm'),
        });
      }
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
        // Update existing event
        const dayNum = selectedEvent.start.getDay();
        const days = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayOfWeek = days[dayNum];

        await rosterAPI.update_roster({
          ...data,
          id: selectedEvent.id,
          day_of_week: dayOfWeek,
          start_time: values.start_time,
          end_time: values.end_time,
        });
        toast.success('Les succesvol bijgewerkt');
      } else if (selectedSlot) {
        // Create new event - extract day and time for recurring weekly schedule
        const dayNum = selectedSlot.start.getDay();
        const days = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const dayOfWeek = days[dayNum];

        await rosterAPI.add_roster({
          ...data,
          day_of_week: dayOfWeek,
          start_time: values.start_time,
          end_time: values.end_time,
        });
        toast.success('Les succesvol toegevoegd (wekelijks terugkerend)');
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save lesson:', error);
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
    } catch (error) {
      console.error('Failed to delete lesson:', error);
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
    return date ? format(date, 'EEEE, d MMMM yyyy') : '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {selectedEvent ? 'Les Bewerken' : 'Nieuwe Les'}
          </DialogTitle>
          <DialogDescription>
            {selectedEvent
              ? 'Bewerk de details van de les.'
              : 'Vul de details in om een nieuwe les toe te voegen.'}
          </DialogDescription>
        </DialogHeader>

        <div className="border-t -mx-6 px-6 pt-4">
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="font-semibold text-foreground">
              {getDateDisplay()}
            </div>
            <div className="text-muted-foreground">{getTimeDisplay()}</div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 pt-2"
          >
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Tijd
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starttijd</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eindtijd</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Lesdetails
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vak</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects
                            .filter((subject) => subject.id != null)
                            .map((subject) => (
                              <SelectItem
                                key={subject.id}
                                value={subject.id.toString()}
                              >
                                {subject.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Klas</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes
                            .filter((cls) => cls.id != null)
                            .map((cls) => (
                              <SelectItem
                                key={cls.id}
                                value={cls.id.toString()}
                              >
                                {cls.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Docent</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers
                            .filter((teacher) => teacher.id != null)
                            .map((teacher) => (
                              <SelectItem
                                key={teacher.id}
                                value={teacher.id.toString()}
                              >
                                {teacher.first_name} {teacher.last_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="classroom_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lokaal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        required
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classrooms
                            .filter((classroom) => classroom.id != null)
                            .map((classroom) => (
                              <SelectItem
                                key={classroom.id}
                                value={classroom.id.toString()}
                              >
                                {classroom.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="!mt-8 flex justify-between w-full">
              <div>
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
