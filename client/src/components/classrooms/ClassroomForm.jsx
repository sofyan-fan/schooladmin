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
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  max_students: z.coerce.number().int().positive('Max. studenten is verplicht'),
  description: z.string().optional(),
});

export default function ClassroomForm({ defaultValues, onSave, isEditing }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: '',
      max_students: '',
      description: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Naam</FormLabel>
              <FormControl>
                <Input placeholder="Klaslokaal naam" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="max_students"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max. Studenten</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Max. studenten" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beschrijving</FormLabel>
              <FormControl>
                <Textarea placeholder="Voeg een beschrijving toe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{isEditing ? 'Opslaan' : 'Aanmaken'}</Button>
      </form>
    </Form>
  );
}
