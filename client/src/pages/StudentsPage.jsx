import studentAPI from '@/apis/students/studentAPI';
import ProfileCard from '@/components/general/ProfileCard'; 
import StudentViewProfileCard from '@/components/StudentViewProfileCard'; 
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createColumns } from './students/columns';

export default function StudentsPage() {

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  const [openEditProfile, setOpenEditProfile] = useState(false); 
  
  const [openViewProfile, setOpenViewProfile] = useState(false); 

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
              status: s.enrollment_status ? 'Active' : 'Inactive',
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

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEditProfile(true);
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenViewProfile(true); 
  };

  const handleSave = (updated) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
  };
  
  const handleDelete = (id) => {
    if (!id) return;
    // NOTE: You should add a confirmation dialog here!
    alert(`Verwijder ${id}`);
    setStudents((prev) => prev.filter((s) => s.id !== id));

    // Close any open modals for the deleted user
    if (selected?.id === id) {
      setOpenEditProfile(false);
      setOpenViewProfile(false);
    }
  };

  // --- COLUMN DEFINITION ---
  const columns = useMemo(
    () => createColumns({ handleView, handleEdit, handleDelete }),
    []
  );

  // --- RENDER ---
  return (
    <LayoutWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Leerlingen
            </h1>
            <p className="text-sm text-muted-foreground">
              Beheer hier alle leerlingen.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe leerling
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leerlingenoverzicht</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">Laden...</div>
            ) : (
              <DataTable columns={columns} data={students} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* RENDER THE NEW VIEW MODAL */}
      <StudentViewProfileCard
        open={openViewProfile}
        onOpenChange={setOpenViewProfile}
        student={selected}
      />

      {/* Your old ProfileCard can now be dedicated to editing */}
      <ProfileCard
        open={openEditProfile}
        onOpenChange={setOpenEditProfile}
        user={selected}
        onSave={handleSave}
        onDelete={handleDelete}
        viewDateOnly={false} // Assuming this is for an edit form
      />
    </LayoutWrapper>
  );
}