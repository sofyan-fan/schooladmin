// src/components/auth/RoleSelectionPage.jsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';
import PropTypes from 'prop-types';
import RoleIcon from './ui/RoleIcon';
// Assume you have a simple logo component
// import { AppLogo } from '@/components/layout/AppLogo';
import { Link } from 'react-router-dom';
function RoleSelectionPage({
  onSelect,
  onNext,
  selectedRole,
  rightPanelContent, // NEW: Prop to accept the right-side component
}) {
  const roles = [
    { id: 'student', label: 'Leerling' },
    { id: 'teacher', label: 'Docent' },
  ];

  return (
    // Main page container with a light background
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      {/* 1. Header Section */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-8">
        {/* <AppLogo /> */}
        <div className="text-2xl font-medium text-primary flex items-center gap-2">
          <GraduationCap className="size-10" />
          Maktab
        </div>
        <Button
          variant="link"
          onClick={() => {
            /* handle login navigation */
          }}
        >
          Inloggen
        </Button>
      </header>

      {/* 2. Main Content Section (centered card) */}
      <main className="flex items-center justify-center px-4 pt-10 sm:pt-16">
        <Card className="flex w-full max-w-4xl overflow-hidden bg-white shadow-lg dark:bg-gray-800">
          <CardContent className="grid w-full p-0 md:grid-cols-2">
            {/* Left: Form-like column (your original component logic) */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col text-left gap-2 mb-8">
                <h1 className="text-3xl font-bold text-primary">Registreren</h1>
                <p className="text-muted-foreground">
                  Kies je rol om door te gaan
                </p>
              </div>

              <fieldset className="space-y-4">
                <legend className="sr-only">Rolselectie</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <Button
                type="button"
                onClick={onNext}
                disabled={!selectedRole}
                className="mt-8 w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                Doorgaan
              </Button>

              {/* NEW: "Already have an account?" link */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Heb je al een account?{' '}
                <Link to="/login" className="p-0 h-auto text-blue-600">
                  Inloggen
                </Link>
              </p>
            </div>

            {/* Right: Illustration column */}
            <div className="relative hidden md:block">{rightPanelContent}</div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

RoleSelectionPage.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  selectedRole: PropTypes.string,
  rightPanelContent: PropTypes.node, // Can be any React node
};

RoleSelectionPage.defaultProps = {
  selectedRole: null,
  rightPanelContent: null,
};

export default RoleSelectionPage;
