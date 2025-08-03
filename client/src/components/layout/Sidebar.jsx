import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/button';

const Sidebar = ({ isOpen }) => {
  const { logout } = useAuth();
  const menuItems = [
    'Dashboard',
    'Leerlingen',
    'Docenten',
    'Financiën',
    'Instellingen',
  ];
  const activeItem = 'Dashboard';

  return (
    <aside
      className={`bg-background-elevated w-64 p-4 h-screen border-r border-border flex flex-col justify-between md:flex ${
        isOpen ? 'flex' : 'hidden'
      }`}
    >
      <div>
        <div className="text-2xl font-bold mb-8 text-text-default">
          SchoolAdmin
        </div>
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item} className="mb-2">
                <a
                  href="#"
                  className={`block p-2 text-text-muted hover:bg-background-highlight rounded-md ${
                    activeItem === item ? 'bg-primary text-white font-bold' : ''
                  }`}
                >
                  {item}
                </a>
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
