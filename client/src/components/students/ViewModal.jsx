import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
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

export default function ViewModal({ open, onOpenChange, student, onEdit }) {
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

  const klas = student.className || null;
  const module = student.lessonPackage || null;
  const geboortedatum = formatDate(student.birthDate);
  const registratiedatum = formatDate(student.registrationDate);
  const gender = student.gender || null;


  const resultsHref = `/leerlingen/${student.id}/resultaten`;
  const packageHref = `/leerlingen/${student.id}/lespakket`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Ensure width overrides global sm:max-w-lg and keep corners clipped */}
      <DialogContent className="w-[min(94vw,900px)] sm:!max-w-[900px] p-0 overflow-hidden bg-white rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-7 pb-0">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-5 min-w-0">
              <div
                className={[
                  'size-18 shrink-0 rounded-full grid place-items-center bg-muted',
                  status === 'Actief'
                    ? 'ring-2 ring-emerald-200'
                    : 'ring-2 ring-muted-foreground/20',
                ].join(' ')}
                aria-label={`Status: ${status}`}
              >
                <User className="size-8 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-3xl font-semibold leading-tight truncate">
                  {fullName || 'Student'}
                </DialogTitle>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                    Student
                  </Badge>
                  {klas && (
                    <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                      {klas}
                    </Badge>
                  )}
                  {module && (
                    <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                      Module {module}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={[
                      'text-sm px-2.5 py-0.5',
                      status === 'Actief'
                        ? 'bg-emerald-50 text-emerald-700'
                        : '',
                    ].join(' ')}
                  >
                    {status}
                  </Badge>
                </div>
              </div>
            </div>

            {onEdit ? (
              <Button size="sm" variant="outline" onClick={onEdit}>
                Bewerken
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        {/* Body with scroll inside, keep rounded corners clean */}
        <div className="p-7 pt-6 max-h-[75vh] overflow-y-auto [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:border-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25">
          <div className="grid gap-8 sm:grid-cols-12">
            {/* Left */}
            <section className="sm:col-span-7">
              <h3 className="text-base font-medium text-muted-foreground mb-3.5">
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
              <div className="mt-8">
                <h3 className="text-base font-medium text-muted-foreground mb-1">
                  Snel naar
                </h3>
                <div className="flex items-center  space-y-2 text-sm gap-3">
                    <Link
                      to={packageHref}
                      className="text-green-700 hover:underline flex items-center gap-0.5 mb-0"
                    >
                      Lespakket 
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to={resultsHref}
                      className="text-green-700 hover:underline flex items-center gap-0.5"
                    >
                      Resultaten
                      <ArrowRight size={16} />
                    </Link>
                  
                </div>
              </div>
            </section>

            {/* Right */}
            <section className="sm:col-span-5 sm:border-l border-border/60 sm:pl-7">
              <div className="space-y-7">
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-3.5">
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
                  <h3 className="text-base font-medium text-muted-foreground mb-1">
                    Schoolinformatie
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
