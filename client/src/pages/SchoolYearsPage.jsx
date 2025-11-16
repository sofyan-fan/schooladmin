import schoolyearAPI from '@/apis/schoolyearAPI';
import CreateModal from '@/components/schoolyears/CreateModal';
import EditModal from '@/components/schoolyears/EditModal';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { CalendarDays, Eye, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SchoolYearsPage() {
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [onlyActive, setOnlyActive] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);

  const navigate = useNavigate();

  const loadYears = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (onlyActive) {
        params.active = true;
      } else if (showArchived) {
        params.includeArchived = true;
      }
      const years = await schoolyearAPI.getSchoolYears(params);
      setSchoolYears(years || []);
    } catch (e) {
      console.error('Failed to load school years', e);
      setError('Laden van schooljaren is mislukt. Probeer het later opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived, onlyActive]);

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
  const handleSaveYear = (savedYear) => {
    if (!savedYear) return;
    setSchoolYears((prev) => {
      const exists = prev.find((y) => y.id === savedYear.id);
      if (exists) {
        toast.success(`Schooljaar "${savedYear.name}" is bijgewerkt.`);
        return prev.map((y) => (y.id === savedYear.id ? savedYear : y));
      }
      toast.success(`Schooljaar "${savedYear.name}" is aangemaakt.`);
      return [...prev, savedYear];
    });
    setCreateOpen(false);
    setEditOpen(false);
    setEditingYear(null);
  };

  const handleActivate = async (year) => {
    try {
      await schoolyearAPI.activateSchoolYear(year.id);
      toast.success(`Schooljaar "${year.name}" is nu actief.`);
      await loadYears();
    } catch (err) {
      console.error('Failed to activate school year', err);
      const message =
        err?.response?.data?.error ||
        'Activeren van schooljaar is mislukt.';
      toast.error(message);
    }
  };

  const handleArchive = async (year) => {
    try {
      await schoolyearAPI.archiveSchoolYear(year.id);
      toast.success(`Schooljaar "${year.name}" is gearchiveerd.`);
      await loadYears();
    } catch (err) {
      console.error('Failed to archive school year', err);
      const message =
        err?.response?.data?.error ||
        'Archiveren van schooljaar is mislukt.';
      toast.error(message);
    }
  };

  const onToggleOnlyActive = (checked) => {
    setOnlyActive(checked);
    if (checked) {
      setShowArchived(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Schooljaren"
        icon={<CalendarDays className="size-9" />}
        description="Beheer hier de schooljaren: maak nieuwe jaren aan, activeer of archiveer ze."
        buttonText="Nieuw schooljaar"
        onAdd={() => {
          setEditingYear(null);
          setCreateOpen(true);
        }}
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="search">Zoeken</Label>
          <Input
            id="search"
            placeholder="Zoek op naam of datum..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="only-active"
            checked={onlyActive}
            onCheckedChange={onToggleOnlyActive}
          />
          <Label htmlFor="only-active">Alleen actieve schooljaren</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            disabled={onlyActive}
            onCheckedChange={setShowArchived}
          />
          <Label
            htmlFor="show-archived"
            className={onlyActive ? 'text-muted-foreground' : ''}
          >
            Gearchiveerde tonen
          </Label>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={loadYears}
          disabled={loading}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overzicht schooljaren</CardTitle>
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
                    Schooljaren worden geladen...
                  </TableCell>
                </TableRow>
              ) : filteredYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Geen schooljaren gevonden.
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
                      {year.is_active
                        ? 'Actief'
                        : year.is_archived
                          ? 'Gearchiveerd'
                          : 'Inactief'}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => navigate(`/school-jaar/${year.id}`)}
                      >
                        <Eye className="size-4" />
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setEditingYear(year);
                          setEditOpen(true);
                        }}
                      >
                        Bewerken
                      </Button>
                      {!year.is_active && !year.is_archived && (
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={() => handleActivate(year)}
                        >
                          Activeren
                        </Button>
                      )}
                      {!year.is_archived && (
                        <Button
                          variant="destructive"
                          size="sm"
                          type="button"
                          onClick={() => handleArchive(year)}
                        >
                          Archiveren
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {/* <TableCaption>
              Er kan maximaal één schooljaar tegelijk actief zijn.
            </TableCaption> */}
          </Table>
        </CardContent>
      </Card>
      <CreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleSaveYear}
      />
      <EditModal
        open={editOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingYear(null);
          setEditOpen(isOpen);
        }}
        onSave={handleSaveYear}
        schoolYear={editingYear}
      />
    </>
  );
}
