import resultAPI from '@/apis/resultAPI';
import CardsView from '@/components/results/CardsView';
import { columns } from '@/components/results/columns';
import ExportButtons from '@/components/results/ExportButtons';
import ResultsFilters from '@/components/results/ResultsFilters';
import ViewToggle from '@/components/results/ViewToggle';
import PageHeader from '@/components/shared/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { BarChart } from 'lucide-react';
import { useEffect, useState } from 'react';

const ResultsPage = () => {
  const [allResults, setAllResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [view, setView] = useState('cards'); // Default to cards view

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await resultAPI.get_results();
        setAllResults(data);
        setFilteredResults(data); // Initially show all results
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };

    fetchResults();
  }, []);

  const handleViewChange = (newView) => {
    if (newView) {
      setView(newView);
    }
  };

  const handleFilteredResults = (filtered) => {
    setFilteredResults(filtered);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Resultaten"
        icon={<BarChart className="size-9" />}
        description="Resultaten van de leerlingen"
      />

      {/* Filters */}
      <ResultsFilters
        results={allResults}
        onFilteredResults={handleFilteredResults}
      />

      {/* View Toggle, Results Count, and Export */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {filteredResults.length} van {allResults.length} resultaten
        </div>
        <div className="flex items-center gap-3">
          <ExportButtons
            results={filteredResults}
            filteredCount={filteredResults.length}
            totalCount={allResults.length}
          />
          <ViewToggle view={view} onViewChange={handleViewChange} />
        </div>
      </div>

      {/* Content based on view */}
      {view === 'cards' ? (
        <CardsView results={filteredResults} />
      ) : (
        <DataTable columns={columns} data={filteredResults} />
      )}
    </div>
  );
};

export default ResultsPage;
