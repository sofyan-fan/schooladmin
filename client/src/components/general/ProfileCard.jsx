// src/components/profile/ProfileCard.jsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useEffect, useMemo, useState } from 'react';

function fieldValue(obj, path, fallback = '') {
  return (
    path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj) ?? fallback
  );
}

export default function ProfileCard({
  open,
  onOpenChange,
  user,
  onSave,
  onDelete,
  viewDateOnly = false,
}) {
  const [form, setForm] = useState(user ?? {});
  useEffect(() => setForm(user ?? {}), [user]);

  const role = form?.role || user?.role || 'Student';

  // Role-specific fields (extend as needed)
  const config = useMemo(() => {
    const common = [
      { name: 'firstName', label: 'Voornaam' },
      { name: 'lastName', label: 'Achternaam' },
      { name: 'email', label: 'E-mailadres' },
      { name: 'phone', label: 'Telefoon' },
      { name: 'address', label: 'Adres' },
      { name: 'postalCode', label: 'Postcode' },
      { name: 'city', label: 'Woonplaats' },
    ];

    const studentOnly = [
      { name: 'birthDate', label: 'Geboortedatum', type: 'date' },
      {
        name: 'gender',
        label: 'Geslacht',
        type: 'select',
        options: ['Man', 'Vrouw'],
      },
      { name: 'className', label: 'Klas / Groep' },
      { name: 'registrationDate', label: 'Registratiedatum', type: 'date' },
      { name: 'lessonPackage', label: 'Lespakket' },
      { name: 'status', label: 'Status', type: 'switch' },
    ];

    const teacherOnly = [
      { name: 'hireDate', label: 'In dienst sinds', type: 'date' },
      { name: 'subject', label: 'Vak' },
      { name: 'department', label: 'Afdeling' },
      { name: 'availability', label: 'Beschikbaarheid' },
      { name: 'active', label: 'Actief', type: 'switch' },
    ];

    return {
      personal: common,
      roleFields: role === 'Teacher' ? teacherOnly : studentOnly,
    };
  }, [role]);

  const initials = `${fieldValue(form, 'firstName', '?')[0] ?? ''}${
    fieldValue(form, 'lastName', '?')[0] ?? ''
  }`.toUpperCase();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    // naive email check; replace with your validation of choice
    if (!form.firstName || !form.lastName)
      return alert('Voornaam en achternaam zijn verplicht.');
    if (form.email && !/.+@.+\..+/.test(form.email))
      return alert('E-mailadres lijkt ongeldig.');
    onSave?.(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 w-full sm:!max-w-6xl ">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xl font-semibold">
                  {form.firstName || '—'} {form.lastName || ''}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{role}</Badge>
                  {form.id && (
                    <span className="text-muted-foreground text-sm">
                      ID: {form.id}
                    </span>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewDateOnly ? (
            <>
              <section className="space-y-4">
                <h3 className="font-medium">Datum</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    const candidates =
                      role === 'Teacher'
                        ? ['hireDate']
                        : ['birthDate', 'registrationDate'];
                    const fieldName =
                      candidates.find((n) => fieldValue(form, n, '') !== '') ||
                      candidates[0];
                    const labelMap = {
                      birthDate: 'Geboortedatum',
                      registrationDate: 'Registratiedatum',
                      hireDate: 'In dienst sinds',
                    };
                    const value = fieldValue(form, fieldName, '');
                    return (
                      <div className="space-y-1.5">
                        <Label htmlFor="dateOnlyField">
                          {labelMap[fieldName]}
                        </Label>
                        <Input id="dateOnlyField" value={value} readOnly />
                      </div>
                    );
                  })()}
                </div>
              </section>

              <div className="mt-6 flex items-center justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Sluiten
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Personal Information */}
              <section className="space-y-4">
                <h3 className="font-medifum">Persoonsgegevens</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.personal.map((f) => (
                    <div key={f.name} className="space-y-1.5">
                      <Label htmlFor={f.name}>{f.label}</Label>
                      {f.type === 'select' ? (
                        <Select
                          value={form[f.name] ?? ''}
                          onValueChange={(v) => update(f.name, v)}
                        >
                          <SelectTrigger id={f.name}>
                          <SelectValue
                            placeholder={`Selecteer ${f.label.toLowerCase()}`}
                          />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : f.type === 'switch' ? (
                        <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                          <Switch
                            id={f.name}
                            checked={!!form[f.name]}
                            onCheckedChange={(v) => update(f.name, v)}
                          />
                          <Label
                            htmlFor={f.name}
                            className="text-sm text-muted-foreground"
                          >
                            {form[f.name] ? 'Actief' : 'Inactief'}
                          </Label>
                        </div>
                      ) : (
                        <Input
                          id={f.name}
                          type={f.type === 'date' ? 'date' : 'text'}
                          value={fieldValue(form, f.name)}
                          onChange={(e) => update(f.name, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <Separator className="my-6" />

              {/* Role-specific */}
              <section className="space-y-4">
                <h3 className="font-medium">
                  {role === 'Teacher'
                    ? 'Dienstverband / Lesgeven'
                    : 'Schoolinformatie'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.roleFields.map((f) => (
                    <div key={f.name} className="space-y-1.5">
                      <Label htmlFor={f.name}>{f.label}</Label>
                      {f.type === 'select' ? (
                        <Select
                          value={form[f.name] ?? ''}
                          onValueChange={(v) => update(f.name, v)}
                        >
                          <SelectTrigger id={f.name}>
                          <SelectValue
                            placeholder={`Selecteer ${f.label.toLowerCase()}`}
                          />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : f.type === 'switch' ? (
                        <div className="flex h-10 items-center gap-3 rounded-md border px-3">
                          <Switch
                            id={f.name}
                            checked={!!form[f.name]}
                            onCheckedChange={(v) => update(f.name, v)}
                          />
                          <Label
                            htmlFor={f.name}
                            className="text-sm text-muted-foreground"
                          >
                            {form[f.name] ? 'Actief' : 'Inactief'}
                          </Label>
                        </div>
                      ) : (
                        <Input
                          id={f.name}
                          type={f.type || 'text'}
                          value={form[f.name] ?? ''}
                          onChange={(e) => update(f.name, e.target.value)}
                          placeholder={f.label}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer actions */}
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="destructive"
                  onClick={() => onDelete?.(form.id)}
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
