import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  BookCheck,
  CalendarDays,
  CircleDollarSign,
  Component,
  GraduationCap,
  Home,
  Layers,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  PanelLeft,
  Presentation,
  Settings,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';

const SidebarComponent = () => {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const { toggleSidebar } = useSidebar();

  const menuItems = [
    { name: 'Dashboard', path: 'dashboard', Icon: Home },
    { name: 'Leerlingen', path: 'leerlingen', Icon: GraduationCap },
    { name: 'Docenten', path: 'docenten', Icon: Presentation },
    { name: 'Klassen', path: 'klassen', Icon: Users },
    { name: 'Roosters', path: 'rooster', Icon: CalendarDays },
    { name: 'Vakken', path: 'vakken', Icon: LibraryBig },
    { name: 'Modules', path: 'modules', Icon: Component },
    { name: 'Lespakketten', path: 'lespakketten', Icon: Layers },
    { name: 'Toetsen & Examens', path: 'toetsen-en-examens', Icon: BookCheck },
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
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex w-full items-center gap-2 text-2xl font-bold mb-8 text-text-default">
          <GraduationCap className="size-10" />
          <span
            className={cn(
              'transition-opacity duration-150 ease-in-out',
              'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
            )}
          >
            Maktab
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={activeItem.name === item.name}
                  tooltip={item.name}
                >
                  <Link to={`/${item.path.toLowerCase()}`}>
                    <item.Icon className="size-10 mr-1" />
                    <span
                      className={cn(
                        'transition-opacity text-base duration-150 ease-in-out',
                        'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="inline-flex md:hidden"
        >
          <PanelLeft />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Button
          onClick={logout}
          className="w-full cursor-pointer"
          tooltip="Logout"
        >
          Logout
          <LogOut />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarComponent;
