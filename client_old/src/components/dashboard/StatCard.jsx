import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatCard = ({ title, value, icon }) => {
  return (
    <Card className="p-4 rounded-lg shadow-md bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-text-muted">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-text-default">{value}</div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
