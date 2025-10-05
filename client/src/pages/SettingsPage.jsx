import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Notebook,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

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

const SettingsPage = () => {
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

  return (
    <>
      <div className="flex items-center gap-2">
        <Settings className="size-9" />
        <h1 className="text-3xl font-[530]">Instellingen</h1>
      </div>

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
    </>
  );
};

export default SettingsPage;
