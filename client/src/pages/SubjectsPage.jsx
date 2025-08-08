import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import SubjectModal from './../components/subjects/SubjectModal';
import subjectApi from '@/apis/subjects/subjectAPI';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Fetch subjects from backend
  useEffect(() => {
    setLoading(true);
    subjectApi.get_subjects()
      .then(data => setSubjects(data))
      .catch(() => setApiError("Failed to load subjects"))
      .finally(() => setLoading(false));
  }, []);

  // When a subject is saved, re-fetch the subjects
  const handleSaveSubject = async () => {
    setLoading(true);
    try {
      const updated = await subjectApi.get_subjects();
      setSubjects(updated);
    } catch {
      setApiError("Failed to refresh subjects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Vakkenbibliotheek</h1>
          <Button className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Vak Toevoegen
          </Button>
          <SubjectModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSave={handleSaveSubject}
          />
        </div>
        {loading && <div className="text-gray-500 mb-4">Loading subjects...</div>}
        {apiError && <div className="text-red-500 mb-4">{apiError}</div>}
        <div className="border rounded-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Levels</TableHead>
                <TableHead>Materials</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.levels.join(', ')}</TableCell>
                  <TableCell>{subject.materials.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default SubjectsPage;
