import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import {
  Users,
  DoorOpen,
  Clock,
  LayoutDashboard,
} from 'lucide-react';

const items = [
  {
    name: 'Klassen',
    description: 'Beheer klassen en groepen',
    icon: Users,
    to: '/klassen',
  },
  {
    name: 'Leslokalen',
    description: 'Beheer lokalen en capaciteit',
    icon: DoorOpen,
    to: '/lokalen',
  },
  {
    name: 'Roosters',
    description: 'Bekijk en beheer roosters',
    icon: Clock,
    to: '/roosters',
  },
  {
    name: 'Klas Planning',
    description: 'Planlessen en klasindeling',
    icon: LayoutDashboard,
    to: '/class-schedule',
  },
];

const EducationPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-regular">Onderwijs</h1>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} to={item.to} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {item.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-regular">
                  {item.description}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default EducationPage;


