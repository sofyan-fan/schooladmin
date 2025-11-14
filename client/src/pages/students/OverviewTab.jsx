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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import {
  CheckCircle2,
  CreditCard,
  IdCard,
  Info,
  Mail,
  MapPin,
  Notebook,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

  // ----- Betalingen (lokaal met localStorage) -----
  const formatCurrency = (value) =>
    new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value || 0));

  const courseName =
    studentStats?.lesson_package || student?.lesson_package || '—';

  const studentKey =
    student?.id ??
    student?.email ??
    studentStats?.fullName ??
    'onbekende_student';
  const paymentStorageKey = `payments:${studentKey}:${courseName}`;

  const getDefaultCoursePrice = () => {
    try {
      const map = JSON.parse(localStorage.getItem('coursePrices') || '{}');
      const raw = map?.[courseName];
      const num = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(num) && num > 0 ? num : 0;
    } catch {
      return 0;
    }
  };

  const readStoredPayment = () => {
    try {
      const raw = localStorage.getItem(paymentStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        totalPrice: Number(parsed?.totalPrice) || 0,
        paid: Math.max(0, Number(parsed?.paid) || 0),
      };
    } catch {
      return null;
    }
  };

  const [paymentState, setPaymentState] = useState(() => {
    const stored = readStoredPayment();
    if (stored) {
      const cappedPaid = Math.min(stored.paid, stored.totalPrice || 0);
      return { totalPrice: stored.totalPrice, paid: cappedPaid };
    }
    return { totalPrice: getDefaultCoursePrice(), paid: 0 };
  });

  const remainingToPay = Math.max(
    (paymentState.totalPrice || 0) - (paymentState.paid || 0),
    0
  );

  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const parsedAmount = Math.max(0, parseFloat(paymentAmountInput) || 0);
  const isPayDisabled =
    parsedAmount <= 0 ||
    remainingToPay <= 0 ||
    (paymentState.totalPrice || 0) <= 0;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Re-sync when the key (student/course) changes
  useEffect(() => {
    const stored = readStoredPayment();
    if (stored) {
      setPaymentState({
        totalPrice: stored.totalPrice,
        paid: Math.min(stored.paid, stored.totalPrice || 0),
      });
    } else {
      setPaymentState({ totalPrice: getDefaultCoursePrice(), paid: 0 });
    }
    setPaymentAmountInput('');
  }, [paymentStorageKey]);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(paymentStorageKey, JSON.stringify(paymentState));
    } catch { }
  }, [paymentState, paymentStorageKey]);

  const handleConfirmPayment = () => {
    const apply = Math.min(parsedAmount, remainingToPay);
    if (apply <= 0) {
      setIsConfirmOpen(false);
      return;
    }
    setPaymentState((prev) => {
      const total = prev.totalPrice || 0;
      const nextPaid = Math.min((prev.paid || 0) + apply, total);
      return { ...prev, paid: nextPaid };
    });
    setPaymentAmountInput('');
    setIsConfirmOpen(false);
  };

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
        {/* <StatCard
          icon={<CreditCard size={20} />}
          title="Betalingen"
          description="Status van lesgeldbetalingen."
          tab="betalingen"
          setTab={setTab}
        /> */}

        {/* Betalingen */}
        <Card className={'flex flex-col'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              Betalingen
            </CardTitle>
            {/* <CardDescription>Status van lesgeldbetalingen.</CardDescription> */}
            <CardDescription className="text-sm text-muted-foreground">
              Status van lesgeldbetalingen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Lespakket</span>
                <span className="font-medium">{courseName || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Totaalprijs</span>
                <span className="font-medium">
                  {paymentState.totalPrice > 0
                    ? formatCurrency(paymentState.totalPrice)
                    : '—'}
                </span>
              </div>
              {remainingToPay > 0 ? (
                <div className="flex items-center justify-between">
                  <span>Nog te betalen</span>
                  <span className="font-medium text-orange-600">
                    {formatCurrency(remainingToPay)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-green-700">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <CheckCircle2 className="size-4" />
                    Lespakket betaald
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="payment-amount">Bedrag</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="payment-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  placeholder="Voer bedrag in"
                  className="max-w-[200px]"
                  disabled={(paymentState.totalPrice || 0) <= 0 || remainingToPay <= 0}
                />

                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      onClick={() => {
                        if (
                          !(
                            parsedAmount <= 0 ||
                            remainingToPay <= 0 ||
                            (paymentState.totalPrice || 0) <= 0
                          )
                        ) {
                          setIsConfirmOpen(true);
                        }
                      }}
                      disabled={
                        parsedAmount <= 0 ||
                        remainingToPay <= 0 ||
                        (paymentState.totalPrice || 0) <= 0
                      }
                    >
                      Betalen
                    </Button>
                  </DialogTrigger>
                  <DialogContent maxWidth="480px">
                    <DialogHeader>
                      <DialogTitle>Betaling bevestigen</DialogTitle>
                      <DialogDescription>
                        Weet je zeker dat je {formatCurrency(parsedAmount)} wilt
                        betalen voor {courseName}?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm">
                      Nieuw resterend bedrag:{' '}
                      <span className="font-medium">
                        {formatCurrency(
                          Math.max(remainingToPay - parsedAmount, 0)
                        )}
                      </span>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                        Annuleren
                      </Button>
                      <Button onClick={handleConfirmPayment}>Bevestigen</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {(paymentState.totalPrice || 0) <= 0 && (
                <p className="text-xs text-muted-foreground">
                  Geen prijs bekend voor dit lespakket. Dit kan later vanuit de
                  lespakketten worden ingesteld.
                </p>
              )}
              {parsedAmount > remainingToPay && remainingToPay > 0 && (
                <p className="text-xs text-muted-foreground">
                  Je invoer is hoger dan het resterende bedrag. Het overschot
                  wordt niet meegerekend.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

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
