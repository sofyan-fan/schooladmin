// src/components/EditModal.jsx
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import ComboboxField from '@/components/ui/combobox';
import { ArrowRight, GraduationCap, Users } from 'lucide-react';

function initialsOf(student) {
  const f = (student?.firstName || '').trim();
  const l = (student?.lastName || '').trim();
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase() || 'ST';
}

/**
 * Props
 * - open, onOpenChange
 * - student: { id, firstName, lastName, email, phone, address, city, postalCode, classId, className, lessonPackage, status }
 * - classes: [{ id, name }]
 * - courses: [{ id, name }]
 * - onSave(formData)
 * - onDelete(id)
 * - onGoToResults(id)
 * - onGoToCourse(courseId)
 */
export default function EditModal({
  open,
  onOpenChange,
  student,
  classes = [],
  courses = [],
  onSave,
  onDelete,
  onGoToResults,
  onGoToCourse,
}) {
  const [form, setForm] = useState(() => ({
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    classId: null,
    courseId: null,
    status: student?.status === 'Active',
  }));

  useEffect(() => {
    if (!student) return;
    setForm({
      email: student.email || '',
      phone: student.phone || '',
      address: student.address || '',
      city: student.city || '',
      postalCode: student.postalCode || '',
      classId: student.classId ?? student.class_id ?? null,
      courseId: student.courseId ?? null, // wire this if you store it on the student
      status: student.status === 'Active',
    });
  }, [student]);

  const classItems = useMemo(
    () =>
      classes
        .filter((c) => c?.id != null)
        .map((c) => ({ value: String(c.id), label: c.name })),
    [classes]
  );

  const courseItems = useMemo(
    () =>
      courses
        .filter((c) => c?.id != null)
        .map((c) => ({ value: String(c.id), label: c.name })),
    [courses]
  );

  const fullName = useMemo(
    () => [student?.firstName, student?.lastName].filter(Boolean).join(' '),
    [student]
  );

  const classLabel =
    classes.find((c) => String(c.id) === String(form.classId))?.name ||
    student?.className ||
    null;

  const courseLabel =
    courses.find((c) => String(c.id) === String(form.courseId))?.name || null;

  const statusText = form.status ? 'Actief' : 'Inactief';

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    onSave?.({
      id: student?.id,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      classId: form.classId != null ? Number(form.classId) : null,
      courseId: form.courseId != null ? Number(form.courseId) : null,
      status: form.status ? 'Active' : 'Inactive',
    });
    onOpenChange(false);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(95vw,960px)] p-0 overflow-hidden rounded-2xl">
        <div className="p-6">
          {/* Header */}
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{initialsOf(student)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-2xl font-semibold truncate">
                    {fullName || 'Student'}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-2.5 py-0.5">
                      Student
                    </Badge>
                    {classLabel ? (
                      <Badge variant="outline" className="px-2.5 py-0.5">
                        {classLabel}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="secondary"
                      className={
                        form.status
                          ? 'px-2.5 py-0.5 bg-emerald-50 text-emerald-700'
                          : 'px-2.5 py-0.5'
                      }
                    >
                      {statusText}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Separator />

          {/* Body */}
          <div className="pt-5">
            <div className="grid gap-8 sm:grid-cols-12">
              {/* Left: Snel bewerken */}
              <section className="sm:col-span-7">
                <h3 className="text-base font-medium text-muted-foreground mb-3">
                  Snel bewerken
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="naam@voorbeeld.nl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+316..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="Straat en nummer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">Stad</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        placeholder="Plaats"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postal">Postcode</Label>
                      <Input
                        id="postal"
                        value={form.postalCode}
                        onChange={(e) => update('postalCode', e.target.value)}
                        placeholder="1234 AB"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick links, now under Contactgegevens */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Snel naar
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-green-700"
                      onClick={() => onGoToResults?.(student.id)}
                    >
                      Resultaten van toetsen en examens
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                    {form.courseId && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-green-700"
                        onClick={() => onGoToCourse?.(Number(form.courseId))}
                      >
                        Lespakket
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Right: Toewijzing */}
              <section className="sm:col-span-5 sm:border-l border-border/60 sm:pl-7">
                <h3 className="text-base font-medium text-muted-foreground mb-3">
                  Toewijzing
                </h3>

                <div className="space-y-4">
                  <ComboboxField
                    label="Klas of groep"
                    value={form.classId != null ? String(form.classId) : ''}
                    onChange={(v) => update('classId', v ? Number(v) : null)}
                    items={classItems}
                    icon={<Users className="h-4 w-4" />}
                    placeholder="Selecteer klas of groep"
                  />

                  <ComboboxField
                    label="Course"
                    value={form.courseId != null ? String(form.courseId) : ''}
                    onChange={(v) => update('courseId', v ? Number(v) : null)}
                    items={courseItems}
                    icon={<GraduationCap className="h-4 w-4" />}
                    placeholder="Selecteer course"
                  />

                  <div className="space-y-2">
                    <Label>Inschrijving</Label>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                      <Switch
                        id="status"
                        checked={form.status}
                        onCheckedChange={(v) => update('status', v)}
                      />
                      <Label
                        htmlFor="status"
                        className="text-sm text-muted-foreground"
                      >
                        {form.status ? 'Actief' : 'Inactief'}
                      </Label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="destructive"
              onClick={() => onDelete?.(student.id)}
            >
              Verwijderen
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuleren
              </Button>
              <Button onClick={handleSave}>Opslaan</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
