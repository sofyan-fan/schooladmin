import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, link }) => {
  return (
    <Link to={link}>
    <Card className="flex flex-row px-2 py-4 justify-center rounded-lg border-[#ffe18fb3] shadow-sm bg-[#FEFEFD]">
      <div className="flex flex-row items-center justify-end space-y-0 pb-2 w-1/6">
        {icon}
      </div>
      {/* <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

        <CardTitle className="text-lg font-bold text-text-muted">
          {title}
        </CardTitle>
      </CardHeader> */}
      <CardContent className="flex flex-col">
        <CardTitle className="text-lg font-medium text-text-muted">{title}</CardTitle>
        <div className="text-4xl font-medium text-text-default">{value}</div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default StatCard;
