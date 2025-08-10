import { useState } from 'react';
import { Link } from 'react-router-dom';

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
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();

  const [role, setRole] = useState('');

  const [firstName, setFirstname] = useState('');
  const [lastName, setLastname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('');
  const [postalCode, setPostalcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreement, setAgreement] = useState(false);

  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Wachtwoorden komen niet overeen.');
      return;
    }
    if (!agreement) {
      setFormError('Je moet akkoord gaan met de voorwaarden.');
      return;
    }
    if (!role) {
      setFormError('Kies een rol.');
      return;
    }

    try {
      // Send full profile so backend can create role-specific records
      const success = await register(email, password, role, {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        address,
        city,
        country,
        phone,
        postalCode,
        course,
        paymentMethod,
      });
      if (!success) {
        setFormError('Registreren is mislukt. Bestaat dit e-mailadres al?');
        return;
      }

      // If your API supports it later, pass the full profile:
      // await register({
      //   email,
      //   password,
      //   role,
      //   profile: {
      //     firstName,
      //     lastName,
      //     dateOfBirth,
      //     gender,
      //     address,
      //     city,
      //     country,
      //     phone,
      //     course,
      //     paymentMethod,
      //   },
      // });
    } catch (err) {
      setFormError(err?.message || 'Er ging iets mis bij het registreren.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Registreren</CardTitle>
          <CardDescription>Maak een nieuw account aan</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            {/* THIS SHOULD REMOVE THE PAYMENT METHOD IF 'TEACHER' IS SELECTED */}
            <Label id="role-label">Rol</Label>
            <div
              className="flex items-center gap-6 mt-2"
              role="radiogroup"
              aria-labelledby="role-label"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-4 w-4"
                />
                <span>Leerling</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={role === 'teacher'}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-4 w-4"
                />
                <span>Docent</span>
              </label>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Persoonlijke gegevens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstname">Voornaam</Label>
                <Input
                  id="firstname"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstname(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <Label htmlFor="lastname">Achternaam</Label>
                <Input
                  id="lastname"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastname(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div>
                <Label>Geslacht</Label>
                <div
                  className="flex items-center gap-6 mt-2"
                  role="radiogroup"
                  aria-labelledby="gender"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span>Man</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-4 w-4"
                    />
                    <span>Vrouw</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </div>
              <div>
                <Label htmlFor="city">Woonplaats</Label>
                <Input
                  id="city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country-name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Postcode</Label>
                <Input
                  id="postalCode"
                  type="tel"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalcode(e.target.value)}
                  autoComplete="postal-code"
                  placeholder="1234 AB"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefoon</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="+31 6 12345678"
                />
              </div>
            </div>

            {/* Account */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimaal 8 tekens.
                </p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Wachtwoord (herhaal)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Schoolgegevens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              { role !== 'teacher' ? (
              <div>
                <Label>Inschrijving (vak/cursus)</Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger id="course">
                    <SelectValue placeholder="Kies cursus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arabic-beginner">
                      Arabisch – Beginner
                    </SelectItem>
                    <SelectItem value="tajweed">Tajwīd</SelectItem>
                    <SelectItem value="fiqh">Fiqh (basics)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {role !== 'teacher' ? (
                <div>
                  {/* Hidden when role is 'teacher' */}
                  <Label>Betaalmethode</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Kies betaalmethode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sepa">SEPA incasso</SelectItem>
                      <SelectItem value="ideal">iDEAL</SelectItem>
                      <SelectItem value="cash">Contant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            {/* Voorwaarden */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="agreement"
                checked={agreement}
                onCheckedChange={(val) => setAgreement(Boolean(val))}
              />
              <Label htmlFor="agreement" className="leading-snug">
                Ik ga akkoord met de{' '}
                <Link to="/voorwaarden" className="underline">
                  voorwaarden
                </Link>{' '}
                en het privacybeleid.
              </Label>
            </div>

            {formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : null}

            <Button type="submit" className="w-full cursor-pointer">
              Registreren
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Heb je al een account?{' '}
            <Link to="/login" className="underline">
              Log hier in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
