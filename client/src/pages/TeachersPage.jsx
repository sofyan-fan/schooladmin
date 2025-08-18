import teachersAPI from '@/apis/teachers/teachersAPI';
import ProfileCard from '@/components/general/ProfileCard';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import StudentViewProfileCard from '@/components/StudentViewProfileCard';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/button';
import { createColumns } from './teachers/columns.jsx';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openViewProfile, setOpenViewProfile] = useState(false);

  // Fetch teachers on component mount
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teachersAPI.get_teachers();
      const mapped = Array.isArray(response)
        ? response.map((s) => ({
            id: s.id,
            firstName: s.first_name,
            lastName: s.last_name,
            email: s.email ?? '',
            phone: s.phone ?? '',
            address: s.address ?? '',
            className: s.class_layout?.name ?? '',
            registrationDate: s.created_at ?? '',
            active: s.active ?? false,
          }))
        : [];
      setTeachers(mapped);
    } catch (e) {
      console.error('Failed to load teachers', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Handler to open the edit/create dialog
  const handleEdit = useCallback((record) => {
    setSelected(record);
    setOpenEditProfile(true);
  }, []);

  const handleView = useCallback((record) => {
    setSelected(record);
    setOpenViewProfile(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelected({ role: 'Teacher' }); // Start with a clean object for a new teacher
    setOpenEditProfile(true);
  }, []);

  // Handler for saving a teacher (both create and update)
  const handleSave = async (updated) => {
    try {
      const payload = {
        first_name: updated.firstName,
        last_name: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        active: updated.active,
      };

      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await teachersAPI.update_teacher(updated.id, payload);

      const mapped = {
        id: response.id,
        firstName: response.first_name,
        lastName: response.last_name,
        email: response.email ?? '',
        phone: response.phone ?? '',
        address: response.address ?? '',
        className: response.class_layout?.name ?? '',
        registrationDate: response.created_at ?? '',
        active: response.active ?? false,
      };

      setTeachers((prev) => prev.map((s) => (s.id === mapped.id ? mapped : s)));
    } catch (e) {
      console.error('Failed to save teacher', e);
      // Optionally show an error message to the user
    }
  };

  // Handler for deleting a teacher
  const handleDelete = useCallback(
    async (id) => {
      if (!id) return;
      // It's a good practice to add a confirmation dialog here
      try {
        await teachersAPI.delete_teacher(id);
        setTeachers((prev) => prev.filter((t) => t.id !== id));
        if (selected?.id === id) {
          setOpenEditProfile(false);
        }
      } catch (e) {
        console.error('Failed to delete teacher', e);
        // Optionally show an error message to the user
      }
    },
    [selected?.id]
  );

  const columns = useMemo(
    () => createColumns({ handleView, handleEdit, handleDelete }),
    [handleView, handleEdit, handleDelete]
  );

  return (
    <LayoutWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Docenten</h1>
            <p className="text-sm text-muted-foreground">
              Beheer hier alle docenten.
            </p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe docent
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="text-center py-5">Laden...</div>
            ) : (
              <DataTable columns={columns} data={teachers} />
            )}
          </CardContent>
        </Card>
      </div>

      <StudentViewProfileCard
        open={openViewProfile}
        onOpenChange={setOpenViewProfile}
        student={selected}
      />

      {/* The ProfileCard is used for both editing and creating */}
      <ProfileCard
        open={openEditProfile}
        onOpenChange={setOpenEditProfile}
        user={{ ...selected, role: 'Teacher' }}
        onSave={handleSave}
        onDelete={handleDelete}
        viewDateOnly={false}
      />
    </LayoutWrapper>
  );
}
