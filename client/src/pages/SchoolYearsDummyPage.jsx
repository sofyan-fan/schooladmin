import schoolyearDummyAPI from '@/apis/schoolyearDummyAPI';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SchoolYearsDummyPage() {
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  const loadYears = async () => {
    try {
      setLoading(true);
      setError('');
      const years = await schoolyearDummyAPI.list();
      setSchoolYears(years || []);
    } catch (e) {
      console.error('Failed to load dummy school years', e);
      setError(
        'Laden van dummy-schooljaren is mislukt. Dit is alleen testdata, probeer het later opnieuw.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  const filteredYears = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return schoolYears;
    return (schoolYears || []).filter((y) => {
      const name = (y.name || '').toLowerCase();
      const start = String(y.start_date || '').slice(0, 10);
      const end = String(y.end_date || '').slice(0, 10);
      return (
        name.includes(term) ||
        start.includes(term) ||
        end.includes(term)
      );
    });
  }, [schoolYears, search]);

  return (
    <>
      <PageHeader
        title="Schooljaren (dummy)"
        icon={<CalendarDays className="size-9" />}
        description="Dit overzicht toont een fictief schooljaar met historische dummy-data. Het heeft geen invloed op de echte database."
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Zoeken</span>
          <Input
            placeholder="Zoek op naam of datum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>
        {/* <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadYears}
          disabled={loading}
        >
          Opnieuw laden
        </Button> */}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dummy-schooljaren</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Startdatum</TableHead>
                <TableHead>Einddatum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Dummy-schooljaren worden geladen...
                  </TableCell>
                </TableRow>
              ) : filteredYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Geen dummy-schooljaren gevonden.
                  </TableCell>
                </TableRow>
              ) : (
                filteredYears.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell>{year.name}</TableCell>
                    <TableCell>
                      {String(year.start_date || '').slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {String(year.end_date || '').slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {year.is_archived ? 'Gearchiveerd (dummy)' : 'Actief (dummy)'}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() =>
                          navigate(`/school-jaar-dummy/${year.id}`)
                        }
                      >
                        <Eye className="size-4" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableCaption>
              Dit is alleen testdata voor ontwerp en demo-doeleinden.
            </TableCaption>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}


