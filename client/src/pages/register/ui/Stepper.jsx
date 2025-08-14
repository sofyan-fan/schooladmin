import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

function Stepper({ step, role }) {
  const studentSteps = [
    'Account',
    'Gegevens Leerling',
    'Gegevens Ouder',
    'Inschrijving',
  ];
  const teacherSteps = ['Account', 'Persoonlijke Gegevens'];
  const steps = role === 'student' ? studentSteps : teacherSteps;

  return (
    <div className="flex flex-col gap-8 fixed">
      {steps.map((label, i) => {
        const isActive = i === step;
        const isCompleted = i < step;
        return (
          <div key={label} className="flex items-start gap-4">
            <div
              className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{`Stap ${
                i + 1
              }`}</p>
              <p
                className={`font-semibold ${
                  !isActive && !isCompleted
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {label}
              </p>
            </div>
          </div>
        );
      })}
      <p className="mt-4 text-center text-sm text-muted-foreground">
              Heb je al een account?{' '}
              <Link className="underline" to="/login">
                Log hier in
              </Link>
            </p>
    </div>
  );
}

Stepper.propTypes = {
  step: PropTypes.number.isRequired,
  role: PropTypes.string.isRequired,
};

export default Stepper;
