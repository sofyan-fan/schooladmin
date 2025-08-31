import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { useState } from 'react';

const ResultsFilters = ({ results, onFilteredResults }) => {
  const [filters, setFilters] = useState({
    search: '',
    subject: 'all',
    class: 'all',
    gradeRange: 'all',
  });

  // Get unique subjects and classes from results
  const uniqueSubjects = [
    ...new Set(results.map((result) => result.subject?.name).filter(Boolean)),
  ];
  const uniqueClasses = [
    ...new Set(
      results
        .map((result) => result.student?.class || 'Onbekend')
        .filter(Boolean)
    ),
  ];

  const applyFilters = (newFilters) => {
    const filtered = results.filter((result) => {
      // Search filter (student name or subject)
      const searchTerm = newFilters.search.toLowerCase();
      const studentName =
        `${result.student.first_name} ${result.student.last_name}`.toLowerCase();
      const subjectName = result.subject?.name?.toLowerCase() || '';
      const matchesSearch =
        searchTerm === '' ||
        studentName.includes(searchTerm) ||
        subjectName.includes(searchTerm);

      // Subject filter
      const matchesSubject =
        newFilters.subject === 'all' ||
        result.subject?.name === newFilters.subject;

      // Class filter
      const studentClass = result.student?.class || 'Onbekend';
      const matchesClass =
        newFilters.class === 'all' || studentClass === newFilters.class;

      // Grade range filter
      const grade = result.grade;
      let matchesGrade = true;
      if (newFilters.gradeRange === 'excellent') matchesGrade = grade >= 8;
      else if (newFilters.gradeRange === 'good')
        matchesGrade = grade >= 6.5 && grade < 8;
      else if (newFilters.gradeRange === 'sufficient')
        matchesGrade = grade >= 5.5 && grade < 6.5;
      else if (newFilters.gradeRange === 'insufficient')
        matchesGrade = grade < 5.5;

      return matchesSearch && matchesSubject && matchesClass && matchesGrade;
    });

    onFilteredResults(filtered);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      subject: 'all',
      class: 'all',
      gradeRange: 'all',
    };
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.subject !== 'all' ||
    filters.class !== 'all' ||
    filters.gradeRange !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Zoek student of vak..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Subject filter */}
        <Select
          value={filters.subject}
          onValueChange={(value) => handleFilterChange('subject', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alle vakken" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle vakken</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Class filter */}
        <Select
          value={filters.class}
          onValueChange={(value) => handleFilterChange('class', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alle klassen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle klassen</SelectItem>
            {uniqueClasses.map((className) => (
              <SelectItem key={className} value={className}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade range filter */}
        <Select
          value={filters.gradeRange}
          onValueChange={(value) => handleFilterChange('gradeRange', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Alle cijfers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle cijfers</SelectItem>
            <SelectItem value="excellent">Uitstekend (8.0+)</SelectItem>
            <SelectItem value="good">Goed (6.5-7.9)</SelectItem>
            <SelectItem value="sufficient">Voldoende (5.5-6.4)</SelectItem>
            <SelectItem value="insufficient">Onvoldoende (&lt;5.5)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Filters wissen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsFilters;
