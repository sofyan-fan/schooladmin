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
import { Textarea } from '@/components/ui/textarea';
import TimePicker from '@/components/ui/time-picker';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuthContext } from '@/contexts/auth';
import lessonLogAPI, { LOG_TYPES } from '@/apis/lessonLogAPI';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronDown, ChevronUp, NotebookPen } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
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

  // Lesson log state
  const { user } = useContext(AuthContext);
  const [logExpanded, setLogExpanded] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [logType, setLogType] = useState(LOG_TYPES.LES);
  const [existingLogs, setExistingLogs] = useState([]);
  const logContentRef = useRef(null);
  const [logContentHeight, setLogContentHeight] = useState(0);

  // Check if current user is the teacher of this lesson
  const isTeacherOfLesson = (() => {
    if (!user || !selectedEvent) return false;
    const userRole = (user.role || '').toLowerCase();
    // Allow teachers and admins to add logs
    if (userRole !== 'teacher' && userRole !== 'admin') return false;
    // For teachers, check if they are assigned to this lesson
    // Admins can log for any lesson
    if (userRole === 'admin') return true;
    // Match by user.id or user.teacherId against the lesson's teacherId
    const lessonTeacherId = selectedEvent.resource?.teacherId;
    return (
      lessonTeacherId &&
      (Number(user.id) === Number(lessonTeacherId) ||
        Number(user.teacherId) === Number(lessonTeacherId))
    );
  })();

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

  // Load existing logs when modal opens with an event
  useEffect(() => {
    if (!open) {
      // Reset log state when modal closes
      setLogContent('');
      setLogType(LOG_TYPES.LES);
      setLogExpanded(false);
      setExistingLogs([]);
      setLogContentHeight(0);
      return;
    }
    if (selectedEvent) {
      const rosterId = selectedEvent.id;
      const dateKey = format(selectedEvent.start, 'yyyy-MM-dd');

      // Load logs from API
      const loadLogs = async () => {
        try {
          // Load log for current date
          const currentLog = await lessonLogAPI.getLogByRosterDate(rosterId, dateKey);
          setLogContent(currentLog?.content || '');
          setLogType(currentLog?.type || LOG_TYPES.LES);

          // Load all logs for this lesson (history)
          const allLogs = await lessonLogAPI.getLogsForRoster(rosterId);
          setExistingLogs(allLogs);
        } catch (error) {
          console.error('Failed to load lesson logs:', error);
        }
      };
      loadLogs();
    }
  }, [open, selectedEvent]);

  // Measure content height for animation
  useEffect(() => {
    if (logContentRef.current) {
      setLogContentHeight(logContentRef.current.scrollHeight);
    }
  }, [logExpanded, logContent]);

  // Handle saving a log entry
  const handleSaveLog = async () => {
    if (!selectedEvent || !logContent.trim()) return;

    const rosterId = selectedEvent.id;
    const dateKey = format(selectedEvent.start, 'yyyy-MM-dd');
    const teacherName = selectedEvent.resource?.teacherName ||
      (user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.email || 'Onbekend');

    try {
      await lessonLogAPI.saveLog({
        roster_id: rosterId,
        teacher_id: user?.id || user?.teacherId,
        teacher_name: teacherName,
        date: dateKey,
        type: logType,
        content: logContent.trim(),
      });

      // Refresh logs list
      const allLogs = await lessonLogAPI.getLogsForRoster(rosterId);
      setExistingLogs(allLogs);

      const typeLabel = logType === LOG_TYPES.QURAN ? "Qur'an" : 'Les';
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{typeLabel}notitie opgeslagen</span>
          <Link
            to="/lessen-logs"
            className="text-xs text-primary hover:underline"
          >
            Bekijk alle notities →
          </Link>
        </div>
      );
    } catch (error) {
      console.error('Failed to save lesson log:', error);
      toast.error('Notitie kon niet worden opgeslagen');
    }
  };

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

            {/* Lesnotitie - Only show for existing events and teachers/admins */}
            {selectedEvent && isTeacherOfLesson && (
              <div className="space-y-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setLogExpanded(!logExpanded)}
                  className="flex items-center gap-2 text-base font-medium text-foreground hover:text-primary transition-colors w-full"
                >
                  <NotebookPen className="h-4 w-4" />
                  <span>Lesnotitie</span>
                  {logExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-auto transition-transform duration-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-500" />
                  )}
                  {existingLogs.length > 0 && !logExpanded && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({existingLogs.length} notitie{existingLogs.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </button>

                <div
                  className="overflow-hidden transition-all duration-500 ease-in-out"
                  style={{
                    maxHeight: logExpanded ? `${logContentHeight + 50}px` : '0px',
                    opacity: logExpanded ? 1 : 0,
                  }}
                >
                  <div ref={logContentRef} className="space-y-3 pl-6 pt-1">
                    {/* Log type toggle */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Type notitie</label>
                      <ToggleGroup
                        type="single"
                        value={logType}
                        onValueChange={(value) => value && setLogType(value)}
                        className="justify-start"
                      >
                        <ToggleGroupItem
                          value={LOG_TYPES.LES}
                          aria-label="Les notitie"
                          className="px-4"
                        >
                          Les
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value={LOG_TYPES.QURAN}
                          aria-label="Qur'an notitie"
                          className="px-4"
                        >
                          Qur'an
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>

                    {/* Current date log input */}
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Notitie voor {format(selectedEvent.start, 'd MMMM yyyy', { locale: nl })}
                      </label>
                      <Textarea
                        value={logContent}
                        onChange={(e) => setLogContent(e.target.value)}
                        placeholder={logType === LOG_TYPES.QURAN 
                          ? "Schrijf hier je Qur'an notitie..." 
                          : "Schrijf hier je notitie voor deze les..."}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <Link
                          to="/lessen-logs"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          Bekijk alle notities →
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleSaveLog}
                          disabled={!logContent.trim()}
                        >
                          Notitie opslaan
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
