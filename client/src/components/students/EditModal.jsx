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

export default function EditModal({
  open,
  onOpenChange,
  user,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(user ?? {});
  useEffect(() => setForm(user ?? {}), [user]);

  const role = form?.role || user?.role || 'Student';

  const config = useMemo(() => {
    const common = [
      { name: 'firstName', label: 'Firstname' },
      { name: 'lastName', label: 'Lastname' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: 'Phone' },
      { name: 'address', label: 'Address' },
      { name: 'postalCode', label: 'Postal Code' },
      { name: 'city', label: 'City' },
    ];

    const studentOnly = [
      { name: 'birthDate', label: 'Birth Date', type: 'date' },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        options: ['Male', 'Female'],
      },
      { name: 'className', label: 'Class / Group' },
      { name: 'registrationDate', label: 'Registration Date', type: 'date' },
      { name: 'lessonPackage', label: 'Lesson Package' },
      { name: 'status', label: 'Status', type: 'switch' },
    ];

    const teacherOnly = [
      { name: 'hireDate', label: 'Hire Date', type: 'date' },
      { name: 'subject', label: 'Subject' },
      { name: 'department', label: 'Department' },
      { name: 'availability', label: 'Availability' },
      { name: 'active', label: 'Active', type: 'switch' },
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
    if (!form.firstName || !form.lastName)
      return alert('Firstname and Lastname are required.');
    if (form.email && !/.+@.+\..+/.test(form.email))
      return alert('Email seems invalid.');
    onSave?.(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Keep rounded corners and move scrolling inside */}
      <DialogContent className="max-w-5xl w-full sm:!max-w-6xl p-0 overflow-hidden">
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

          {/* Scroll region */}
          <div className="max-h-[70vh] overflow-y-auto pr-1 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:border-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25">
            {/* Personal Information */}
            <section className="space-y-4">
              <h3 className="font-medium">Personal Information</h3>
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
                            placeholder={`Select ${f.label.toLowerCase()}`}
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
                          {form[f.name] ? 'Active' : 'Inactive'}
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
                  ? 'Employment / Teaching'
                  : 'School Information'}
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
                            placeholder={`Select ${f.label.toLowerCase()}`}
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
                          {form[f.name] ? 'Active' : 'Inactive'}
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
              <Button variant="destructive" onClick={() => onDelete?.(form.id)}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
