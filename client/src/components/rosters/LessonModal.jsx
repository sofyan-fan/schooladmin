import rosterAPI from '@/apis/rosterAPI';
import { Button } from '@/components/ui/button';
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

const formSchema = z.object({
  class_id: z.string().min(1, 'Klas is verplicht'),
  subject_id: z.string().min(1, 'Vak is verplicht'),
  teacher_id: z.string().min(1, 'Docent is verplicht'),
  classroom_id: z.string().min(1, 'Lokaal is verplicht'),
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
    defaultValues: {
      class_id: '',
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
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
        });
      } else {
        // Creating new event
        form.reset({
          class_id: '',
          subject_id: '',
          teacher_id: '',
          classroom_id: '',
        });
      }
    }
  }, [open, selectedEvent, form]);

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
        await rosterAPI.update_roster({
          ...data,
          id: selectedEvent.id,
          start: selectedEvent.start.toISOString(),
          end: selectedEvent.end.toISOString(),
        });
        toast.success('Les succesvol bijgewerkt');
      } else if (selectedSlot) {
        // Create new event
        await rosterAPI.add_roster({
          ...data,
          start: selectedSlot.start.toISOString(),
          end: selectedSlot.end.toISOString(),
        });
        toast.success('Les succesvol toegevoegd');
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
          <div className="text-sm text-muted-foreground pt-2 space-y-1">
            <div>{getDateDisplay()}</div>
            <div className="font-semibold">{getTimeDisplay()}</div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vak</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een vak" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een klas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes
                        .filter((cls) => cls.id != null)
                        .map((cls) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een docent" />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een lokaal" />
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

            <DialogFooter className="flex justify-between">
              {selectedEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="mr-auto"
                >
                  Verwijderen
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit">
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
