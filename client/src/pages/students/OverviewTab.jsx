import { AttendanceCard } from '@/components/other/AttendanceCard';
import { RecentResultsCard } from '@/components/other/RecentResultsCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import {
  CreditCard,
  IdCard,
  Info,
  Mail,
  MapPin,
  Notebook,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

function StatCard({ icon, title, description, tab, setTab, className }) {
  return (
    <Card className={['flex flex-col', className].join(' ')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center">
        <p className="text-sm text-muted-foreground">
          Geen gegevens beschikbaar.
        </p>
      </CardContent>
      <div className="px-6 pb-6">
        <Button
          variant="link"
          className="px-0 text-primary"
          onClick={() => setTab(tab)}
        >
          Bekijk {tab}
        </Button>
      </div>
    </Card>
  );
}

export default function OverviewTab({ student, studentStats, setTab }) {
  const quranProgress = {
    summary: {
      lastSurah: 'Al-Baqarah',
      lastAyahRange: '1–5',
      juz: 1,
      pagesRead: 2,
      memorizedVerses: 15,
      reviewedVerses: 5,
    },
    recentLogs: [
      {
        date: '2025-09-25',
        surah: 'Al-Fatiha',
        from: 1,
        to: 7,
        type: 'memorization',
      },
      {
        date: '2025-09-28',
        surah: 'Al-Baqarah',
        from: 1,
        to: 5,
        type: 'reading',
      },
      {
        date: '2025-10-01',
        surah: 'Al-Baqarah',
        from: 6,
        to: 10,
        type: 'reading',
      },
    ],
  };

  const [quranLogs, setQuranLogs] = useState(() =>
    (quranProgress.recentLogs || []).map((l) => ({ ...l, memorized: false }))
  );

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
      <AttendanceCard
        className="lg:col-span-4"
        stats={studentStats.attendance}
        title="Aanwezigheid"
        colorVars={{
          present: 'oklch(0.7805 0.1825 127.06)',
          late: 'oklch(0.88 0.12 95)',
          absent: 'oklch(0.67 0.22 28)',
        }}
        timeframe="Laatste 30 dagen"
        standardPct={90}
        onOpenAttendance={() => setTab('aanwezigheid')}
      />

      <RecentResultsCard
        studentStats={studentStats}
        className="lg:col-span-4"
        onOpenResults={() => setTab('resultaten')}
      />

      <Card className="lg:col-span-4 gap-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Info size={25} /> Gegevens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 flex flex-col gap-2">
            <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
              <IdCard className="size-5" />
              Lespakket:{' '}
              <span className="font-bold">
                {studentStats.lesson_package || '—'}
              </span>
            </div>
            <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
              <Mail className="size-5" />
              {student?.email || student?.parent_email || '—'}
            </div>
            <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
              <Phone className="size-5" />
              {student?.phone || '—'}
            </div>
            <div className="text-base ml-2 flex  text-regular mb-1 items-center gap-2">
              <MapPin className="size-5" />
              {student?.address || '—'}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          title="Voortgang"
          description="Overzicht van leer voortgang."
          tab="voortgang"
          setTab={setTab}
        />
      </div>
      <div className="lg:col-span-4">
        <StatCard
          icon={<CreditCard size={20} />}
          title="Betalingen"
          description="Status van lesgeldbetalingen."
          tab="betalingen"
          setTab={setTab}
        />
      </div>
      <div className="lg:col-span-4">
        <StatCard
          icon={<Notebook size={20} />}
          title="Notities"
          description="Persoonlijke opmerkingen."
          tab="notities"
          setTab={setTab}
        />
      </div>

      <div className="lg:col-span-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Notebook size={25} /> Koranvoortgang
            </CardTitle>
            <CardDescription>Voorbeeldgegevens (dummy)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Laatste soera
                </div>
                <div className="text-sm font-medium">
                  {quranProgress.summary.lastSurah}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Laatste verzen
                </div>
                <div className="text-sm font-medium">
                  {quranProgress.summary.lastAyahRange}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Juz / Pagina's
                </div>
                <div className="text-sm font-medium">
                  {quranProgress.summary.juz} /{' '}
                  {quranProgress.summary.pagesRead}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Geleerd (verzen)
                </div>
                <div className="text-sm font-medium">
                  {quranProgress.summary.memorizedVerses}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Herhaald (verzen)
                </div>
                <div className="text-sm font-medium">
                  {quranProgress.summary.reviewedVerses}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium mb-2">Recente logs</div>
              <div className="rounded-md border divide-y">
                {quranLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <div className="text-muted-foreground min-w-28">
                      {format(log.date, 'PPP', { locale: nl })}
                    </div>
                    <div className="font-medium flex-1">
                      {log.surah} {log.from}–{log.to}
                    </div>
                    <div className="text-muted-foreground min-w-28 text-right">
                      {log.type === 'memorization' ? 'Memorisatie' : 'Lezen'}
                    </div>
                    <div className="flex items-center gap-2 min-w-40 justify-end">
                      <span className="text-xs text-muted-foreground">
                        Geleerd?
                      </span>
                      <Checkbox
                        checked={log.memorized}
                        onCheckedChange={(v) =>
                          setQuranLogs((arr) =>
                            arr.map((it, i) =>
                              i === idx ? { ...it, memorized: Boolean(v) } : it
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
