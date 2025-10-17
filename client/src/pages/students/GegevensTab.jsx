import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Home, LifeBuoy, Mail, MapPin, Phone, User } from 'lucide-react';

export default function GegevensTab({ student, studentStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Studentgegevens</CardTitle>
        <CardDescription>Volledige contact- en adresgegevens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <User className="h-4 w-4" /> Naam
            </div>
            <div className="text-sm font-medium">
              {studentStats.fullName || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> E-mail
            </div>
            <div className="text-sm font-medium">
              {student?.email || student?.parent_email || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <Phone className="h-4 w-4" /> Telefoon
            </div>
            <div className="text-sm font-medium">{student?.phone || '—'}</div>
          </div>

          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <Home className="h-4 w-4" /> Adres
            </div>
            <div className="text-sm font-medium">
              {[student?.address, student?.postalCode, student?.city]
                .filter(Boolean)
                .join(', ') || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Woonplaats
            </div>
            <div className="text-sm font-medium">{student?.city || '—'}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <LifeBuoy className="h-4 w-4" /> SOS-nummer
            </div>
            <div className="text-sm font-medium">
              {student?.sosnumber || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
              <User className="h-4 w-4" /> Ouder/verzorger
            </div>
            <div className="text-sm font-medium">
              {student?.parent_name || '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
