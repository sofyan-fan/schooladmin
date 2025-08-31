import assessmentAPI from '@/apis/assessmentAPI';
import classAPI from '@/apis/classAPI';
import subjectAPI from '@/apis/subjectAPI';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogClose,
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
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function EditAssessmentModal({
  open,
  onOpenChange,
  onSave,
  assessment,
  type = 'test',
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(null);
  const [duration, setDuration] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (assessment && open) {
      // Populate form with assessment data
      setName(assessment.name || '');
      setDescription(assessment.description || '');
      setClassId(assessment.classId?.toString() || '');
      setSubjectId(assessment.subjectId?.toString() || '');
      setDate(assessment.date ? parseISO(assessment.date) : null);
      setDuration(assessment.duration?.toString() || '');
      setMaxScore(assessment.maxScore?.toString() || '');
      setWeight(assessment.weight?.toString() || '1');
      setError('');

      // Load classes and subjects
      loadData();
    }
  }, [assessment, open]);

  const loadData = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        classAPI.get_classes(),
        subjectAPI.get_subjects(),
      ]);
      setClasses(classesData || []);
      setSubjects(subjectsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Kon klassen en vakken niet laden');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setError('Voer een naam in.');
      return;
    }
    if (!classId) {
      setError('Selecteer een klas.');
      return;
    }
    if (!subjectId) {
      setError('Selecteer een vak.');
      return;
    }
    if (!date) {
      setError('Selecteer een datum.');
      return;
    }
    if (!maxScore || maxScore <= 0) {
      setError('Voer een geldige maximale score in.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const assessmentData = {
        name: name.trim(),
        description: description.trim(),
        class_id: parseInt(classId),
        subject_id: parseInt(subjectId),
        date: format(date, 'yyyy-MM-dd'),
        duration: duration ? parseInt(duration) : null,
        maxScore: parseFloat(maxScore),
        weight: weight ? parseFloat(weight) : 1,
      };

      let savedAssessment;
      if (type === 'test') {
        savedAssessment = await assessmentAPI.updateTest(
          assessment.id,
          assessmentData
        );
      } else {
        savedAssessment = await assessmentAPI.updateExam(assessment.id, {
          ...assessmentData,
          is_central: assessment.is_central || false, // Preserve existing value or default to false
        });
      }

      // Add class and subject names for display
      const classObj = classes.find((c) => c.id === parseInt(classId));
      const subjectObj = subjects.find((s) => s.id === parseInt(subjectId));

      savedAssessment.class = classObj?.name || `Class ${classId}`;
      savedAssessment.subject = subjectObj?.name || `Subject ${subjectId}`;
      savedAssessment.type = type;
      savedAssessment.id = assessment.id;

      if (onSave) {
        onSave(savedAssessment, type);
      }
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update assessment:', err);
      setError(err.message || 'Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === 'test' ? 'Toets bewerken' : 'Examen bewerken'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Assessment Type - display as toggle, disabled in edit to avoid converting types */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Type</Label>
            <RadioGroup value={type} className="flex gap-3" disabled>
              <Label
                htmlFor="edit-test"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium',
                  type === 'test'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border'
                )}
              >
                <RadioGroupItem
                  value="test"
                  id="edit-test"
                  className="sr-only"
                />
                Toets
              </Label>
              <Label
                htmlFor="edit-exam"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium',
                  type === 'exam'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border'
                )}
              >
                <RadioGroupItem
                  value="exam"
                  id="edit-exam"
                  className="sr-only"
                />
                Examen
              </Label>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'test' ? 'Voer toetsnaam in' : 'Voer examennaam in'
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Kies een datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Klas *</Label>
              <Select
                value={classId}
                onValueChange={setClassId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies een klas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Vak *</Label>
              <Select
                value={subjectId}
                onValueChange={setSubjectId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies een vak" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'test'
                  ? 'Voer toetsomschrijving in'
                  : 'Voer examenomschrijving in'
              }
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxScore">Max. score *</Label>
              <Input
                id="maxScore"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
                min="0"
                step="0.5"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duur (minuten)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weging</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="1.0"
                min="0"
                step="0.1"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between pt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={loading}>
              Annuleren
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
