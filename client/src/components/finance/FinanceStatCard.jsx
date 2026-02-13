import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function FinanceStatCard({
    icon: Icon,
    title,
    value,
    accentClass,
    valueClass,
    iconSizeClass = 'size-7',
}) {
    return (
        <Card className="flex flex-row items-center p-4 rounded-lg border shadow-sm bg-[#FEFEFD] gap-4">
            <div className={cn('mr-4 rounded-full p-3', accentClass)}>
                {Icon ? <Icon className={iconSizeClass} /> : null}
            </div>
            <div className="flex flex-col gap-1">
                <div className="text-base text-muted-foreground">{title}</div>
                <div className={cn('text-2xl font-semibold', valueClass)}>{value}</div>
            </div>
        </Card>
    );
}


