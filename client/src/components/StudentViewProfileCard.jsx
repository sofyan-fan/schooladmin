import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  GraduationCap,
  Home,
  Mail,
  Package,
  Phone,
  User,
} from 'lucide-react';

const displayValue = (value) => value || 'Niet opgegeven';

const formatDate = (dateString) => {
  if (!dateString) return 'Niet opgegeven';
  try {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const ProfileDetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-muted-foreground mt-1">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-text-default">{value}</p>
    </div>
  </div>
);

export default function StudentViewProfileCard({
  open,
  onOpenChange,
  student,
}) {
  if (!student) return null;

  const dutchStatus = student.status === 'Active' ? 'Actief' : 'Inactief';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {student.firstName} {student.lastName}
              </DialogTitle>
              <DialogDescription>
                Profiel details{' '}
                <Badge variant="outline" className="ml-2">
                  {dutchStatus}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 p-6">
          <div className="grid gap-4">
            <h3 className="font-semibold text-text-default">Contactgegevens</h3>
            <ProfileDetailItem
              icon={<Mail size={16} />}
              label="E-mailadres"
              value={displayValue(student.email)}
            />
            <ProfileDetailItem
              icon={<Phone size={16} />}
              label="Telefoonnummer"
              value={displayValue(student.phone)}
            />
            <ProfileDetailItem
              icon={<Home size={16} />}
              label="Adres"
              value={`${displayValue(student.address)}, ${displayValue(
                student.postalCode
              )} ${displayValue(student.city)}`}
            />
          </div>

          <hr className="border-border" />

          <div className="grid gap-4">
            <h3 className="font-semibold text-text-default">
              Persoonlijke Informatie
            </h3>
            <ProfileDetailItem
              icon={<Calendar size={16} />}
              label="Geboortedatum"
              value={formatDate(student.birthDate)}
            />
            <ProfileDetailItem
              icon={<User size={16} />}
              label="Geslacht"
              value={displayValue(student.gender)}
            />
          </div>

          <hr className="border-border" />

          <div className="grid gap-4">
            <h3 className="font-semibold text-text-default">
              Schoolinformatie
            </h3>
            <ProfileDetailItem
              icon={<GraduationCap size={16} />}
              label="Klas"
              value={displayValue(student.className)}
            />
            <ProfileDetailItem
              icon={<Package size={16} />}
              label="Lespakket"
              value={displayValue(student.lessonPackage)}
            />
            <ProfileDetailItem
              icon={<Clock size={16} />}
              label="Registratiedatum"
              value={formatDate(student.registrationDate)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted p-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Sluiten
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
