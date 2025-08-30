import classApi from '@/apis/classAPI';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  classId: z.coerce.number().int().positive('Class is required'),
  schedules: z.array(
    z.object({
      day: z.string().min(1, 'Day is required'),
      startTime: z.string().min(1, 'Start time is required'),
      endTime: z.string().min(1, 'End time is required'),
      location: z.string().min(1, 'Location is required'),
    })
  ),
});

export default function RosterForm({
  defaultValues,
  onSubmit,
  isEditing = false,
}) {
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      classId: '',
      schedules: [{ day: '', startTime: '', endTime: '', location: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'schedules',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingClasses(true);
      try {
        const data = await classApi.get_classes();
        if (mounted) setClasses(data || []);
      } catch (e) {
        console.error('Failed to load classes', e);
      } finally {
        if (mounted) setLoadingClasses(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={
                  field.value !== undefined &&
                  field.value !== null &&
                  field.value !== ''
                    ? String(field.value)
                    : undefined
                }
                disabled={loadingClasses}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {fields.map((field, index) => (
          <div key={field.id} className="relative rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-semibold">Schedule {index + 1}</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`schedules.${index}.day`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monday" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`schedules.${index}.location`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Room 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`schedules.${index}.startTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`schedules.${index}.endTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {fields.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-5 text-destructive" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({ day: '', startTime: '', endTime: '', location: '' })
          }
        >
          <PlusCircle className="mr-2 size-5" />
          Add Schedule
        </Button>

        <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
      </form>
    </Form>
  );
}
