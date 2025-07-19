import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(username, password, role);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="min-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Registreren</CardTitle>
          <CardDescription>Maak een nieuw account aan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Email</Label>
                <Input id="username" type="text" required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input id="password" type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Input id="role" type="text" required
                  placeholder="bijv. admin of user"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Registreren</Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Heb je al een account?{' '}
            <Link to="/login" className="underline">Log hier in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
