import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Home, Mail, Phone, User } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
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

export default function ViewModal({ open, onOpenChange, teacher, onEdit }) {
  if (!teacher) return null;

  const status = teacher.active ? 'Actief' : 'Inactief';

  const fullName = [teacher.firstName, teacher.lastName]
    .filter(Boolean)
    .join(' ');
  const email = teacher.email || null;
  const phone = teacher.phone || null;
  const address = teacher.address || null;

  const klas = teacher.className || null;
  // const registratiedatum = formatDate(teacher.registrationDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,500px)] sm:!max-w-[900px] p-0 overflow-hidden bg-white rounded-2xl">
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
                  {fullName || 'Docent'}
                </DialogTitle>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                    Docent
                  </Badge>
                  {klas && (
                    <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                      {klas}
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

        <div className="p-7 pt-6 max-h-[75vh] overflow-y-auto [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:border-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25">
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
          </section>

          {/* <section className="sm:col-span-5 sm:border-l border-border/60 sm:pl-7">
              <div className="space-y-7">
                <div>
                  <h3 className="text-base font-medium text-muted-foreground mb-1">
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
            </section> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
