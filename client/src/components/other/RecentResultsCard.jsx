import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Check, TrendingDown, TrendingUp } from 'lucide-react';



export function RecentResultsCard({
  studentStats,
  className = '',
  onOpenResults,
}) {
  const stats = studentStats || {
    lastResult: {
      grade: 5,
      date: '2025-09-26',
      assessment: { name: 'Praktijk Toets' },
    },
    avg: 5.0,
    resultsCount: 1,
  };

  const lastGrade =
    typeof stats?.lastResult?.grade === 'number'
      ? stats.lastResult.grade
      : Number(stats?.lastResult?.grade);

  const avgNumber =
    typeof stats?.avg === 'number' ? stats.avg : Number(stats?.avg);
  const avgValue = Number.isFinite(avgNumber) ? avgNumber : 0;

  const thresholdPass = 5.5;
  const thresholdGood = 6.5;

  const getPerfLevel = (val) => {
    if (!Number.isFinite(val)) return 'neutral';
    if (val < thresholdPass) return 'fail';
    if (val < thresholdGood) return 'pass';
    return 'good';
  };

  const colorsByLevel = {
    fail: { bar: 'oklch(0.72 0.18 25)', text: 'text-red-700' },
    pass: { bar: 'oklch(0.85 0.15 90)', text: 'text-amber-700' },
    good: { bar: 'oklch(0.7805 0.1825 127.06)', text: 'text-emerald-700' },
    neutral: { bar: 'oklch(0.65 0.03 255)', text: 'text-muted-foreground' },
  };

  const avgLevel = getPerfLevel(avgValue);
  const avgColor = colorsByLevel[avgLevel];

  const epsilon = 0.05;
  const trendDir =
    Number.isFinite(lastGrade) && Number.isFinite(avgNumber)
      ? lastGrade - avgNumber > epsilon
        ? 'up'
        : lastGrade - avgNumber < -epsilon
        ? 'down'
        : 'flat'
      : 'flat';
  const TrendIcon =
    trendDir === 'up'
      ? TrendingUp
      : trendDir === 'down'
      ? TrendingDown
      : ArrowRight;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpenResults?.()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenResults?.();
        }
      }}
      className={[
        'gap-4 py-5 h-full cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        className,
      ].join(' ')}
    >
      <CardHeader className="gap-0 pb-0">
        <CardTitle className="text-2xl flex items-center gap-3 text-regular font-medium">
          <TrendIcon className="size-7" />
          Resultaten
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-0 flex-1">
        <section className="rounded-lg bg-muted/50 px-5 py-2 flex flex-col items-center text-center gap-2.5">
          <div className="text-xl text-muted-foreground">Gemiddelde</div>
          <div className="tabular-nums text-5xl font-semibold leading-none">
            {Number.isFinite(avgNumber) ? avgValue.toFixed(1) : '—'}
          </div>
         
          {/* BONUS: Added conditional rendering for the passing grade text */}
          {avgValue >= thresholdPass && (
            <span
              className={`inline-flex items-center gap-1 text-lg ${avgColor.text}`}
            >
              <Check className="h-3.5 w-3.5" /> Voldoet aan norm
            </span>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
