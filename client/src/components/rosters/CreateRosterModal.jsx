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
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  class_id: z.string().min(1, 'Klas is verplicht'),
  subject_id: z.string().min(1, 'Vak is verplicht'),
  teacher_id: z.string().min(1, 'Docent is verplicht'),
  classroom_id: z.string().min(1, 'Lokaal is verplicht'),
  day_of_week: z.string().min(1, 'Dag is verplicht'),
  start_time: z.string().min(1, 'Starttijd is verplicht'),
  end_time: z.string().min(1, 'Eindtijd is verplicht'),
});

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Maandag' },
  { value: 'Tuesday', label: 'Dinsdag' },
  { value: 'Wednesday', label: 'Woensdag' },
  { value: 'Thursday', label: 'Donderdag' },
  { value: 'Friday', label: 'Vrijdag' },
  { value: 'Saturday', label: 'Zaterdag' },
  { value: 'Sunday', label: 'Zondag' },
];

const CreateRosterModal = ({
  open,
  onOpenChange,
  onSubmit,
  classes,
  subjects,
  teachers,
  classrooms,
}) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class_id: '',
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
    },
  });

  const handleSubmit = async (values) => {
    try {
      await onSubmit({
        ...values,
        class_id: parseInt(values.class_id),
        subject_id: parseInt(values.subject_id),
        teacher_id: parseInt(values.teacher_id),
        classroom_id: parseInt(values.classroom_id),
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating roster:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nieuw Rooster Toevoegen</DialogTitle>
          <DialogDescription>
            Vul alle velden in om een nieuw rooster item aan te maken.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Klas</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                name="subject_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vak</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="teacher_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Docent</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
            </div>

            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dag van de Week</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een dag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuleren
              </Button>
              <Button type="submit">Rooster Toevoegen</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRosterModal;
