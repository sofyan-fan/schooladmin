import { get_classes } from '@/apis/classes/classAPI';
import { getClassrooms } from '@/apis/classrooms/classroomAPI';
import { get_teachers } from '@/apis/teachers/teachersAPI';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  classLayoutId: z.string().min(1, 'Group is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  classroomId: z.string().min(1, 'Classroom is required'),
});

export default function RosterEventModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  initialEvent,
}) {
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [classLayouts, setClassLayouts] = useState([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      classLayoutId: '',
      teacherId: '',
      classroomId: '',
    },
  });

  useEffect(() => {
    if (initialEvent) {
      form.reset({
        title: initialEvent.title || '',
        classLayoutId: initialEvent.classLayoutId?.toString() || '',
        teacherId: initialEvent.teacherId?.toString() || '',
        classroomId: initialEvent.classroomId?.toString() || '',
      });
    } else {
      form.reset({
        title: '',
        classLayoutId: '',
        teacherId: '',
        classroomId: '',
      });
    }
  }, [initialEvent, form]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [teachersData, classroomsData, classLayoutsData] =
          await Promise.all([
            get_teachers(),
            getClassrooms(),
            get_classes(), // Assuming get_classes fetches class_layouts
          ]);
        setTeachers(teachersData || []);
        setClassrooms(classroomsData || []);
        setClassLayouts(classLayoutsData || []);
      } catch (error) {
        console.error('Failed to fetch modal data', error);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = (values) => {
    onSave({ ...initialEvent, ...values });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialEvent?.id ? 'Edit Event' : 'Create Event'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subject name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classLayoutId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classLayouts.map((layout) => (
                        <SelectItem
                          key={layout.id}
                          value={layout.id.toString()}
                        >
                          {layout.name}
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
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classroomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classroom</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a classroom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classrooms.map((classroom) => (
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
            <DialogFooter className="flex justify-between sm:justify-between">
              <div>
                {initialEvent?.id && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      onDelete(initialEvent);
                      onOpenChange(false);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
