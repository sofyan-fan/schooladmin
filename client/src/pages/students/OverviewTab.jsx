import { getChapters } from '@/apis/quranAPI';
import quranLogAPI from '@/apis/quranLogAPI';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { parsePoint } from '@/utils/quran';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import {
  CheckCircle2,
  CreditCard,
  HandCoins,
  IdCard,
  Info,
  Mail,
  MapPin,
  Notebook,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function StatCard({
  icon,
  title,
  description,
  tab,
  setTab,
  className,
  extraAction,
  content,
}) {
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
        {content || (
          <p className="text-sm text-muted-foreground">
            Geen gegevens beschikbaar.
          </p>
        )}
      </CardContent>
      {extraAction ? (
        <div className="px-6 pb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">{extraAction}</div>
          <Button
            variant="link"
            className="px-0 text-primary"
            onClick={() => setTab(tab)}
          >
            Bekijk {tab}
          </Button>
        </div>
      ) : (
        <div className="px-6 pb-6">
          <Button
            variant="link"
            className="px-0 text-primary"
            onClick={() => setTab(tab)}
          >
            Bekijk {tab}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function OverviewTab({
  student,
  studentStats,
  setTab,
  onAddNote,
}) {
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

  const [latestQuranLog, setLatestQuranLog] = useState(null);
  const [latestQuranLogLoading, setLatestQuranLogLoading] = useState(false);
  const [chapters, setChapters] = useState([]);

  // Load Quran chapters once (for surah names)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cs = await getChapters();
        if (!active) return;
        setChapters(cs || []);
      } catch (e) {
        console.error('Failed to load Quran chapters', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Load latest Quran log for this student
  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!student?.id) {
        if (active) {
          setLatestQuranLog(null);
          setLatestQuranLogLoading(false);
        }
        return;
      }

      setLatestQuranLogLoading(true);
      try {
        const all = await quranLogAPI.get_logs();
        if (!active) return;
        const sid = Number(student.id);
        const filtered = (all || []).filter(
          (l) => Number(l.student_id) === sid
        );
        if (!filtered.length) {
          setLatestQuranLog(null);
          return;
        }
        filtered.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
        setLatestQuranLog(filtered[0]);
      } catch (e) {
        console.error('Failed to load Quran logs for student', e);
        if (active) setLatestQuranLog(null);
      } finally {
        if (active) setLatestQuranLogLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [student?.id]);

  const chapterById = useMemo(
    () =>
      new Map(
        (chapters || []).map((c) => [String(c.id), c])
      ),
    [chapters]
  );

  const formatLogDate = (value) => {
    if (!value) return 'Onbekend';
    try {
      const dt =
        value instanceof Date ? value : new Date(value);
      if (Number.isNaN(dt.getTime())) return 'Onbekend';
      return format(dt, 'dd-MM-yyyy', { locale: nl });
    } catch {
      return 'Onbekend';
    }
  };

  const formatPointLabel = (raw) => {
    if (!raw) return '—';
    const p = parsePoint(String(raw));
    const parts = [];
    if (p.surahId) {
      const chapter = chapterById.get(String(p.surahId));
      const name = chapter?.name_simple || `Soera ${p.surahId}`;
      parts.push(name);
    }
    if (p.ayah) parts.push(`Ayah ${p.ayah}`);
    if (p.hizb) parts.push(`Hizb ${p.hizb}`);
    if (!parts.length) return '—';
    return parts.join(' • ');
  };

  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteText, setNoteText] = useState('');

  // ----- Betalingen (lokaal met localStorage) -----
  const formatCurrency = (value) =>
    new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(Number(value || 0));

  // Prijzen fallback (seed-courses) indien localStorage geen prijs bevat
  const DEFAULT_COURSE_PRICES = {
    'Islamitische Studies - Compleet': 500,
    'Intensief Quranprogramma': 350,
    'Arabisch voor Beginners': 250,
  };

  const courseName =
    studentStats?.meta?.course ||
    studentStats?.lesson_package ||
    student?.lesson_package ||
    '—';

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
      if (Number.isFinite(num) && num > 0) return num;
      // Fallback op bekende seed-cursussen
      const fallback = DEFAULT_COURSE_PRICES[courseName];
      return Number.isFinite(fallback) ? fallback : 0;
    } catch {
      const fallback = DEFAULT_COURSE_PRICES[courseName];
      return Number.isFinite(fallback) ? fallback : 0;
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
        transactions: Array.isArray(parsed?.transactions)
          ? parsed.transactions
          : [],
      };
    } catch {
      return null;
    }
  };

  const [paymentState, setPaymentState] = useState(() => {
    const stored = readStoredPayment();
    if (stored) {
      const cappedPaid = Math.min(stored.paid, stored.totalPrice || 0);
      return {
        totalPrice: stored.totalPrice,
        paid: cappedPaid,
        transactions: stored.transactions || [],
      };
    }
    return { totalPrice: getDefaultCoursePrice(), paid: 0, transactions: [] };
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

  const [paymentMethod, setPaymentMethod] = useState('Bank');

  // Re-sync when the key (student/course) changes
  useEffect(() => {
    const stored = readStoredPayment();
    if (stored) {
      setPaymentState((prev) => ({
        totalPrice: stored.totalPrice,
        paid: Math.min(stored.paid, stored.totalPrice || 0),
        transactions: stored.transactions || prev.transactions || [],
      }));
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
      const tx = {
        id: Date.now(),
        date: new Date().toISOString(),
        amount: apply,
        method: paymentMethod,
        source: 'Lesgeldkaart',
      };
      const existing = Array.isArray(prev.transactions)
        ? prev.transactions
        : [];
      return {
        ...prev,
        paid: nextPaid,
        transactions: [tx, ...existing],
      };
    });
    setPaymentAmountInput('');
    setIsConfirmOpen(false);
  };

  const handleCreateNote = (e) => {
    e.preventDefault();
    const text = noteText.trim();
    const subject = noteSubject.trim();
    if (!text) return;

    if (typeof onAddNote === 'function') {
      onAddNote({ subject, text });
    }

    setNoteSubject('');
    setNoteText('');
    setIsNotesDialogOpen(false);
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
                {studentStats?.meta?.course ||
                  studentStats?.lesson_package ||
                  '—'}
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

      <Card className="lg:col-span-4 flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp size={20} />
            Qur'an-voortgang
          </CardTitle>
          <CardDescription>
            Meest recente log uit het Qur'an-logboek.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center">
          {latestQuranLogLoading ? (
            <p className="text-sm text-muted-foreground">
              Qur'an-log wordt geladen...
            </p>
          ) : !latestQuranLog ? (
            <p className="text-sm text-muted-foreground">
              Nog geen Qur'an-log geregistreerd.
            </p>
          ) : (
            <div className="w-full space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Datum</span>
                <span className="font-medium">
                  {formatLogDate(latestQuranLog.date)}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">
                  Bereik
                </div>
                <div className="text-sm font-medium">
                  Van: {formatPointLabel(latestQuranLog.start_log)}
                </div>
                <div className="text-sm">
                  Tot: {formatPointLabel(latestQuranLog.end_log)}
                </div>
              </div>
              {latestQuranLog.comment ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Omschrijving
                  </div>
                  <div className="text-sm">
                    {latestQuranLog.comment}
                  </div>
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground">
                Status:{' '}
                <span className="font-medium">
                  {latestQuranLog.completed
                    ? 'Geleerd'
                    : 'Nog in behandeling'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
        <div className="px-6 pb-6">
          <Button
            variant="link"
            className="px-0 text-primary"
            onClick={() => setTab('voortgang')}
          >
            Bekijk voortgang
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-4">
        {/* <StatCard
          icon={<CreditCard size={20} />}
          title="Betalingen"
          description="Status van lesgeldbetalingen."
          tab="betalingen"
          setTab={setTab}
        /> */}

        {/* Betalingen */}
        <Card className={'flex flex-col gap-1'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              Betalingen
            </CardTitle>
            {/* <CardDescription>Status van lesgeldbetalingen.</CardDescription> */}
            {/* <CardDescription className="text-sm text-muted-foreground">
              Status van lesgeldbetalingen.
            </CardDescription> */}
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
            <div className="space-y-1 mt-2">
              <Label className="text-xs text-muted-foreground">
                Betaalmethode
              </Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id="method-bank"
                    value="Bank"
                    aria-label="Bankoverschrijving"
                  />
                  <Label
                    htmlFor="method-bank"
                    className="flex cursor-pointer items-center gap-1 text-xs sm:text-sm"
                  >
                    <CreditCard className="size-4" />
                    <span>Bank</span>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    id="method-cash"
                    value="Contant"
                    aria-label="Contant betalen"
                  />
                  <Label
                    htmlFor="method-cash"
                    className="flex cursor-pointer items-center gap-1 text-xs sm:text-sm"
                  >
                    <HandCoins className="size-4" />
                    <span>Contant</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="mt-4 space-y-3">
              {/* <Label htmlFor="payment-amount">Bedrag</Label> */}
              <div className="flex items-center gap-2 justify-between">
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
              {parsedAmount > remainingToPay && remainingToPay > 0 && (
                <p className="text-xs text-muted-foreground">Bedrag wordt gemaximeerd op resterend bedrag.</p>
              )}

            </div>
          </CardContent>
        </Card>

      </div>
      <div className="lg:col-span-4 flex">
        <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
          <StatCard
            icon={<Notebook size={20} />}
            title="Notities"
            description="Persoonlijke opmerkingen."
            tab="notities"
            setTab={setTab}
            className="h-full"
            content={
              <p className="text-sm text-muted-foreground">
                Notities worden alleen in deze browser opgeslagen.
              </p>
            }
            extraAction={
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Nieuwe notitie
                </Button>
              </DialogTrigger>
            }
          />
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Nieuwe notitie</DialogTitle>
              <DialogDescription>
                Schrijf een persoonlijke notitie over deze student. Deze
                notities worden alleen in deze browser opgeslagen.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateNote} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="note-subject">Onderwerp</Label>
                <Input
                  id="note-subject"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  placeholder="Bijv. Huiswerk, gedrag, voortgang"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-text">Notitie</Label>
                <Textarea
                  id="note-text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                  placeholder="Schrijf hier je notitie..."
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNotesDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={!noteText.trim()}>
                  Notitie opslaan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
