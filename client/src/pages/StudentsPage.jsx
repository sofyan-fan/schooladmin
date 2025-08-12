// src/pages/StudentsPage.jsx
import studentAPI from '@/apis/students/studentAPI';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
// import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from '@/components/ui/checkbox';
// shadcn/ui
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed dropdown in favor of inline action buttons
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Optional icon, remove if you do not use lucide
import ProfileCard from '@/components/general/ProfileCard';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
// Server fetch now used; dummy loader removed

// Unused helper removed

export default function StudentsPage() {
  // const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const statusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <Badge variant="outline">Actief</Badge>;
      case 'Inactive':
        return <Badge variant="outline">Inactief</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const displayValue = (value) => {
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const formatDate = (value) => {
    if (!value) return '—';
    // Accept Date, ISO string, or yyyy-mm-dd
    try {
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return displayValue(value);
      return d.toLocaleDateString();
    } catch {
      return displayValue(value);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const response = await studentAPI.get_students();
        const mapped = Array.isArray(response)
          ? response.map((s) => ({
              id: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              email: s.parent_email ?? '',
              phone: s.phone ?? '',
              address: s.address ?? '',
              postalCode: s.postal_code ?? '',
              city: s.city ?? '',
              birthDate: s.birth_date ?? '',
              gender: s.gender ?? '',
              className: s.class_layout?.name ?? '',
              registrationDate: s.created_at ?? '',
              lessonPackage: s.lesson_package ?? '',
              paymentActive: Array.isArray(s.payments)
                ? s.payments.some(
                    (p) =>
                      typeof p.status === 'string' &&
                      p.status.toLowerCase() === 'paid'
                  )
                : false,
              enrollmentActive: !!s.enrollment_status,
              role: 'Student',
              status: s.enrollment_status ? 'Active' : 'Inactive',
              selected: false,
            }))
          : [];
        if (mounted) setStudents(mapped);
      } catch (e) {
        console.error('Failed to load students', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return students
      .filter((s) => {
        if (roleFilter !== 'All' && s.role !== roleFilter) return false;
        const hay =
          `${s.firstName} ${s.lastName} ${s.email} ${s.className}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
      })
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName)
      );
  }, [students, q, roleFilter]);

  const [selected, setSelected] = useState(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);

  const handleEdit = (record) => {
    setSelected(record);
    setViewOnly(false);
    setOpenProfile(true);
  };
  const handleView = (record) => {
    setSelected(record);
    setViewOnly(true);
    setOpenProfile(true);
  };

  const handleSave = (updated) => {
    // update your table state optimistically (or call API then reload)
    setStudents((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
  };

  const handleDelete = (id) => {
    if (!id) return;
    // call API then update state
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setOpenProfile(false);
  };

  return (
    <LayoutWrapper>
      <div className="flex flex-col gap-6 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Leerlingen
            </h1>
            <p className="text-sm text-muted-foreground">
              Leerlingenoverzicht{' '}
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe leerling
          </Button>
          {/* <div className="flex items-center gap-3">
        {user ? (
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
            Ingelogd als {user.email}
          </Badge>
        ) : (
          <Badge variant="secondary">Geen gebruiker ingelogd</Badge>
        )}
      </div> */}
        </div>

        <Card className="">
          {/* <CardHeader className="">
        <CardTitle className="text-base">Overzicht</CardTitle>
      </CardHeader> */}
          <CardContent className="flex flex-col gap-4 min-w-0">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Zoek op naam, e-mail of klas"
                className="sm:max-w-sm"
              />

              {/* Simple role filter built from Button group */}
              <div className="inline-flex rounded-md border bg-background p-1">
                {['Student'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={[
                      'px-3 py-1.5 text-sm rounded-md',
                      roleFilter === r
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    ].join(' ')}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border w-full max-w-full min-w-0 overflow-x-auto">
              {/* shadcn Table already wraps the <table> in a scrollable container, this wrapper is the only horizontal scroller */}
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[50px]">ID</TableHead>
                    <TableHead className="min-w-[140px]">Voornaam</TableHead>
                    <TableHead className="min-w-[160px]">Achternaam</TableHead>
                    <TableHead className="min-w-[220px]">E-mail</TableHead>
                    <TableHead className="min-w-[160px]">Telefoon</TableHead>
                    <TableHead className="min-w-[220px]">Adres</TableHead>
                    <TableHead className="min-w-[140px]">Postcode</TableHead>
                    <TableHead className="min-w-[140px]">Stad</TableHead>
                    <TableHead className="min-w-[160px]">
                      Geboortedatum
                    </TableHead>
                    <TableHead className="min-w-[120px]">Geslacht</TableHead>
                    <TableHead className="min-w-[140px]">Klas</TableHead>
                    <TableHead className="min-w-[180px]">
                      Registratiedatum
                    </TableHead>
                    <TableHead className="min-w-[180px]">Lespakket</TableHead>
                    <TableHead className="min-w-[160px]">
                      Betaling actief
                    </TableHead>
                    <TableHead className="min-w-[190px]">
                      Inschrijving actief
                    </TableHead>
                    <TableHead className="min-w-[110px]">Rol</TableHead>
                    <TableHead className="min-w-[110px]">Status</TableHead>
                    <TableHead className="w-[60px] text-right">
                      Acties
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        Laden...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        Geen resultaten gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => (
                      <TableRow
                        key={s.id}
                        className={cn(
                          'hover:bg-muted/50',
                          s.selected && 'bg-green-50'
                        )}
                      >
                        <TableCell className="text-muted-foreground">
                          <Checkbox
                            checked={s.selected}
                            onCheckedChange={(checked) => {
                              setStudents((prev) =>
                                prev.map((stu) =>
                                  stu.id === s.id
                                    ? { ...stu, selected: checked }
                                    : stu
                                )
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {displayValue(s.firstName)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {displayValue(s.lastName)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {displayValue(s.email)}
                        </TableCell>
                        <TableCell>{displayValue(s.phone)}</TableCell>
                        <TableCell>{displayValue(s.address)}</TableCell>
                        <TableCell>{displayValue(s.postalCode)}</TableCell>
                        <TableCell>{displayValue(s.city)}</TableCell>
                        <TableCell>{formatDate(s.birthDate)}</TableCell>
                        <TableCell>{displayValue(s.gender)}</TableCell>
                        <TableCell>{displayValue(s.className)}</TableCell>
                        <TableCell>{formatDate(s.registrationDate)}</TableCell>
                        <TableCell>{displayValue(s.lessonPackage)}</TableCell>
                        <TableCell>{displayValue(s.paymentActive)}</TableCell>
                        <TableCell>
                          {displayValue(s.enrollmentActive)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {displayValue(s.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{statusBadge(s.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Bekijken"
                              title="Bekijken"
                              onClick={() => handleView(s)}
                            >
                              <Eye className="size-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Bewerken"
                              title="Bewerken"
                              onClick={() => handleEdit(s)}
                            >
                              <Pencil className="size-5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Verwijderen"
                              title="Verwijderen"
                              onClick={() => alert(`Verwijder ${s.id}`)}
                            >
                              <Trash2 className="size-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProfileCard
        open={openProfile}
        onOpenChange={setOpenProfile}
        user={selected}
        onSave={handleSave}
        onDelete={handleDelete}
        viewDateOnly={viewOnly}
      />
    </LayoutWrapper>
  );
}
