import ResultCard from './ResultCard';

const CardsView = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Geen resultaten gevonden</p>
          <p className="text-sm">Er zijn nog geen resultaten beschikbaar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  );
};

export default CardsView;
