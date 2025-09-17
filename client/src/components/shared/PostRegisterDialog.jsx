import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
const PostRegisterDialog = ({ open, firstName, onAction }) => {
  if (!open) return null;
console.log("firstName", firstName);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop (non-interactive) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* Dialog container */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border shadow-xl bg-white dark:bg-gray-900">
        <div className="p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welkom{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Je account is aangemaakt. Je kunt meteen aan de slag.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              onClick={() => onAction('dashboard')}
            >
              Ga naar dashboard
            </Button>
            <Button
              className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-base font-medium bg-white text-gray-900 dark:text-gray-100 border hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              onClick={() => onAction('profile')}
            >
              Profiel bekijken
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

PostRegisterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  firstName: PropTypes.string,
  onAction: PropTypes.func.isRequired,
};

PostRegisterDialog.defaultProps = {
  firstName: '',
};

export default PostRegisterDialog;
