import PropTypes from 'prop-types';

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
    <div className="overflow-x-auto pb-4 -mb-4">
      <ol
        className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400"
        role="list"
      >
        {steps.map((label, i) => {
          const isCompleted = i < step;
          const isActive = i === step;
          const isLastStep = i === steps.length - 1;

          return (
            <li
              key={label}
              className={`flex items-center relative ${
                isCompleted
                  ? 'text-primary dark:text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              } ${!isLastStep ? 'w-full' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="flex flex-col justify-center items-center max-w-20">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors duration-300 ${
                    isActive || isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border-2 border-border text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`whitespace-nowrap transition-colors duration-300 ${
                    isActive ? 'font-bold' : ''
                  }`}
                >
                  {label}
                </span>
              </div>
              {/* {!isLastStep && (
                <div
                  className={`flex-auto border-t-2 transition-colors duration-300  ${
                    isCompleted ? 'border-primary' : 'border-border'
                  }`}
                />
              )} */}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

Stepper.propTypes = {
  step: PropTypes.number.isRequired,
  role: PropTypes.string.isRequired,
};

export default Stepper;
