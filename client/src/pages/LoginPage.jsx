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
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="min-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Inloggen</CardTitle>
          <CardDescription>
            Voer je gebruikersnaam en wachtwoord in om in te loggen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="maktab@voorbeeld.nl"
                  className="placeholder:italic placeholder:text-gray-400"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Wachtwoord</Label>
                 
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  className="placeholder:italic placeholder:text-gray-400"

                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                 <Link
                    href="#"
                    className="mr-auto inline-block text-sm underline"
                  >
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
    </div>
  );
}
