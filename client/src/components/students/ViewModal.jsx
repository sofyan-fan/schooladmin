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
  ClipboardPen,
  Calendar,
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
          'text-xl hover:underline hover:text-accent transition-colors',
      }
    : { className: 'text-xl' };

  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-accent">{icon}</span>
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
  const addressParts = [student.address, student.postalCode, student.city].filter(Boolean);
  const address = addressParts.length ? addressParts.join(', ') : null;

  // Secondary
  const klas = student.className || null;
  const module = student.lessonPackage || null;
  const geboortedatum = formatDate(student.birthDate);
  const registratiedatum = formatDate(student.registrationDate);
  const gender = student.gender || null;

  // Links
  const mailHref = email ? `mailto:${email}` : null;
  const telHref = phone ? `tel:${String(phone).replace(/\s/g, '')}` : null;
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  const resultsHref = `/leerlingen/${student.id}/resultaten`;
  const packageHref = `/leerlingen/${student.id}/lespakket`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,950px)] sm:!max-w-[1000px] border border-primary p-0 overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-black/[0.04]">
        <DialogHeader className="p-7 pb-2">
          <div className="flex items-center gap-6 min-w-0">
            <div className="size-24 shrink-0 rounded-full grid place-items-center bg-accent/12 ring-1 ring-accent/20 text-accent">
              <User className="size-10" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-4xl font-medium leading-tight truncate">
                {fullName || 'Student'}
              </DialogTitle>

              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  Student
                </Badge>
                {klas && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    {klas}
                  </Badge>
                )}
                {module && (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    Module {module}
                  </Badge>
                )}
                <Badge className="px-3 py-1 text-sm bg-accent/18 text-accent border border-accent/25">
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

        <div className="px-7 pb-7 pt-4">
          <div className="grid gap-8 sm:[grid-template-columns:minmax(0,1fr)_440px]">
            {/* Left: contact (flex column so actions can sit at the bottom) */}
            <section className="flex min-h-full flex-col">
              <ul className="space-y-6">
                <ContactRow icon={<Mail size={25} />} value={email} href={mailHref} />
                <ContactRow icon={<Phone size={25} />} value={phone} href={telHref} />
                <ContactRow
                  icon={<Home size={25} />}
                  value={address}
                  href={mapsHref}
                  multiline
                />
              </ul>

              {/* spacer pushes actions down when the right column is taller */}
              <div className="flex-1" />

              {/* Actions: identical styling */}
              <div className="pt-6 flex flex-wrap gap-4">
                <Link to={packageHref}>
                  <Button
                    variant="outline"
                    className="rounded-full  text-accent px-6 py-5 text-lg hover:bg-accent/10 hover:text-accent"
                  >
                    Lespakket
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to={resultsHref}>
                  <Button
                    variant="outline"
                    className="rounded-full  text-accent px-6 py-5 text-lg hover:bg-accent/10 hover:text-accent"
                  >
                    Resultaten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </section>

            {/* Right: details */}
            <section className="sm:pl-8 sm:border-l-2 sm:border-accent/25">
              <div className="space-y-10">
                <div className="mb-8">
                  <p className="text-base font-semibold tracking-wide uppercase text-muted-foreground">
                    Geboortedatum
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-accent">
                      <Calendar size={25} />
                    </span>
                    <p className="text-xl font-normal">{geboortedatum}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-base font-semibold tracking-wide uppercase text-muted-foreground">
                    Geslacht
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-accent">
                      {gender === 'Man' ? <Mars size={25} /> : <Venus size={25} />}
                    </span>
                    <p className="text-xl font-normal">{gender}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-base font-semibold tracking-wide uppercase text-muted-foreground">
                    Registratiedatum
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-accent">
                      <ClipboardPen size={25} />
                    </span>
                    <p className="text-xl font-normal">{registratiedatum}</p>
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
