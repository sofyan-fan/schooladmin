import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AanwezigheidTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alle Aanwezigheidsregistraties</CardTitle>
        <CardDescription>
          Gedetailleerd overzicht van alle registraties.
        </CardDescription>
      </CardHeader>
      <CardContent>{/* TODO: add absence table here */}</CardContent>
    </Card>
  );
}
