import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle, Eye, EyeOff, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(false);

    const success = await login(email, password);

    if (success) {
      toast.success('Succesvol ingelogd. Welkom terug!');
    } else {
      setAuthError(true);
      toast.error(
        'Inloggen is niet gelukt. Controleer je e-mailadres en wachtwoord.'
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 px-4 py-8 dark:bg-gray-950">
      {/* <h1 className="text-2xl sm:text-3xl flex items-center gap-2">MaktApp</h1> */}
      <Card className="w-full max-w-md gap-1">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl">Inloggen</CardTitle>

          <CardDescription>
            Voer je gebruikersnaam en wachtwoord in om in te loggen
          </CardDescription>

        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="maktapp@voorbeeld.nl"
                  className={`placeholder:italic placeholder:text-gray-400 ${authError
                    ? 'border-red-500 focus-visible:ring-1 focus-visible:ring-red-500'
                    : ''
                    }`}
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authError) setAuthError(false);
                  }}
                />
              </div>
              <div className="grid gap-2 w-full ">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Wachtwoord</Label>

                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    className={`placeholder:italic placeholder:text-gray-400 pr-10 ${authError
                      ? 'border-red-500 focus-visible:ring-1 focus-visible:ring-red-500'
                      : ''
                      }`}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 focus-visible:outline-none"
                    aria-label={
                      showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {authError && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Inloggegevens zijn onjuist. Controleer je e-mailadres en wachtwoord.
                  </p>
                )}
                <Link to="#" className="flex w-full justify-end text-[0.80rem] underline">
                  Wachtwoord vergeten?
                </Link>
              </div>
              <Button type="submit" className="w-full cursor-pointer">
                Login
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Nog geen lid?{' '}
            <Link to="/register" className="underline">
              Registreer hier
            </Link>
          </div>
        </CardContent>
      </Card>
      <Toaster
        position="top-right"
        icons={{
          success: <CheckCircle className="size-6 text-primary" />,
          error: <XCircle className="size-6 text-destructive" />,
        }}
        toastOptions={{
          style: {
            background: 'oklch(1 0 0)',
            border: '1px solid oklch(0.73 0.1825 127.06)',
            color: 'oklch(0.24 0.02 250)',
            boxShadow: '0 4px 12px oklch(0.24 0.02 250 / 0.1)',
            borderRadius: '0.75rem',
            fontSize: '16px',
            fontWeight: '500',
            padding: '16px 20px',
            minWidth: '300px',
            maxWidth: '500px',
            width: 'max-content',
            whiteSpace: 'nowrap',
            flexDirection: 'row',
            gap: '10px',
          },
          duration: 3000,
        }}
      />
    </div>
  );
}
