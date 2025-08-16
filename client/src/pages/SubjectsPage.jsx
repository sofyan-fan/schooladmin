import subjectAPI from '@/apis/subjects/subjectAPI';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import SubjectModal from './../components/subjects/SubjectModal';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setLoading(true);
    subjectAPI
      .get_subjects()
      .then((data) => setSubjects(data))
      .catch(() => setApiError('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);


  const handleSaveSubject = async () => {
    setLoading(true);
    try {
      const updated = await subjectAPI.get_subjects();
      setSubjects(updated);
      console.log('updated:', updated);
    } catch {
      setApiError('Failed to refresh subjects');
    } finally {
      setLoading(false);
    }
  };
  console.log(subjects);

  return (
    <LayoutWrapper>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Vakkenbibliotheek</h1>
          <Button
            className="cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Vak Toevoegen
          </Button>
          <SubjectModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSave={handleSaveSubject}
          />
        </div>
        {loading && (
          <div className="text-gray-500 mb-4">Loading subjects...</div>
        )}
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
                  <TableCell>
                    {Array.isArray(subject.levels)
                      ? subject.levels.join(', ')
                      : ''}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(subject.materials)
                      ? subject.materials.join(', ')
                      : ''}
                  </TableCell>
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
