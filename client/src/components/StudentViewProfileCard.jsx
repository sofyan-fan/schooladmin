import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRight, Calendar, Home, Mail, Phone, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const Row = ({ icon, label, value, clamp }) => {
  if (!value) return null;
  return (
    <li className="flex items-start gap-3">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={
            clamp
              ? 'text-lg font-medium break-words line-clamp-2'
              : 'text-lg font-medium truncate'
          }
        >
          {value}
        </p>
      </div>
    </li>
  );
};

export default function StudentViewProfileCard({
  open,
  onOpenChange,
  student,
  maxWidth = '900px',
  onEdit, // optional
}) {
  if (!student) return null;

  const status = student.status === 'Active' ? 'Actief' : 'Inactief';

  const fullName = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(' ');
  const email = student.email || null;
  const phone = student.phone || null;
  const addressParts = [
    student.address,
    student.postalCode,
    student.city,
  ].filter(Boolean);
  const address = addressParts.length ? addressParts.join(', ') : null;

  // try both shapes you have used
  const klasNaam = student.className ?? student.class_layout?.name ?? null;

  const lespakket = student.lesson_package || student.lessonPackage || null;
  const geboortedatum = formatDate(student.birthDate);
  const registratiedatum = formatDate(
    student.registrationDate || student.created_at
  );
  const gender = student.gender || null;

  const resultsHref = `/leerlingen/${student.id}/resultaten`;
  const packageHref = `/leerlingen/${student.id}/lespakket`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(94vw,900px)] p-0 overflow-hidden bg-white rounded-2xl sm:!max-h-[82vh]"
        maxWidth={maxWidth}
      >
        <DialogHeader className="p-6 pb-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={[
                  'size-16 shrink-0 rounded-full grid place-items-center bg-muted',
                  status === 'Actief'
                    ? 'ring-2 ring-emerald-200'
                    : 'ring-2 ring-muted-foreground/20',
                ].join(' ')}
                aria-label={`Status: ${status}`}
              >
                <User className="size-7 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-3xl font-semibold leading-tight truncate">
                  {fullName || 'Student'}
                </DialogTitle>

                {/* Pills under the name */}
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                    Student
                  </Badge>
                  {klasNaam && (
                    <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                      {klasNaam}
                    </Badge>
                  )}
                  {lespakket && (
                    <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                      Lespakket {lespakket}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={
                      status === 'Actief'
                        ? 'text-sm px-2.5 py-0.5 bg-emerald-50 text-emerald-700'
                        : 'text-sm px-2.5 py-0.5'
                    }
                  >
                    {status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Optional edit */}
            <div className="flex items-start sm:items-end">
              {onEdit ? (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  Bewerken
                </Button>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 pt-5">
          <div className="grid gap-8 sm:grid-cols-12">
            {/* Left column */}
            <section className="sm:col-span-7">
              <h3 className="text-base font-medium text-muted-foreground mb-3">
                Contactgegevens
              </h3>
              <ul className="space-y-3">
                <Row
                  icon={<Mail size={20} />}
                  label="E-mailadres"
                  value={email}
                />
                <Row
                  icon={<Phone size={20} />}
                  label="Telefoonnummer"
                  value={phone}
                />
                <Row
                  icon={<Home size={20} />}
                  label="Adres"
                  value={address}
                  clamp
                />
              </ul>

              {/* Quick links moved here, under Contactgegevens */}
            
            </section>

            {/* Right column */}
            <section className="sm:col-span-5 sm:border-l border-border/60 sm:pl-7">
              <div className="space-y-7">
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">
                    Persoonlijk
                  </h3>
                  <ul className="space-y-3">
                    <Row
                      icon={<Calendar size={20} />}
                      label="Geboortedatum"
                      value={geboortedatum}
                    />
                    <Row
                      icon={<User size={20} />}
                      label="Geslacht"
                      value={gender}
                    />
                  </ul>
                </div>

                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-2">
                    Registratiedatum
                  </h3>
                  <ul className="space-y-3">
                    <Row
                      icon={<Calendar size={20} />}
                      value={registratiedatum}
                    />
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
