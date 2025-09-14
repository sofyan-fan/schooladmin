import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowRight, Calendar, ClipboardPenLine, Home, Mail, Phone, Mars, Venus, User } from 'lucide-react';
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
    <li className="flex items-center gap-3 ">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-accent/8 text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        {label ? (
          <p className="text-sm text-muted-foreground">{label}</p>
        ) : null}
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

const HeaderWithDot = ({ children }) => (
  <h3 className="mb-3.5 flex items-center gap-2 text-base font-medium">
    <span className="inline-block size-2 rounded-full bg-accent" />
    <span className="text-muted-foreground">{children}</span>
  </h3>
);

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
        {/* Accent top stripe */}
        <div className="h-1.5 bg-gradient-to-r from-accent to-primary/60" />

        {/* Header */}
        <DialogHeader className="p-7 pb-0">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-5 min-w-0">
              <div
                className={[
                  'size-18 shrink-0 rounded-full grid place-items-center bg-accent/8 ring-2 ring-accent/20',
                ].join(' ')}
                aria-label={`Status: ${status}`}
              >
                <User className="size-8 text-accent" />
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
                        ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/20'
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
              <HeaderWithDot>Contactgegevens</HeaderWithDot>
              <ul className="space-y-3">
                <Row
                  icon={<Mail size={21} />}
                  label="E-mailadres"
                  value={email}
                />
                <Row
                  icon={<Phone size={21} />}
                  label="Telefoonnummer"
                  value={phone}
                />
                <Row
                  icon={<Home size={21} />}
                  label="Adres"
                  value={address}
                  clamp
                />
              </ul>

              {/* Quick links as ghost chips */}
              <div className="mt-6">
             
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={packageHref}
                    className="group rounded-lg px-3 py-2 text-accent hover:bg-accent/10 transition-colors flex items-center gap-1"
                  >
                    Lespakket
                    <ArrowRight className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                  </Link>
                  <Link
                    to={resultsHref}
                    className="group rounded-lg px-3 py-2 text-accent hover:bg-accent/10 transition-colors flex items-center gap-1"
                  >
                    Resultaten
                    <ArrowRight className="h-4 w-4 opacity-80 group-hover:opacity-100" />
                  </Link>
                </div>
              </div>
            </section>

            {/* Right */}
            <section className="sm:col-span-5 sm:border-l-2 sm:border-accent/10 sm:pl-7">
              <div className="space-y-7">
                <div>
                  <HeaderWithDot>Persoonlijk</HeaderWithDot>
                  <ul className="space-y-3">
                    <Row
                      icon={<Calendar size={21} />}
                      label="Geboortedatum"
                      value={geboortedatum}
                    />
                    <Row  
                      icon={gender === 'Man' ? <Mars size={21} /> : <Venus size={21} />}
                      label="Geslacht"
                      value={gender}
                    />
                  </ul>
                </div>

                <div>
                  <HeaderWithDot>Registratiedatum</HeaderWithDot>
                  <ul className="space-y-3">
                    <Row
                      icon={<ClipboardPenLine size={21} />}
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
