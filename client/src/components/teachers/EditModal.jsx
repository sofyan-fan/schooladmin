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
import { useEffect, useMemo, useState } from 'react';

function initialsOf(person) {
  const f = (person?.firstName || '').trim();
  const l = (person?.lastName || '').trim();
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase() || 'TE';
}

export default function EditModal({
  open,
  onOpenChange,
  teacher,
  classes = [],
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    active: false,
    classId: null,
  }));

  useEffect(() => {
    if (!teacher) return;
    // Resolve classId from teacher or by matching class name
    let resolvedClassId = teacher.classId ?? teacher.class_id ?? null;
    if (!resolvedClassId && teacher.class_layout) {
      const mentorClass = Array.isArray(teacher.class_layout)
        ? teacher.class_layout[0]
        : teacher.class_layout;
      resolvedClassId = mentorClass?.id ?? null;
    }
    if (!resolvedClassId && teacher.className) {
      const match = classes.find(
        (c) => c?.name === teacher.className || c?.name === teacher.class_name
      );
      if (match) resolvedClassId = match.id;
    }

    setForm({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      active: !!teacher.active,
      classId: resolvedClassId ?? null,
    });
  }, [teacher, classes]);

  const fullName = useMemo(
    () => [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' '),
    [teacher]
  );

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    onSave?.({
      id: teacher?.id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      active: !!form.active,
      classId: form.classId != null ? Number(form.classId) : null,
    });
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(95vw,720px)] p-0 overflow-hidden rounded-2xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{initialsOf(teacher)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-2xl font-semibold truncate">
                    {fullName || 'Docent'}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="px-2.5 py-0.5">
                      Docent
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        form.active
                          ? 'px-2.5 py-0.5 bg-emerald-50 text-emerald-700'
                          : 'px-2.5 py-0.5'
                      }
                    >
                      {form.active ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Separator />

          <div className="pt-5">
            <div className="grid gap-8 sm:grid-cols-12">
              <section className="sm:col-span-7">
                <h3 className="text-base font-medium text-muted-foreground mb-3">
                  Gegevens van {fullName || 'Docent'}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Voornaam</Label>
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Achternaam</Label>
                    <Input
                      id="lastName"
                      value={form.lastName}
                      onChange={(e) => update('lastName', e.target.value)}
                    />
                  </div>
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
                </div>
              </section>

              <section className="sm:col-span-5 sm:border-l border-border/60 sm:pl-7">
                <h3 className="text-base font-medium text-muted-foreground mb-3">
                  Toewijzing
                </h3>
                <div className="space-y-4">
                  <ComboboxField
                    label="Klas of groep"
                    value={form.classId != null ? String(form.classId) : ''}
                    onChange={(v) => update('classId', v ? Number(v) : null)}
                    items={classes
                      .filter((c) => c?.id != null)
                      .map((c) => ({ value: String(c.id), label: c.name }))}
                    placeholder="Selecteer klas of groep"
                  />

                  <div className="space-y-2">
                    <Label>Actief</Label>
                    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                      <Switch
                        id="active"
                        checked={form.active}
                        onCheckedChange={(v) => update('active', v)}
                      />
                      <Label
                        htmlFor="active"
                        className="text-sm text-muted-foreground"
                      >
                        {form.active ? 'Actief' : 'Inactief'}
                      </Label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="destructive"
              onClick={() => onDelete?.(teacher.id)}
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
