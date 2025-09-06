import { get_classes } from '@/apis/classAPI';
import { getClassrooms } from '@/apis/classroomAPI';
import rosterAPI from '@/apis/rosterAPI';
import { get_subjects } from '@/apis/subjectAPI';
import { get_teachers } from '@/apis/teachersAPI';
import CreateRosterModal from '@/components/rosters/CreateRosterModal';
import DeleteRosterDialog from '@/components/rosters/DeleteRosterDialog';
import EditRosterModal from '@/components/rosters/EditRosterModal';
import RosterManagementTable from '@/components/rosters/RosterManagementTable';
import ViewRosterModal from '@/components/rosters/ViewRosterModal';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, Filter, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RosterPage() {
  // Data states
  const [rosters, setRosters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRoster, setSelectedRoster] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterDay, setFilterDay] = useState('');

  const fetchRosters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rosterAPI.get_rosters();
      setRosters(data || []);
    } catch (error) {
      console.error('Failed to fetch rosters:', error);
      toast.error('Laden van roosters mislukt');
      setRosters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [classesData, subjectsData, teachersData, classroomsData] =
        await Promise.all([
          get_classes(),
          get_subjects(),
          get_teachers(),
          getClassrooms(),
        ]);

      setClasses(classesData || []);
      setSubjects(subjectsData || []);
      setTeachers(teachersData || []);
      setClassrooms(classroomsData || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Laden van basisgegevens mislukt');
    }
  }, []);

  useEffect(() => {
    fetchRosters();
    fetchInitialData();
  }, [fetchRosters, fetchInitialData]);

  // Filter rosters based on search and filter criteria
  const filteredRosters = rosters.filter((roster) => {
    const matchesSearch =
      !searchTerm ||
      roster.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roster.class_layout?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      `${roster.teacher?.first_name} ${roster.teacher?.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      roster.classroom?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass =
      !filterClass || roster.class_id?.toString() === filterClass;
    const matchesTeacher =
      !filterTeacher || roster.teacher_id?.toString() === filterTeacher;
    const matchesDay = !filterDay || roster.day_of_week === filterDay;

    return matchesSearch && matchesClass && matchesTeacher && matchesDay;
  });

  const handleCreate = async (rosterData) => {
    try {
      await rosterAPI.add_roster(rosterData);
      toast.success('Rooster succesvol toegevoegd');
      fetchRosters();
    } catch (error) {
      console.error('Failed to create roster:', error);
      toast.error('Toevoegen van rooster mislukt');
    }
  };

  const handleEdit = (roster) => {
    setSelectedRoster(roster);
    setEditModalOpen(true);
  };

  const handleUpdate = async (rosterData) => {
    try {
      await rosterAPI.update_roster(rosterData);
      toast.success('Rooster succesvol bijgewerkt');
      fetchRosters();
    } catch (error) {
      console.error('Failed to update roster:', error);
      toast.error('Bijwerken van rooster mislukt');
    }
  };

  const handleView = (roster) => {
    setSelectedRoster(roster);
    setViewModalOpen(true);
  };

  const handleDelete = (roster) => {
    setSelectedRoster(roster);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (roster) => {
    try {
      await rosterAPI.delete_roster(roster.id);
      toast.success('Rooster succesvol verwijderd');
      fetchRosters();
      setDeleteDialogOpen(false);
      setSelectedRoster(null);
    } catch (error) {
      console.error('Failed to delete roster:', error);
      toast.error('Verwijderen van rooster mislukt');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClass('');
    setFilterTeacher('');
    setFilterDay('');
  };

  const DAYS_OF_WEEK = [
    { value: 'Monday', label: 'Maandag' },
    { value: 'Tuesday', label: 'Dinsdag' },
    { value: 'Wednesday', label: 'Woensdag' },
    { value: 'Thursday', label: 'Donderdag' },
    { value: 'Friday', label: 'Vrijdag' },
    { value: 'Saturday', label: 'Zaterdag' },
    { value: 'Sunday', label: 'Zondag' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Rooster Beheer"
        icon={<CalendarDays className="size-9" />}
        description="Beheer alle rooster items: toevoegen, bewerken en verwijderen."
        buttonText="Rooster Toevoegen"
        onAdd={() => setCreateModalOpen(true)}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="Alle klassen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle klassen</SelectItem>
                {classes
                  .filter((cls) => cls.id != null)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Alle docenten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle docenten</SelectItem>
                {teachers
                  .filter((teacher) => teacher.id != null)
                  .map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={filterDay} onValueChange={setFilterDay}>
              <SelectTrigger>
                <SelectValue placeholder="Alle dagen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle dagen</SelectItem>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Filters Wissen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {filteredRosters.length} van {rosters.length} roosters
        </p>
      </div>

      {/* Rosters Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-muted-foreground">Roosters laden...</div>
            </div>
          ) : (
            <RosterManagementTable
              rosters={filteredRosters}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateRosterModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreate}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
      />

      <EditRosterModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSubmit={handleUpdate}
        roster={selectedRoster}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        classrooms={classrooms}
      />

      <ViewRosterModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        roster={selectedRoster}
      />

      <DeleteRosterDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        roster={selectedRoster}
      />
    </div>
  );
}
