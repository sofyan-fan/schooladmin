// src/components/auth/RoleSelection.jsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PropTypes from 'prop-types';
import RoleIcon from './RoleIcon';

function RoleSelection({
  onSelect,
  onNext,
  selectedRole,
  imageSrc = '/placeholder.svg',
  imageAlt = 'Illustratie voor rolselectie',
}) {
  const roles = [
    { id: 'student', label: 'Leerling' },
    { id: 'teacher', label: 'Docent' },
  ];

  return (
    <Card className="bg-transparent flex overflow-hidden p-0 w-full max-w-[750px] ">
      <CardContent className="bg-card grid p-0 md:grid-cols-2">
        {/* Left: form-like column */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <h1 className="text-2xl font-bold">Registreren</h1>
            <p className="text-muted-foreground text-balance">
              Kies je rol om door te gaan
            </p>
          </div>

          {/* Role options */}
          <fieldset className="space-y-4">
            <legend className="sr-only">Rolselectie</legend>
            <div className="flex flex-wrap gap-4">
              {roles.map((r) => (
                <RoleIcon
                  key={r.id}
                  role={r.id}
                  label={r.label}
                  selected={selectedRole === r.id}
                  onClick={() => onSelect(r.id)}
                />
              ))}
            </div>
          </fieldset>

          {/* Continue button */}
          <Button
            type="button"
            onClick={onNext}
            disabled={!selectedRole}
            className="w-full mt-6"
          >
            Doorgaan
          </Button>
        </div>

        {/* Right: image column */}
        <div className="bg-muted relative hidden md:block">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </CardContent>
    </Card>
  );
}

RoleSelection.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  selectedRole: PropTypes.string,
  imageSrc: PropTypes.string,
  imageAlt: PropTypes.string,
};

RoleSelection.defaultProps = {
  selectedRole: null,
  imageSrc: '/placeholder.svg',
  imageAlt: 'Illustratie voor rolselectie',
};

export default RoleSelection;
