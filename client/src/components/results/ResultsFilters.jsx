// src/components/results/ResultsFilters.jsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AssessmentsLayoutToggle from './AssessmentsLayoutToggle';
import ViewToggle from './ViewToggle';

// --- Constants (unchanged) ---
const gradeRangeOptions = [
  { value: 'all', label: 'Alle cijfers' },
  { value: 'excellent', label: 'Uitstekend (8,0+)' },
  { value: 'good', label: 'Goed (6,5-7,9)' },
  { value: 'sufficient', label: 'Voldoende (5,5-6,4)' },
  { value: 'insufficient', label: 'Onvoldoende (<5,5)' },
];

const statusOptions = [
  { value: 'all', label: 'Alle statussen' },
  { value: 'completed', label: 'Voltooid' },
  { value: 'pending', label: 'In behandeling' },
  { value: 'not_started', label: 'Nog niet begonnen' },
];

const initialFilters = {
  search: '',
  class: 'all',
  subject: 'all',
  assessment: 'all',
  gradeRange: 'all',
  status: 'all',
};

// --- Helper Components (unchanged) ---
function FilterChip({ children, onClear }) {
  return (
    <Badge
      variant="secondary"
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
    >
      <span className="text-sm">{children}</span>
      <button
        type="button"
        onClick={onClear}
        className="grid h-5 w-5 place-items-center rounded-full hover:bg-foreground/10"
        aria-label="Filter verwijderen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </Badge>
  );
}

// --- Main ResultsFilters Component ---
const ResultsFilters = ({
  view,
  onViewChange,
  assessments,
  results,
  onFilterChange,
  classes,
  assessmentsLayout,
  onAssessmentsLayoutChange,
}) => {
  const [filters, setFilters] = useState(initialFilters);

  // --- Data transformation for Comboboxes (unchanged) ---
  const classOptions = useMemo(() => {
    const uniqueNames = [
      ...new Set(classes.map((c) => c.name).filter(Boolean)),
    ];
    return [
      { value: 'all', label: 'Alle klassen' },
      ...uniqueNames.map((name) => ({ value: name, label: name })),
    ];
  }, [classes]);

  const subjectOptions = useMemo(() => {
    const uniqueNames = [
      ...new Set(
        assessments.map((a) => a.subject?.subject?.name).filter(Boolean)
      ),
    ];
    return [
      { value: 'all', label: 'Alle vakken' },
      ...uniqueNames.map((name) => ({ value: name, label: name })),
    ];
  }, [assessments]);

  const assessmentOptions = useMemo(() => {
    const uniqueNames = [
      ...new Set(assessments.map((a) => a.name).filter(Boolean)),
    ];
    return [
      { value: 'all', label: 'Alle beoordelingen' },
      ...uniqueNames.map((name) => ({ value: name, label: name })),
    ];
  }, [assessments]);

  // --- Filtering logic (unchanged) ---
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

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(initialFilters);
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== 'all'
  );

  // --- Active chips logic (unchanged) ---
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.search.trim())
      chips.push({ key: 'search', label: `Zoek: “${filters.search.trim()}”` });
    if (filters.class !== 'all')
      chips.push({ key: 'class', label: `Klas: ${filters.class}` });
    if (view === 'assessments') {
      if (filters.subject !== 'all')
        chips.push({ key: 'subject', label: `Vak: ${filters.subject}` });
      if (filters.status !== 'all')
        chips.push({
          key: 'status',
          label: statusOptions.find((o) => o.value === filters.status)?.label,
        });
    } else {
      if (filters.assessment !== 'all')
        chips.push({
          key: 'assessment',
          label: `Toets: ${filters.assessment}`,
        });
      if (filters.gradeRange !== 'all')
        chips.push({
          key: 'gradeRange',
          label: gradeRangeOptions.find((o) => o.value === filters.gradeRange)
            ?.label,
        });
    }
    return chips;
  }, [filters, view]);

  return (
    // --- REFACTORED: Simplified outer container ---
    <div className="sticky top-16 z-20 space-y-3 p-0 ">
      {/* Row 1 - Main Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ">
        {/* --- REFACTORED: Left Group - Removed flex-1 for stable sizing --- */}
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                view === 'assessments'
                  ? 'Zoek op beoordeling, vak...'
                  : 'Zoek op leerling...'
              }
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full md:w-auto md:min-w-[150px] lg:min-w-[200px] bg-white h-9 pl-8"
            />
          </div>

          {view === 'assessments' ? (
            <>
              <ComboboxField
                items={classOptions}
                value={filters.class}
                onChange={(v) => handleFilterChange('class', v)}
                className="w-[calc(50%-0.25rem)] md:w-[180px] flex-shrink-0"
              />
              <ComboboxField
                items={subjectOptions}
                value={filters.subject}
                onChange={(v) => handleFilterChange('subject', v)}
                className="w-[calc(50%-0.25rem)] md:w-[180px] flex-shrink-0"
              />
              <ComboboxField
                items={statusOptions}
                value={filters.status}
                onChange={(v) => handleFilterChange('status', v)}
                className="w-full md:w-[180px] flex-shrink-0"
              />
            </>
          ) : (
            <>
              <ComboboxField
                items={classOptions}
                value={filters.class}
                onChange={(v) => handleFilterChange('class', v)}
                className="w-full sm:w-[180px] flex-shrink-0"
              />
              <ComboboxField
                items={assessmentOptions}
                value={filters.assessment}
                onChange={(v) => handleFilterChange('assessment', v)}
                className="w-full sm:w-[220px] flex-shrink-0"
              />
              <ComboboxField
                items={gradeRangeOptions}
                value={filters.gradeRange}
                onChange={(v) => handleFilterChange('gradeRange', v)}
                className="w-full sm:w-[220px] flex-shrink-0"
              />
            </>
          )}
        </div>

        {/* Right Group: Toggles (unchanged) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {view === 'assessments' && (
            <AssessmentsLayoutToggle
              layout={assessmentsLayout}
              onLayoutChange={onAssessmentsLayoutChange}
            />
          )}
          <ViewToggle view={view} onViewChange={onViewChange} />
        </div>
      </div>

      {/* Row 2: Active Chips (unchanged) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <FilterChip
                key={chip.key}
                onClear={() =>
                  handleFilterChange(
                    chip.key,
                    chip.key === 'search' ? '' : 'all'
                  )
                }
              >
                {chip.label}
              </FilterChip>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="rounded-full"
          >
            <X className="mr-2 h-4 w-4" />
            Alles wissen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResultsFilters;
