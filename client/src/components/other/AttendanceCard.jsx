import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { UserCheck } from 'lucide-react';
import { Pie, PieChart } from 'recharts';

// Labels for the tooltip/legend. No colors here so parent CSS vars can control hues.
const chartConfig = {
  present: { label: 'Aanwezig' },
  late: { label: 'Te Laat' },
  absent: { label: 'Afwezig' },
};

export function AttendanceCard({
  stats,
  title = 'Aanwezigheid',
  description,
  className,
  style,
  colorVars,
  onOpenAttendance,
}) {
  const present = stats?.present ?? 0;
  const late = stats?.late ?? 0;
  const absent = stats?.absent ?? 0;
  const presentPct = stats?.presentPct ?? 0;
  const donutData = stats?.donutData ?? [];

  const legendItems = [
    {
      label: 'Aanwezig',
      value: present,
      colorClass: 'bg-[var(--color-present)]',
    },
    {
      label: 'Te Laat',
      value: late,
      colorClass: 'bg-[var(--color-late)]',
    },
    {
      label: 'Afwezig',
      value: absent,
      colorClass: 'bg-[var(--color-absent)]',
    },
  ];

  const cssVars = {
    '--color-present': colorVars?.present ?? 'oklch(0.78 0.14 145)',
    '--color-late': colorVars?.late ?? 'oklch(0.88 0.12 95)',
    '--color-absent': colorVars?.absent ?? 'oklch(0.67 0.22 28)',
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpenAttendance?.()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenAttendance?.();
        }
      }}
      className={[
        'flex flex-col h-full cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        className,
      ].join(' ')}
      style={{ ...cssVars, ...style }}
    >
      <CardHeader className="pb-0">
        <CardTitle className="text-2xl flex items-center gap-3 font-medium text-regular">
          <UserCheck className="size-8 " /> {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {/* <div className="text-xs text-muted-foreground pt-1">{timeframe}</div> */}
      </CardHeader>

      {/* --- CORRECTED LAYOUT STARTS HERE --- */}
      <CardContent className="flex w-full justify-center gap-10 px-2 pt-0">
        {/* Donut Chart */}
        <div className="relative flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="absolute h-full w-full"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                innerRadius={44}
                outerRadius={60}
                strokeWidth={5}
                isAnimationActive={false}
              />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col items-center leading-none">
            <span className="text-3xl font-semibold">{presentPct}%</span>
          </div>
        </div>

        <div className="flex flex-col justify-center items-start gap-3">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${item.colorClass}`}
              />
              <span className="text-base font-medium leading-none">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
