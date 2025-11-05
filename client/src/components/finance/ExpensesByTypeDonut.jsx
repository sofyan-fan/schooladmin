import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

export default function ExpensesByTypeDonut({
    title = 'Uitgaven per type',
    expenseByType,
    donutColors = ['#6366F1', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6'],
}) {
    const donutTotal = Array.isArray(expenseByType)
        ? expenseByType.reduce((sum, e) => sum + Number(e.value || 0), 0)
        : 0;

    return (
        <Card className="p-4 md:p-6 gap-0">
            <CardHeader className="p-0 mb-3">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr] md:items-center gap-0">
                    <div className="order-2 md:order-1">
                        {Array.isArray(expenseByType) && expenseByType.length > 0 ? (
                            <ul className="flex flex-col gap-2 min-w-0">
                                {expenseByType.map((entry, idx) => {
                                    const color = donutColors[idx % donutColors.length];
                                    const pct = donutTotal ? Math.round((Number(entry.value) / donutTotal) * 100) : 0;
                                    return (
                                        <li key={entry.name + idx} className="flex items-center justify-between gap-3 px-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                <span className="text-xl font-medium truncate" title={entry.name}>
                                                    {entry.name}
                                                </span>
                                            </div>
                                            <span className="text-base text-muted-foreground tabular-nums w-12 text-right">{pct}%</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-sm text-muted-foreground">Geen gegevens</div>
                        )}
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="relative h-[200px] md:h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie
                                        data={expenseByType}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="85%"
                                        paddingAngle={1}
                                    >
                                        {Array.isArray(expenseByType) && expenseByType.map((_, idx) => (
                                            <Cell key={`cell-${idx}`} fill={donutColors[idx % donutColors.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


