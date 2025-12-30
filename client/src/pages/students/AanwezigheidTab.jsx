import { AttendanceCard } from '@/components/other/AttendanceCard';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';

const statusMeta = {
  present: {
    label: 'Aanwezig',
    className: 'bg-green-600 text-white hover:bg-green-600',
  },
  late: {
    label: 'Te Laat',
    className: 'bg-orange-500 text-white hover:bg-orange-500',
  },
  absent: {
    label: 'Afwezig',
    className: 'bg-red-500 text-white hover:bg-red-500',
  },
  sick: {
    label: 'Ziek',
    className: 'bg-rose-600 text-white hover:bg-rose-600',
  },
};

export default function AanwezigheidTab({
  attendance,
  klassName,
  title = 'Alle Aanwezigheidsregistraties',
}) {
  const stats = attendance?.stats || {
    present: 0,
    late: 0,
    absent: 0,
    presentPct: 0,
    donutData: [],
  };
  const rows = Array.isArray(attendance?.rows) ? attendance.rows : [];
  const totals = attendance?.totals || {
    total: rows.length,
    present: 0,
    late: 0,
    absent: 0,
    sick: 0,
  };
  const rangeLabel = attendance?.rangeLabel || 'Laatste 30 dagen';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {/* <CardDescription>
          {`Gedetailleerd overzicht (${rangeLabel.toLowerCase()}).`}
        </CardDescription> */}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <AttendanceCard
            stats={stats}
            title="Aanwezigheid"
            description={rangeLabel}
            className="min-h-[220px]"
            colorVars={{
              present: 'oklch(0.7805 0.1825 127.06)',
              late: 'oklch(0.88 0.12 95)',
              absent: 'oklch(0.67 0.22 28)',
            }}
          />
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Samenvatting</CardTitle>
              <CardDescription>Snelle tellingen.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Totaal lessen</span>
                <span className="font-medium">{totals.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Aanwezig</span>
                <span className="font-medium">{totals.present || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Te laat</span>
                <span className="font-medium">{totals.late || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Afwezig</span>
                <span className="font-medium">{totals.absent || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ziek</span>
                <span className="font-medium">{totals.sick || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Datum</TableHead>
                <TableHead>Les / Klas</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const meta = statusMeta[r.status] || statusMeta.absent;
                const displayClass = r.className || klassName || '—';
                const displayTime =
                  r.startTime && r.endTime ? `${r.startTime}–${r.endTime}` : '';

                return (
                  <TableRow key={r.key}>
                    <TableCell className="whitespace-nowrap">
                      {r.date
                        ? format(new Date(r.date), 'dd-MM-yyyy', { locale: nl })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[220px]">
                        <div className="font-medium">
                          {r.lessonName || 'Les'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {displayClass}
                          {displayTime ? ` • ${displayTime}` : ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <Badge className={meta.className} variant="default">
                          {meta.label}
                        </Badge>
                        {r.reason && r.status !== 'present' ? (
                          <span className="text-xs text-muted-foreground">
                            Reden: {r.reason}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Geen lessen gevonden voor deze periode.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
