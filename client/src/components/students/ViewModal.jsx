import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Calendar,
  ClipboardPen,
  Home,
  Mail,
  Mars,
  Phone,
  User,
  Venus,
} from 'lucide-react';
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

function ContactRow({ icon, value, href, multiline }) {
  if (!value) return null;

  const Tag = href ? 'a' : 'span';
  const tagProps = href
    ? {
        href,
        target: '_blank',
        rel: 'noreferrer',
        className:
          'text-base sm:text-lg hover:underline hover:text-accent transition-colors',
      }
    : { className: 'text-base sm:text-lg' };

  return (
    <li className="flex items-center gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center text-accent">
        {icon}
      </span>
      <Tag
        {...tagProps}
        className={`${tagProps.className} ${
          multiline ? 'break-words leading-relaxed' : 'truncate'
        }`}
      >
        {value}
      </Tag>
    </li>
  );
}

export default function ViewModal({ open, onOpenChange, student, onEdit }) {
  if (!student) return null;

  const status = student.status === 'Active' ? 'Actief' : 'Inactief';
  const fullName = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(' ');

  // Contact
  const email = student.email || null;
  const phone = student.phone || null;
  const addressParts = [
    student.address,
    student.postalCode,
    student.city,
  ].filter(Boolean);
  const address = addressParts.length ? addressParts.join(', ') : null;

  // Secondary
  const klas = student.className || null;
  const module = student.lessonPackage || null;
  const geboortedatum = formatDate(student.birthDate);
  const geplandeInschrijving = formatDate(student.registrationDate);
  const gender = student.gender || null;

  // Links
  const mailHref = email ? `mailto:${email}` : null;
  const telHref = phone ? `tel:${String(phone).replace(/\s/g, '')}` : null;
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`
    : null;

  const resultsHref = `/leerlingen/${student.id}/resultaten`;
  const packageHref = `/leerlingen/${student.id}/lespakket`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,980px)] sm:!max-w-[980px] p-0 overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-black/[0.04]">
        {/* thin accent header line */}
        {/* <div className="h-1 bg-accent/80" /> */}

        {/* Header */}
        <DialogHeader className="p-7 pb-4">
          <div className="flex items-center gap-5 min-w-0">
            <div className="size-20 shrink-0 rounded-full grid place-items-center bg-accent/10 ring-1 ring-accent/20 text-accent">
              <User className="size-8" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-3xl font-semibold leading-tight truncate">
                {fullName || 'Student'}
              </DialogTitle>

              {/* chips */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">
                  Student
                </Badge>
                {klas && (
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">
                    {klas}
                  </Badge>
                )}
                {module && (
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-sm">
                    Module {module}
                  </Badge>
                )}
                <Badge className="px-2.5 py-0.5 text-sm bg-accent/15 text-accent border border-accent/20">
                  {status}
                </Badge>

                {onEdit ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={onEdit}
                  >
                    Bewerken
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-7 pb-7">
          <div className="grid gap-8 sm:[grid-template-columns:minmax(0,1fr)_420px]">
            {/* Left: contact */}
            <section className="flex flex-col h-full">
              <ul className="space-y-5">
                <ContactRow
                  icon={<Mail size={25} />}
                  value={email}
                  href={mailHref}
                />
                <ContactRow
                  icon={<Phone size={25} />}
                  value={phone}
                  href={telHref}
                />
                <ContactRow
                  icon={<Home size={25} />}
                  value={address}
                  href={mapsHref}
                  multiline
                />
              </ul>

              <div className="mt-auto pt-6 flex flex-wrap gap-3">
                <Link to={packageHref}>
                  <Button
                    variant="outline"
                    className="rounded-full border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
                  >
                    Lespakket <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to={resultsHref}>
                  <Button variant="outline" className="rounded-full">
                    Resultaten
                  </Button>
                </Link>
              </div>
            </section>

            {/* Right: details */}
            <section className="sm:pl-8 sm:border-l sm:border-accent/20">
              <div className="space-y-7">
                <div className="space-y-2">
                  <p className="text-base font-semibold tracking-wide uppercase text-muted-foreground/90">
                    Geboortedatum
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center text-accent">
                      <Calendar size={25} />
                    </span>
                    <p className="text-xl font-medium">{geboortedatum}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-base font-semibold tracking-wide uppercase text-muted-foreground/90">
                    Geslacht
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center text-accent">
                      {gender === 'Man' ? (
                        <Mars size={25} />
                      ) : (
                        <Venus size={25} />
                      )}
                    </span>
                    <p className="text-xl font-medium">{gender}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-base font-semibold tracking-wide uppercase text-muted-foreground/90">
                    Geplande inschrijving
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center text-accent">
                      <ClipboardPen size={25} />
                    </span>
                    <p className="text-xl font-medium">
                      {geplandeInschrijving}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
