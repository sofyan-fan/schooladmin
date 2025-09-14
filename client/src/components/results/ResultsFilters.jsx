import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ViewToggle from './ViewToggle';

const ResultsFilters = ({
  view,
  onViewChange,
  assessments,
  results,
  onFilterChange,
  classes,
}) => {
  const [filters, setFilters] = useState({
    search: '',
    class: 'all',
    subject: 'all',
    assessment: 'all',
    gradeRange: 'all',
    status: 'all',
  });

  const uniqueSubjects = useMemo(() => {
    return [
      ...new Set(
        assessments.map((a) => a.subject?.subject?.name).filter(Boolean)
      ),
    ];
  }, [assessments]);

  const uniqueClasses = useMemo(() => {
    return [...new Set(classes.map((c) => c.name).filter(Boolean))];
  }, [classes]);

  const uniqueAssessments = useMemo(() => {
    return [...new Set(assessments.map((a) => a.name).filter(Boolean))];
  }, [assessments]);

  useEffect(() => {
    let filteredAssessments = assessments;
    let filteredResults = results;

    if (view === 'assessments') {
      filteredAssessments = assessments.filter((assessment) => {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch =
          searchTerm === '' ||
          assessment.name.toLowerCase().includes(searchTerm) ||
          assessment.subject?.subject?.name.toLowerCase().includes(searchTerm);
        const matchesClass =
          filters.class === 'all' ||
          assessment.class_layout?.name === filters.class;
        const matchesSubject =
          filters.subject === 'all' ||
          assessment.subject?.subject?.name === filters.subject;
        const gradedStudents = assessment.results?.length || 0;
        const totalStudents = assessment.class_layout?.student_count || 0;
        let matchesStatus = true;
        if (filters.status === 'pending')
          matchesStatus = gradedStudents < totalStudents && gradedStudents > 0;
        else if (filters.status === 'not_started')
          matchesStatus = gradedStudents === 0;
        else if (filters.status === 'completed')
          matchesStatus = gradedStudents === totalStudents;
        return matchesSearch && matchesClass && matchesSubject && matchesStatus;
      });
    }

    if (view === 'students') {
      filteredResults = results.filter((result) => {
        const searchTerm = filters.search.toLowerCase();
        const studentName =
          `${result.student.first_name} ${result.student.last_name}`.toLowerCase();
        const matchesSearch =
          searchTerm === '' || studentName.includes(searchTerm);
        const matchesClass =
          filters.class === 'all' ||
          result.student.class_layout?.name === filters.class;
        const matchesAssessment =
          filters.assessment === 'all' ||
          result.assessment_name === filters.assessment;
        const grade = result.grade;
        let matchesGrade = true;
        if (filters.gradeRange === 'excellent') matchesGrade = grade >= 8;
        else if (filters.gradeRange === 'good')
          matchesGrade = grade >= 6.5 && grade < 8;
        else if (filters.gradeRange === 'sufficient')
          matchesGrade = grade >= 5.5 && grade < 6.5;
        else if (filters.gradeRange === 'insufficient')
          matchesGrade = grade < 5.5;
        return (
          matchesSearch && matchesClass && matchesAssessment && matchesGrade
        );
      });
    }

    onFilterChange({ filteredAssessments, filteredResults });
  }, [filters, assessments, results, view, onFilterChange]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      class: 'all',
      subject: 'all',
      assessment: 'all',
      gradeRange: 'all',
      status: 'all',
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== 'all'
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-grow w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {view === 'assessments' && (
            <>
              <Input
                placeholder="Zoek beoordelingen..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Select
                value={filters.class}
                onValueChange={(v) => handleFilterChange('class', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle klassen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {uniqueClasses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.subject}
                onValueChange={(v) => handleFilterChange('subject', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle vakken" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle vakken</SelectItem>
                  {uniqueSubjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(v) => handleFilterChange('status', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                  <SelectItem value="pending">In behandeling</SelectItem>
                  <SelectItem value="not_started">Nog niet begonnen</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {view === 'students' && (
            <>
              <Input
                placeholder="Zoek leerlingnaam..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Select
                value={filters.class}
                onValueChange={(v) => handleFilterChange('class', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle klassen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {uniqueClasses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.assessment}
                onValueChange={(v) => handleFilterChange('assessment', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle beoordelingen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle beoordelingen</SelectItem>
                  {uniqueAssessments.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.gradeRange}
                onValueChange={(v) => handleFilterChange('gradeRange', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle cijfers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle cijfers</SelectItem>
                  <SelectItem value="excellent">Uitstekend (8,0+)</SelectItem>
                  <SelectItem value="good">Goed (6,5-7,9)</SelectItem>
                  <SelectItem value="sufficient">
                    Voldoende (5,5-6,4)
                  </SelectItem>
                  <SelectItem value="insufficient">
                    Onvoldoende (&lt;5,5)
                  </SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
      {hasActiveFilters && (
        <div className="flex justify-end pt-3">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Filters wissen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsFilters;
