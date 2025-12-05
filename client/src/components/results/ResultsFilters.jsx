// src/components/results/ResultsFilters.jsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ComboboxField from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
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
  assessmentType: 'all',
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
  // results no longer used for internal filtering
  classes,
  assessmentsLayout,
  onAssessmentsLayoutChange,
  // Controlled filters
  filters,
  onFiltersChange,
}) => {
  // Fall back to internal state if not provided (for safety/back-compat)
  const [uncontrolledFilters, setUncontrolledFilters] = useState(initialFilters);
  const activeFilters = filters ?? uncontrolledFilters;

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

  // Controlled/uncontrolled update helpers
  const handleFilterChange = (key, value) => {
    if (onFiltersChange) {
      onFiltersChange({ ...activeFilters, [key]: value });
    } else {
      setUncontrolledFilters((prev) => ({ ...prev, [key]: value }));
    }
  };
  const clearFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(initialFilters);
    } else {
      setUncontrolledFilters(initialFilters);
    }
  };
  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v !== '' && v !== 'all'
  );

  // --- Active chips logic (unchanged) ---
  const activeChips = useMemo(() => {
    const chips = [];
    const f = activeFilters;
    if (f.search.trim())
      chips.push({ key: 'search', label: `Zoek: “${f.search.trim()}”` });
    if (f.class !== 'all')
      chips.push({ key: 'class', label: `Klas: ${f.class}` });
    if (f.assessmentType && f.assessmentType !== 'all') {
      chips.push({
        key: 'assessmentType',
        label:
          f.assessmentType === 'Test'
            ? 'Soort: Toetsen'
            : f.assessmentType === 'Exam'
              ? 'Soort: Examens'
              : `Soort: ${f.assessmentType}`,
      });
    }
    if (view === 'assessments') {
      if (f.subject !== 'all')
        chips.push({ key: 'subject', label: `Vak: ${f.subject}` });
      if (f.status !== 'all')
        chips.push({
          key: 'status',
          label: statusOptions.find((o) => o.value === f.status)?.label,
        });
    } else {
      if (f.assessment !== 'all')
        chips.push({
          key: 'assessment',
          label: `Beoordeling: ${f.assessment}`,
        });
      if (f.gradeRange !== 'all')
        chips.push({
          key: 'gradeRange',
          label: gradeRangeOptions.find((o) => o.value === f.gradeRange)?.label,
        });
    }
    return chips;
  }, [activeFilters, view]);

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
              value={activeFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full md:w-auto md:min-w-[150px] lg:min-w-[200px] bg-white h-9 pl-8"
            />
          </div>

          {view === 'assessments' ? (
            <>
              <ComboboxField
                items={classOptions}
                value={activeFilters.class}
                onChange={(v) => handleFilterChange('class', v)}
                className="w-[calc(50%-0.25rem)] md:w-[180px] flex-shrink-0"
              />
              <ComboboxField
                items={subjectOptions}
                value={activeFilters.subject}
                onChange={(v) => handleFilterChange('subject', v)}
                className="w-[calc(50%-0.25rem)] md:w-[180px] flex-shrink-0"
              />
              <ComboboxField
                items={statusOptions}
                value={activeFilters.status}
                onChange={(v) => handleFilterChange('status', v)}
                className="w-full md:w-[180px] flex-shrink-0"
              />
            </>
          ) : (
            <>
              <ComboboxField
                items={classOptions}
                value={activeFilters.class}
                onChange={(v) => handleFilterChange('class', v)}
                className="w-full sm:w-[180px] flex-shrink-0"
              />
              <ComboboxField
                items={assessmentOptions}
                value={activeFilters.assessment}
                onChange={(v) => handleFilterChange('assessment', v)}
                className="w-full sm:w-[220px] flex-shrink-0"
              />
              <ComboboxField
                items={gradeRangeOptions}
                value={activeFilters.gradeRange}
                onChange={(v) => handleFilterChange('gradeRange', v)}
                className="w-full sm:w-[220px] flex-shrink-0"
              />
            </>
          )}
        </div>

        {/* Right Group: Assessment type filter + Toggles */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:flex flex-col items-start gap-1">

            <RadioGroup
              value={activeFilters.assessmentType}
              onValueChange={(v) => handleFilterChange('assessmentType', v)}
              className="flex gap-2 mt-0"
            >
              <Label
                htmlFor="results-type-all"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border h-9 px-4 text-sm font-medium transition-colors cursor-pointer',
                  activeFilters.assessmentType === 'all'
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <RadioGroupItem
                  value="all"
                  id="results-type-all"
                  className="sr-only"
                />
                Alle
              </Label>
              <Label
                htmlFor="results-type-test"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border h-9 px-4 text-sm font-medium transition-colors cursor-pointer',
                  activeFilters.assessmentType === 'Test'
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <RadioGroupItem
                  value="Test"
                  id="results-type-test"
                  className="sr-only"
                />
                Toetsen
              </Label>
              <Label
                htmlFor="results-type-exam"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border h-9 px-4 text-sm font-medium transition-colors cursor-pointer',
                  activeFilters.assessmentType === 'Exam'
                    ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <RadioGroupItem
                  value="Exam"
                  id="results-type-exam"
                  className="sr-only"
                />
                Examens
              </Label>
            </RadioGroup>
          </div>

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
