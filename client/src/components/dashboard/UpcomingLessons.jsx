import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UpcomingLessons({ lessons = [], loading = false }) {
  // optional status coloring for the time chip
  const timeStatus = (range) => {
    // expects "HH:MM - HH:MM"
    if (!range?.includes(':')) return 'later';
    const [s, e] = range.split('-').map((t) => t.trim());
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    const now = new Date();
    const start = new Date();
    start.setHours(sh, sm, 0, 0);
    const end = new Date();
    end.setHours(eh, em, 0, 0);

    if (now >= start && now <= end) return 'now';
    // within the next 60 minutes
    if (now < start && start - now <= 60 * 60 * 1000) return 'soon';
    return 'later';
  };

  const timePill = (t) =>
    cn(
      'shrink-0 rounded-full px-2.5 py-1 font-mono text-xs tabular-nums shadow-sm ring-1',
      {
        now: 'bg-[#e6f4d5] text-[#2f6b00] ring-[#d6ecbf]', // green tint, matches your theme
        soon: 'bg-amber-100 text-amber-900 ring-amber-200', // soft warning for next up
        later: 'bg-secondary text-secondary-foreground ring-secondary',
      }[timeStatus(t)]
    );

  return (
    <Card className="rounded-xl border shadow-sm bg-card gap-1 text-regular">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-[17px] md:text-lg">
            Komende lessen
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal text-base">
              vandaag
            </Badge>
            <Button
              asChild
              size="sm"
              className="bg-[#88bb18] text-white hover:bg-[#78a615]"
              aria-label="Naar rooster"
              title="Naar rooster"
            >
              <Link to="/roosters">
                Rooster
                <ChevronRight className=" h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="max-h-72 min-h-72 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 py-3" aria-live="polite">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4"
                >
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              Geen lessen vandaag
            </div>
          ) : (
            <ul
              className="divide-y divide-border"
              role="list"
              aria-label="Komende lessen"
            >
              {lessons.slice(0, 5).map((l, idx) => (
                <li key={idx} className="py-3">
                  <Link
                    to="/roosters"
                    className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-lg px-2 text-left transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[15px] md:text-base font-medium text-foreground">
                        {l.title}
                      </div>
                      <div className="mt-0.5 text-xs md:text-sm text-muted-foreground truncate">
                        {l.group && <span>{l.group}</span>}
                        {l.group && l.classroom && (
                          <span className="mx-1">·</span>
                        )}
                        {l.classroom && <span>{l.classroom}</span>}
                      </div>
                    </div>

                    <span className={timePill(l.time)}>
                      {/* use <time> for a11y if you store ISO times */}
                      {l.time}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
