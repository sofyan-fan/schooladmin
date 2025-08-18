import { useAuth } from '@/hooks/useAuth';
import {
  CircleDollarSign,
  GraduationCap,
  Home,
  Layers,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Presentation,
  Settings,
  Component,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ClassIcon from '../../assets/class.svg?react';
import { Button } from '../ui/button';

const Sidebar = ({ isOpen }) => {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  // Store components, not elements
  const menuItems = [
    { name: 'Dashboard', path: 'dashboard', Icon: Home },
    { name: 'Leerlingen', path: 'leerlingen', Icon: GraduationCap },
    { name: 'Docenten', path: 'docenten', Icon: Presentation },
    { name: 'Klassen', path: 'klassen', Icon: Users },
    { name: 'Vakken', path: 'vakken', Icon: LibraryBig },
    { name: 'Modules', path: 'modules', Icon: Component },
    { name: 'Lespakketten', path: 'lespakketten', Icon: Layers },
    {
      name: 'Onderwijsindeling',
      path: 'onderwijsindeling',
      Icon: LayoutDashboard,
    },
    { name: 'Financiën', path: 'financien', Icon: CircleDollarSign },
    { name: 'Instellingen', path: 'instellingen', Icon: Settings },
  ];

  const firstSegment = pathname.split('/')[1] || '';
  const activeItem =
    menuItems.find((item) => item.path.toLowerCase() === firstSegment) ||
    menuItems[0];

  return (
    <aside
      className={`bg-background-elevated w-64 p-4 h-screen border-r border-border flex flex-col justify-between md:flex ${
        isOpen ? 'flex' : 'hidden'
      }`}
    >
      <div>
        <div className="flex w-full items-center gap-2 text-2xl font-bold mb-8 text-text-default">
          <GraduationCap className="size-10" />
          Maktab
        </div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.name} className="mb-2">
                <Link
                  to={`/${item.path.toLowerCase()}`}
                  className={`block p-2 text-text-muted hover:bg-background-highlight rounded-md ${
                    activeItem.name === item.name
                      ? 'bg-primary text-white font-bold'
                      : ''
                  }`}
                >
                  <div className="flex items-center">
                    <item.Icon className="size-4 mr-2" />
                    {item.name}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <Button onClick={logout} className="w-full cursor-pointer">
        Logout <LogOut />
      </Button>
    </aside>
  );
};

export default Sidebar;
