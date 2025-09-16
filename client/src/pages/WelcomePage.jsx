import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.first_name || user?.firstName || user?.name || '';

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="w-full max-w-xl rounded-2xl border bg-background p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">
          Welkom{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Je account is aangemaakt. Je kunt meteen aan de slag.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/dashboard')}>
            Ga naar dashboard
          </Button>
          <Link
            to="/instellingen"
            className="text-sm underline text-muted-foreground"
          >
            Profiel bekijken
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
