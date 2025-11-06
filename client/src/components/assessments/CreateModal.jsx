import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import classAPI from '@/apis/classAPI';
import moduleAPI from '@/apis/moduleAPI';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const requiredError = (fieldName) => ({
  required_error: `${fieldName} is verplicht.`,
});

const assessmentSchema = z.object({
  type: z.enum(['Test', 'Exam'], requiredError('Type')),
  name: z
    .string(requiredError('Naam'))
    .min(3, 'Naam moet minimaal 3 tekens bevatten.'),
  date: z.date(requiredError('Datum')),
  class_id: z.string(requiredError('Klas')),
  subject_id: z.string(requiredError('Vak')),
  description: z.string().optional(),
  leverage: z.coerce.number().optional().nullable(),
  is_central: z.boolean().default(false),
});

export default function CreateModal({ open, onOpenChange, onSave }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      type: 'Test',
      name: '',
      class_id: undefined,
      subject_id: undefined,
      date: new Date(),
      leverage: 1,
      description: '',
      is_central: false,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classData, modulesData] = await Promise.all([
          classAPI.get_classes(),
          moduleAPI.get_modules(true),
        ]);
        console.log('Class Data', classData);
        setClasses(classData);
        console.log('Modules Data', modulesData);
        // Flatten course_module_subject records from modules
        const flattenedSubjects = modulesData.flatMap((module) =>
          module.subjects.map((subject) => ({
            id: subject.id, // This is the course_module_subject ID
            name: `${subject.subject?.name || 'Vak onbekend'} - ${subject.level
              }`,
            subject: subject.subject,
            level: subject.level,
            material: subject.material,
          }))
        );
        setSubjects(flattenedSubjects);
      } catch (error) {
        console.error('Failed to fetch classes or subjects', error);
        // Optionally, show a toast notification
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;
  const type = watch('type');

  const onSubmit = (data) => {
    // Convert class_id and subject_id to numbers

    const payload = {
      ...data,
      class_id: parseInt(data.class_id),
      subject_id: parseInt(data.subject_id),
    };
    onSave(payload);
    console.log('Assessment payload', payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nieuwe Toets/Examen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-3 mt-2"
                  >
                    <Label
                      htmlFor="test"
                      className={cn(
                        'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors cursor-pointer w-full',
                        field.value === 'Test'
                          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <RadioGroupItem
                        value="Test"
                        id="test"
                        className="sr-only"
                      />
                      Toets
                    </Label>
                    <Label
                      htmlFor="exam"
                      className={cn(
                        'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors cursor-pointer w-full',
                        field.value === 'Exam'
                          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <RadioGroupItem
                        value="Exam"
                        id="exam"
                        className="sr-only"
                      />
                      Examen
                    </Label>
                  </RadioGroup>
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Naam</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    id="name"
                    placeholder={`Naam ${type === 'Test' ? 'toets' : 'examen'}`}
                    {...field}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm font-medium text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2 w-full">
              <Label>Klas</Label>
              <Controller
                name="class_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kies een klas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.class_id && (
                <p className="text-sm font-medium text-destructive">
                  {errors.class_id.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Vak</Label>
              <Controller
                name="subject_id"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Kies een vak" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subject_id && (
                <p className="text-sm font-medium text-destructive">
                  {errors.subject_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Datum</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <Popover
                    open={isDatePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-white',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP', { locale: nl })
                        ) : (
                          <span>Kies een datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && (
                <p className="text-sm font-medium text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leverage">Weging</Label>
              <Controller
                name="leverage"
                control={control}
                render={({ field }) => (
                  <Input
                    id="leverage"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    {...field}
                  />
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Omschrijving</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="description"
                    className="bg-white"
                    placeholder="Beschrijf kort de inhoud van de toets of het examen..."
                    {...field}
                  />
                )}
              />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <Controller
                name="is_central"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="is_central"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_central" className="font-normal">
                Is dit een centraal examen?
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit">Aanmaken</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
