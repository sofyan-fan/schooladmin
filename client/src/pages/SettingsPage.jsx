import {
  Eye,
  EyeOff,
  KeyRound,
  Settings,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import RequestHandler from '@/apis/RequestHandler';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';

  const [accountForm, setAccountForm] = useState({
    email: user?.email || '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    parent_name: '',
    sosnumber: '',
  });
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountSaved, setAccountSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [adminEmailSaving, setAdminEmailSaving] = useState(false);
  const [adminEmailError, setAdminEmailError] = useState('');
  const [adminEmailSaved, setAdminEmailSaved] = useState(false);

  // Load the current student's/teacher's contact info
  useEffect(() => {
    if (!isStudent && !isTeacher) return;
    let cancelled = false;

    async function load() {
      setAccountLoading(true);
      setAccountError('');
      setAccountSaved(false);
      try {
        const endpoint = isStudent ? '/auth/me/student' : '/auth/me/teacher';
        const resp = await RequestHandler.get(endpoint);
        const profile = resp?.data || null;

        if (cancelled) return;

        const email =
          (isStudent ? profile?.parent_email : profile?.email) || user?.email || '';

        setAccountForm((prev) => ({
          ...prev,
          email,
          phone: profile?.phone || '',
          address: profile?.address || '',
          postal_code: isStudent ? profile?.postal_code || '' : '',
          city: isStudent ? profile?.city || '' : '',
          parent_name: isStudent ? profile?.parent_name || '' : '',
          sosnumber: profile?.sosnumber || '',
        }));
      } catch (e) {
        console.error('Failed to load account settings', e);
        if (!cancelled) {
          setAccountError(
            e?.response?.data?.message ||
            'Kon je accountgegevens niet laden. Probeer het opnieuw.'
          );
        }
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isStudent, isTeacher]);

  const saveAccount = async () => {
    if (!isStudent && !isTeacher) return;

    setAccountSaving(true);
    setAccountError('');
    setAccountSaved(false);

    try {
      const endpoint = isStudent
        ? '/auth/me/student/contact'
        : '/auth/me/teacher/contact';

      const payload = {
        email: accountForm.email,
        phone: accountForm.phone,
        address: accountForm.address,
        sosnumber: accountForm.sosnumber,
        ...(isStudent
          ? {
            postal_code: accountForm.postal_code,
            city: accountForm.city,
            parent_name: accountForm.parent_name,
          }
          : {}),
      };

      const resp = await RequestHandler.put(endpoint, payload);
      const updatedSessionUser = resp?.data?.user;
      const updatedProfile = resp?.data?.profile;

      // Keep AuthProvider user in sync (especially after email changes)
      if (updatedSessionUser?.email) {
        updateUser({ email: updatedSessionUser.email });
      }

      // Keep the form in sync with what the server stored
      if (updatedProfile) {
        setAccountForm((prev) => ({
          ...prev,
          email:
            (isStudent ? updatedProfile?.parent_email : updatedProfile?.email) ||
            updatedSessionUser?.email ||
            prev.email,
          phone: updatedProfile?.phone ?? prev.phone,
          address: updatedProfile?.address ?? prev.address,
          postal_code: isStudent
            ? updatedProfile?.postal_code ?? prev.postal_code
            : '',
          city: isStudent ? updatedProfile?.city ?? prev.city : '',
          parent_name: isStudent
            ? updatedProfile?.parent_name ?? prev.parent_name
            : '',
          sosnumber: updatedProfile?.sosnumber ?? prev.sosnumber,
        }));
      }

      setAccountSaved(true);
    } catch (e) {
      console.error('Failed to save account settings', e);
      setAccountError(
        e?.response?.data?.message ||
        'Opslaan mislukt. Controleer je gegevens en probeer het opnieuw.'
      );
    } finally {
      setAccountSaving(false);
    }
  };

  const savePassword = async () => {
    if (!isStudent && !isTeacher && !isAdmin) return;

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSaved(false);

    try {
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        setPasswordError('Nieuwe wachtwoorden komen niet overeen.');
        setPasswordSaving(false);
        return;
      }

      if (passwordForm.new_password.length < 6) {
        setPasswordError('Wachtwoord moet minimaal 6 tekens bevatten.');
        setPasswordSaving(false);
        return;
      }

      await RequestHandler.put('/auth/me/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });

      setPasswordSaved(true);
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setShowPassword({ current: false, new: false, confirm: false });
    } catch (e) {
      console.error('Failed to change password', e);
      setPasswordError(
        e?.response?.data?.message ||
        'Wachtwoord wijzigen mislukt. Controleer je gegevens en probeer het opnieuw.'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const saveAdminEmail = async () => {
    if (!isAdmin) return;

    setAdminEmailSaving(true);
    setAdminEmailError('');
    setAdminEmailSaved(false);

    try {
      const resp = await RequestHandler.put('/auth/me/admin/email', {
        email: adminEmail,
      });

      const updatedUser = resp?.data?.user;
      if (updatedUser?.email) {
        updateUser({ email: updatedUser.email });
        setAdminEmail(updatedUser.email);
      }

      setAdminEmailSaved(true);
    } catch (e) {
      console.error('Failed to update admin email', e);
      setAdminEmailError(
        e?.response?.data?.message ||
        'E-mailadres wijzigen mislukt. Controleer je gegevens en probeer het opnieuw.'
      );
    } finally {
      setAdminEmailSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Settings className="size-9" />
        <h1 className="text-3xl font-[530]">Instellingen</h1>
      </div>

      {(isStudent || isTeacher) && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="md:col-span-2 xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" /> Accountgegevens
              </CardTitle>
              <CardDescription>
                Wijzig je contactgegevens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {accountError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {accountError}
                </div>
              ) : null}
              {accountSaved ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
                  Opgeslagen.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="acc-email">E-mail</Label>
                  <Input
                    id="acc-email"
                    type="email"
                    value={accountForm.email}
                    disabled={accountLoading || accountSaving}
                    onChange={(e) =>
                      setAccountForm((s) => ({ ...s, email: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="acc-phone">Telefoon</Label>
                  <Input
                    id="acc-phone"
                    value={accountForm.phone}
                    disabled={accountLoading || accountSaving}
                    onChange={(e) =>
                      setAccountForm((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="acc-address">Adres</Label>
                  <Input
                    id="acc-address"
                    value={accountForm.address}
                    disabled={accountLoading || accountSaving}
                    onChange={(e) =>
                      setAccountForm((s) => ({ ...s, address: e.target.value }))
                    }
                  />
                </div>

                {isStudent ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="acc-postal">Postcode</Label>
                      <Input
                        id="acc-postal"
                        value={accountForm.postal_code}
                        disabled={accountLoading || accountSaving}
                        onChange={(e) =>
                          setAccountForm((s) => ({
                            ...s,
                            postal_code: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="acc-city">Stad</Label>
                      <Input
                        id="acc-city"
                        value={accountForm.city}
                        disabled={accountLoading || accountSaving}
                        onChange={(e) =>
                          setAccountForm((s) => ({ ...s, city: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="acc-parent-name">Ouder/verzorger</Label>
                      <Input
                        id="acc-parent-name"
                        value={accountForm.parent_name}
                        disabled={accountLoading || accountSaving}
                        onChange={(e) =>
                          setAccountForm((s) => ({
                            ...s,
                            parent_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                ) : null}

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="acc-sos">SOS-nummer</Label>
                  <Input
                    id="acc-sos"
                    value={accountForm.sosnumber}
                    disabled={accountLoading || accountSaving}
                    onChange={(e) =>
                      setAccountForm((s) => ({ ...s, sosnumber: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={saveAccount}
                disabled={accountLoading || accountSaving}
              >
                {accountSaving ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5" /> Wachtwoord wijzigen
              </CardTitle>
              <CardDescription>
                Wijzig je wachtwoord voor je account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {passwordError}
                </div>
              ) : null}
              {passwordSaved ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
                  Wachtwoord succesvol gewijzigd.
                </div>
              ) : null}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pw-current">Huidig wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="pw-current"
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      disabled={passwordSaving}
                      className="pr-10"
                      onChange={(e) =>
                        setPasswordForm((s) => ({
                          ...s,
                          current_password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, current: !s.current }))
                      }
                      tabIndex={-1}
                    >
                      {showPassword.current ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pw-new">Nieuw wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="pw-new"
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      disabled={passwordSaving}
                      className="pr-10"
                      onChange={(e) =>
                        setPasswordForm((s) => ({
                          ...s,
                          new_password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, new: !s.new }))
                      }
                      tabIndex={-1}
                    >
                      {showPassword.new ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pw-confirm">Bevestig nieuw wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="pw-confirm"
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      disabled={passwordSaving}
                      className="pr-10"
                      onChange={(e) =>
                        setPasswordForm((s) => ({
                          ...s,
                          confirm_password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, confirm: !s.confirm }))
                      }
                      tabIndex={-1}
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={savePassword}
                disabled={
                  passwordSaving ||
                  !passwordForm.current_password ||
                  !passwordForm.new_password ||
                  !passwordForm.confirm_password
                }
              >
                {passwordSaving ? 'Wijzigen…' : 'Wachtwoord wijzigen'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {isAdmin && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" /> Accountgegevens
              </CardTitle>
              <CardDescription>
                Wijzig je e-mailadres.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminEmailError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {adminEmailError}
                </div>
              ) : null}
              {adminEmailSaved ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
                  E-mailadres opgeslagen.
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="admin-email">E-mail</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  disabled={adminEmailSaving}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={saveAdminEmail}
                disabled={adminEmailSaving || !adminEmail}
              >
                {adminEmailSaving ? 'Opslaan…' : 'Opslaan'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-5" /> Wachtwoord wijzigen
              </CardTitle>
              <CardDescription>
                Wijzig je wachtwoord voor je account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {passwordError}
                </div>
              ) : null}
              {passwordSaved ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
                  Wachtwoord succesvol gewijzigd.
                </div>
              ) : null}

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="admin-pw-current">Huidig wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="admin-pw-current"
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      disabled={passwordSaving}
                      className="pr-10"
                      onChange={(e) =>
                        setPasswordForm((s) => ({
                          ...s,
                          current_password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, current: !s.current }))
                      }
                      tabIndex={-1}
                    >
                      {showPassword.current ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="admin-pw-new">Nieuw wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="admin-pw-new"
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      disabled={passwordSaving}
                      className="pr-10"
                      onChange={(e) =>
                        setPasswordForm((s) => ({
                          ...s,
                          new_password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, new: !s.new }))
                      }
                      tabIndex={-1}
                    >
                      {showPassword.new ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="admin-pw-confirm">Bevestig nieuw wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="admin-pw-confirm"
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      disabled={passwordSaving}
                      className="pr-10"
                      onChange={(e) =>
                        setPasswordForm((s) => ({
                          ...s,
                          confirm_password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowPassword((s) => ({ ...s, confirm: !s.confirm }))
                      }
                      tabIndex={-1}
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={savePassword}
                disabled={
                  passwordSaving ||
                  !passwordForm.current_password ||
                  !passwordForm.new_password ||
                  !passwordForm.confirm_password
                }
              >
                {passwordSaving ? 'Wijzigen…' : 'Wachtwoord wijzigen'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
