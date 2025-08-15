import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';

const Sidebar = ({ isOpen }) => {
  
  const { logout } = useAuth();

  const { pathname } = useLocation();
  const menuItems = [
    'Dashboard',
    'Leerlingen',
    'Vakken',
    'Lespakketten',
    'Docenten',
    'Financiën',
    'Instellingen',
  ];

  const firstSegment = pathname.split('/')[1] || '';

  const activeItem =
    menuItems.find((item) => item.toLowerCase() === firstSegment) ||
    'Dashboard';

  return (
    <aside
      className={`bg-background-elevated w-64 p-4 h-screen border-r border-border flex flex-col justify-between md:flex ${
        isOpen ? 'flex' : 'hidden'
      }`}
    >
      <div>
        <div className="text-2xl font-bold mb-8 text-text-default">
          Claro
        </div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item} className="mb-2">
                <Link
                  to={`/${item.toLowerCase()}`}
                  className={`block p-2 text-text-muted hover:bg-background-highlight rounded-md ${
                    activeItem === item ? 'bg-primary text-white font-bold' : ''
                  }`}
                >
                  {item}
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
