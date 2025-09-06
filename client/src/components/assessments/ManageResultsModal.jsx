import classAPI from '@/apis/classAPI';
import resultAPI from '@/apis/resultAPI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ManageResultsModal({
  open,
  onOpenChange,
  assessment,
  onResultsSaved,
}) {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({}); // studentId -> result mapping
  const [originalResults, setOriginalResults] = useState({}); // Track original results for deletion
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!assessment) return;

      setIsLoading(true);
      try {
        // 1. Fetch class details to get the list of students
        const classDetails = await classAPI.get_class(assessment.class_id);
        setStudents(classDetails.students || []);

        // 2. Fetch all results and filter for the current assessment
        const allResults = await resultAPI.get_results();
        const assessmentResults = allResults.filter(
          (r) => r.assessment_id === assessment.id
        );

        // 3. Convert array of results to a map for easy lookup
        const resultsMap = assessmentResults.reduce((acc, result) => {
          acc[result.student_id] = result;
          return acc;
        }, {});
        setResults(resultsMap);
        setOriginalResults({ ...resultsMap }); // Store original state for comparison
      } catch (error) {
        console.error('Failed to fetch data for results modal', error);
        toast.error('Kon de benodigde gegevens niet ophalen.');
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, assessment]);

  const handleGradeChange = (studentId, grade) => {
    // Allows clearing the input - this should mark the result for deletion
    if (grade === '') {
      setResults((prevResults) => {
        const newResults = { ...prevResults };
        // If there was an original result, mark it for deletion by removing it entirely
        delete newResults[studentId];
        return newResults;
      });
      return;
    }

    const newGrade = parseFloat(grade);
    if (isNaN(newGrade) || newGrade < 1 || newGrade > 10) return;

    setResults((prevResults) => ({
      ...prevResults,
      [studentId]: {
        ...prevResults[studentId],
        grade: newGrade,
        student_id: studentId,
        assessment_id: assessment.id,
        date: assessment.date || new Date().toISOString(),
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const promises = [];

      // 1. Handle creates and updates
      Object.values(results).forEach((result) => {
        if (result.id) {
          // This result already exists, update it
          promises.push(resultAPI.update_result(result));
        } else {
          // This is a new result, create it
          promises.push(resultAPI.add_result(result));
        }
      });

      // 2. Handle deletions - find results that were in original but not in current
      Object.keys(originalResults).forEach((studentId) => {
        const originalResult = originalResults[studentId];
        const currentResult = results[studentId];

        // If the original result had an ID but is no longer in current results, delete it
        if (originalResult && originalResult.id && !currentResult) {
          promises.push(resultAPI.delete_result(originalResult.id));
        }
      });

      await Promise.all(promises);
      toast.success('Resultaten succesvol opgeslagen!');

      // Notify parent component that results were saved
      if (onResultsSaved) {
        onResultsSaved();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save results', error);
      toast.error('Opslaan van resultaten mislukt.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!assessment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Resultaten voor: {assessment.name}</DialogTitle>
          <DialogDescription>
            Voer hier de cijfers in voor de leerlingen in klas{' '}
            <strong>{assessment.class}</strong>. De toets vond plaats op{' '}
            {new Date(assessment.date).toLocaleDateString()}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leerling</TableHead>
                <TableHead className="w-40">Cijfer</TableHead>
                <TableHead className="w-48">Status</TableHead>
                <TableHead className="text-right w-40">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan="4" className="h-48 text-center">
                    Laden...
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => {
                  const result = results[student.id];
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          max="10"
                          className="w-24"
                          placeholder="-"
                          value={result?.grade ?? ''}
                          onChange={(e) =>
                            handleGradeChange(student.id, e.target.value)
                          }
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm ${
                            result?.grade
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {result?.grade ? 'Ingevoerd' : 'Nog niet ingevoerd'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* TODO: Edit/Delete buttons */}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
