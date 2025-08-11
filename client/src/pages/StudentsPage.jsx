// src/pages/StudentsPage.jsx
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { useEffect, useMemo, useState } from 'react';
// import { useAuth } from "@/hooks/useAuth";

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
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

// Replace this with your API call to studentAPI.get_students()
async function loadStudents() {
  // Example dummy data; shape matches a typical user model
  return [
    {
      id: 'stu_1001',
      firstName: 'Aisha',
      lastName: 'Khan',
      email: 'aisha.khan@example.com',
      className: 'Groep 6A',
      role: 'Student',
      status: 'Active',
    },

    {
      id: 'stu_1003',
      firstName: 'Sara',
      lastName: 'Mahmoud',
      email: 'sara.mahmoud@example.com',
      className: 'Groep 5C',
      role: 'Student',
      status: 'Active',
    },

    {
      id: 'stu_1004',
      firstName: 'Omar',
      lastName: 'Rahman',
      email: 'omar.rahman@example.com',
      className: 'Groep 8A',
      role: 'Student',
      status: 'Suspended',
    },
    {
      id: 'stu_1005',
      firstName: 'Layla',
      lastName: 'Hussein',
      email: 'layla.hussein@example.com',
      className: 'Groep 4B',
      role: 'Student',
      status: 'Active',
    },
    {
      id: 'stu_1006',
      firstName: 'Bilal',
      lastName: 'Karim',
      email: 'bilal.karim@example.com',
      className: 'Groep 7A',
      role: 'Student',
      status: 'Active',
    },
    {
      id: 'stu_1007',
      firstName: 'Maryam',
      lastName: 'Saleh',
      email: 'maryam.saleh@example.com',
      className: 'Groep 6B',
      role: 'Student',
      status: 'Inactive',
    },
    {
      id: 'stu_1008',
      firstName: 'Hamza',
      lastName: 'Ali',
      email: 'hamza.ali@example.com',
      className: 'Groep 8B',
      role: 'Student',
      status: 'Active',
    },
    {
      id: 'stu_1009',
      firstName: 'Noor',
      lastName: 'Jamal',
      email: 'noor.jamal@example.com',
      className: 'Groep 5B',
      role: 'Student',
      status: 'Active',
    },
    {
      id: 'stu_1010',
      firstName: 'Ismail',
      lastName: 'Farooq',
      email: 'ismail.farooq@example.com',
      className: 'Groep 4A',
      role: 'Student',
      status: 'Inactive',
    },
    {
      id: 'stu_1011',
      firstName: 'Zahra',
      lastName: 'Othman',
      email: 'zahra.othman@example.com',
      className: 'Groep 7C',
      role: 'Student',
      status: 'Active',
    },
    {
      id: 'stu_1012',
      firstName: 'Ahmed',
      lastName: 'Mansour',
      email: 'ahmed.mansour@example.com',
      className: 'Groep 6C',
      role: 'Student',
      status: 'Suspended',
    },
    {
      id: 'stu_1013',
      firstName: 'Huda',
      lastName: 'Nasir',
      email: 'huda.nasir@example.com',
      className: 'Groep 8C',
      role: 'Student',

      status: 'Active',
    },
    {
      id: 'stu_1014',
      firstName: 'Khalid',
      lastName: 'Tariq',
      email: 'khalid.tariq@example.com',
      className: 'Groep 5A',
      role: 'Student',
      status: 'Active',
    },
  ];
}

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // If you have an API:
        // const response = await studentAPI.get_students();
        // if (mounted) setStudents(response.data);
        const data = await loadStudents();
        if (mounted) setStudents(data);
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

  return (
    <LayoutWrapper>
      <div className="flex flex-col gap-6">
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

        <Card>
          {/* <CardHeader className="">
            <CardTitle className="text-base">Overzicht</CardTitle>
          </CardHeader> */}
          <CardContent className="flex flex-col gap-4">
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
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Naam</TableHead>
                    <TableHead className="min-w-[220px]">E-mail</TableHead>
                    <TableHead className="min-w-[120px]">Klas</TableHead>
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
                      <TableCell colSpan={6} className="text-center py-10">
                        Laden...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        Geen resultaten gevonden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {s.firstName} {s.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.email}
                        </TableCell>
                        <TableCell>{s.className}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.role}</Badge>
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
                              onClick={() => alert(`Open ${s.id}`)}
                            >
                              <Eye className="size-7" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Bewerken"
                              title="Bewerken"
                              onClick={() => alert(`Bewerk ${s.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              aria-label="Verwijderen"
                              title="Verwijderen"
                              onClick={() => alert(`Verwijder ${s.id}`)}
                            >
                              <Trash2 className="h-4 w-4" />
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
    </LayoutWrapper>
  );
}
