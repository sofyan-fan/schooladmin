import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const EmptyState = () => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Geen lessen gevonden</h3>
        <p className="text-muted-foreground mb-4">
          Er zijn nog geen roosters/lessen aangemaakt. Maak eerst lessen aan
          voordat je afwezigheid kunt beheren.
        </p>
        <Button
          onClick={() => (window.location.href = '/rooster')}
          className="mx-auto"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Ga naar Rooster Beheer
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
