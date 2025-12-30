import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Notebook,
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
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';

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

  const [subjectsSettings, setSubjectsSettings] = useState({
    enabled: true,
    retentionDays: 365,
  });

  const [quranSettings, setQuranSettings] = useState({
    enabled: true,
    trackMemorization: true,
    retentionDays: 365,
  });

  const [attendanceSettings, setAttendanceSettings] = useState({
    requireReasonForLate: true,
    allowTeacherNotes: true,
  });

  const [resultsSettings, setResultsSettings] = useState({
    passingGrade: 5.5,
    maxGrade: 10,
  });

  const save = (key, value) => {
    // Replace with API call when backend is ready
    console.log(`[settings] save ${key}:`, value);
  };

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
        </div>
      )}

      {!(isStudent || isTeacher) && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Subjects logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" /> Vakkenlogboek
              </CardTitle>
              <CardDescription>Instellingen voor vakkenlogs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="subjects-enabled">Inschakelen</Label>
                <Switch
                  id="subjects-enabled"
                  checked={subjectsSettings.enabled}
                  onCheckedChange={(v) =>
                    setSubjectsSettings((s) => ({ ...s, enabled: v }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subjects-retention">Bewaartermijn (dagen)</Label>
                <Input
                  id="subjects-retention"
                  type="number"
                  min={0}
                  value={subjectsSettings.retentionDays}
                  onChange={(e) =>
                    setSubjectsSettings((s) => ({
                      ...s,
                      retentionDays: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => save('subjects', subjectsSettings)}>
                Opslaan
              </Button>
            </CardFooter>
          </Card>

          {/* Quran logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Notebook className="size-5" /> Koranlogboek
              </CardTitle>
              <CardDescription>
                Instellingen voor Qur'an voortgang en notities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="quran-enabled">Inschakelen</Label>
                <Switch
                  id="quran-enabled"
                  checked={quranSettings.enabled}
                  onCheckedChange={(v) =>
                    setQuranSettings((s) => ({ ...s, enabled: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quran-mem">Memorisatie bijhouden</Label>
                <Switch
                  id="quran-mem"
                  checked={quranSettings.trackMemorization}
                  onCheckedChange={(v) =>
                    setQuranSettings((s) => ({ ...s, trackMemorization: v }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quran-retention">Bewaartermijn (dagen)</Label>
                <Input
                  id="quran-retention"
                  type="number"
                  min={0}
                  value={quranSettings.retentionDays}
                  onChange={(e) =>
                    setQuranSettings((s) => ({
                      ...s,
                      retentionDays: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => save('quran', quranSettings)}>
                Opslaan
              </Button>
            </CardFooter>
          </Card>

          {/* Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" /> Aanwezigheid
              </CardTitle>
              <CardDescription>
                Basisinstellingen voor aanwezigheidsregistratie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="att-late-reason">
                  Reden verplicht bij te laat
                </Label>
                <Switch
                  id="att-late-reason"
                  checked={attendanceSettings.requireReasonForLate}
                  onCheckedChange={(v) =>
                    setAttendanceSettings((s) => ({
                      ...s,
                      requireReasonForLate: v,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="att-notes">Docentnotities toestaan</Label>
                <Switch
                  id="att-notes"
                  checked={attendanceSettings.allowTeacherNotes}
                  onCheckedChange={(v) =>
                    setAttendanceSettings((s) => ({ ...s, allowTeacherNotes: v }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => save('attendance', attendanceSettings)}>
                Opslaan
              </Button>
            </CardFooter>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5" /> Resultaten
              </CardTitle>
              <CardDescription>Instellingen voor beoordeling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="res-pass">Voldoende vanaf cijfer</Label>
                <Input
                  id="res-pass"
                  type="number"
                  min={0}
                  step={0.1}
                  value={resultsSettings.passingGrade}
                  onChange={(e) =>
                    setResultsSettings((s) => ({
                      ...s,
                      passingGrade: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="res-max">Maximum cijfer</Label>
                <Input
                  id="res-max"
                  type="number"
                  min={0}
                  step={0.1}
                  value={resultsSettings.maxGrade}
                  onChange={(e) =>
                    setResultsSettings((s) => ({
                      ...s,
                      maxGrade: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => save('results', resultsSettings)}>
                Opslaan
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
