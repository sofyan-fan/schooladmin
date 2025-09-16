// src/components/EditModal.jsx
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
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
import { ArrowRight, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
 * - onSave(formData)
 * - onDelete(id)
 * - onGoToResults(id)
 */
export default function EditModal({
  open,
  onOpenChange,
  student,
  classes = [],
  onSave,
  onDelete,
  onGoToResults,
}) {
  const [form, setForm] = useState(() => ({
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    classId: null,
    status: student?.status === 'Active',
  }));

  useEffect(() => {
    if (!student) return;
    // Derive classId from several possible sources to ensure the field prefills
    const fromId = student.classId ?? student.class_id ?? null;
    const fromNested = student.class_layout?.id ?? null;
    let resolvedClassId = fromId || fromNested;

    // If still not found, try to match by class name against provided classes
    if (!resolvedClassId && student.className) {
      const match = classes.find(
        (c) =>
          c.name === student.className || c.name === (student.class_name || '')
      );
      if (match) resolvedClassId = match.id;
    }

    setForm({
      email: student.email || '',
      phone: student.phone || '',
      address: student.address || '',
      city: student.city || '',
      postalCode: student.postalCode || '',
      classId: resolvedClassId,
      status: student.status === 'Active',
    });
  }, [student, classes]);

  const classItems = useMemo(
    () =>
      classes
        .filter((c) => c?.id != null)
        .map((c) => ({ value: String(c.id), label: c.name })),
    [classes]
  );

  // Courses are now assigned through classes, not directly to students

  const fullName = useMemo(
    () => [student?.firstName, student?.lastName].filter(Boolean).join(' '),
    [student]
  );

  const classLabel =
    classes.find((c) => String(c.id) === String(form.classId))?.name ||
    student?.className ||
    null;

  const statusText = form.status ? 'Actief' : 'Inactief';

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    onSave?.({
      id: student?.id,
      firstName: student?.firstName,
      lastName: student?.lastName,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      classId: form.classId != null ? Number(form.classId) : null,
      status: form.status ? 'Active' : 'Inactive',
    });
    // Note: Modal closing is handled by parent component after successful save
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
                  Gegevens van {fullName}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="naam@voorbeeld.nl"
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+316..."
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="Straat en nummer"
                      className="bg-white"
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
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="postal">Postcode</Label>
                      <Input
                        id="postal"
                        value={form.postalCode}
                        onChange={(e) => update('postalCode', e.target.value)}
                        placeholder="1234 AB"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick links, now under Contactgegevens */}
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
                    <div className="mt-6">
                      <div className="flex justify-start ">
                        <Button
                          variant="link"
                          size={null}
                          className="p-0 h-auto text-green-700"
                          onClick={() => onGoToResults?.(student.id)}
                        >
                          Resultaten van toetsen en examens
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
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
