import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart,
  BookCheck,
  ChevronDown,
  CircleDollarSign,
  Clock,
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
  UserCheck,
} from 'lucide-react';

import { useLayoutEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

import { useAuth } from '@/hooks/useAuth';

// const user_role = useAuth();
// console.log('user_role', user_role);

const SidebarComponent = () => {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const { toggleSidebar } = useSidebar();
  const firstSegment = pathname.split('/')[1] || '';
  const navigate = useNavigate();

  const role = (user?.role || '').toLowerCase();
  const hasRole = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return true;
    return roles.map((r) => String(r).toLowerCase()).includes(role);
  };

  const allMenuItems = [
    {
      name: 'Dashboard',
      path: 'dashboard',
      Icon: Home,
      roles: ['admin', 'teacher', 'student'],
    },
    {
      name: 'Leerlingen',
      path: 'leerlingen',
      Icon: GraduationCap,
      roles: ['admin'],
    },
    {
      name: 'Docenten',
      path: 'docenten',
      Icon: Presentation,
      roles: ['admin'],
    },
    {
      name: 'Onderwijs',
      path: 'onderwijs',
      Icon: LayoutDashboard,
      subItems: [
        { name: 'Klassen', path: 'klassen', roles: ['admin'] },
        { name: 'Leslokalen', path: 'lokalen', roles: ['admin'] },
        { name: 'Roosters', path: 'roosters', roles: ['admin'] },
        { name: 'Klas Planning', path: 'class-schedule', roles: ['admin'] },
      ],
    },
    { name: 'Vakken', path: 'vakken', Icon: LibraryBig, roles: ['admin'] },
    { name: 'Modules', path: 'modules', Icon: Component, roles: ['admin'] },
    {
      name: 'Lespakketten',
      path: 'lespakketten',
      Icon: Layers,
      roles: ['admin'],
    },
    {
      name: 'Toetsen & Examens',
      path: 'toetsen-en-examens',
      Icon: BookCheck,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Resultaten',
      path: 'resultaten',
      Icon: BarChart,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Tijd Registratie',
      path: 'tijd-registratie',
      Icon: Clock,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Afwezigheid',
      path: 'afwezigheid',
      Icon: UserCheck,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Financiën',
      path: 'financien',
      Icon: CircleDollarSign,
      roles: ['admin'],
    },
    {
      name: "Qur'an Log",
      path: 'quran-log',
      Icon: LibraryBig,
      roles: ['admin', 'teacher'],
    },
    {
      name: 'Instellingen',
      path: 'instellingen',
      Icon: Settings,
      roles: ['admin', 'teacher', 'student'],
    },
  ];

  const filterItemsForRole = (items) => {
    return items.reduce((acc, item) => {
      if (Array.isArray(item.subItems) && item.subItems.length > 0) {
        const visibleSub = item.subItems.filter((s) => hasRole(s.roles));
        if (visibleSub.length > 0) {
          acc.push({ ...item, subItems: visibleSub });
        }
      } else if (hasRole(item.roles)) {
        acc.push(item);
      }
      return acc;
    }, []);
  };

  const menuItems = filterItemsForRole(allMenuItems);

  const getActiveItemName = () => {
    if (!Array.isArray(menuItems) || menuItems.length === 0) return '';
    const parentMatch = menuItems.find((item) =>
      item.subItems?.some((sub) => sub.path.toLowerCase() === firstSegment)
    );
    if (parentMatch) return parentMatch.name;

    const directMatch = menuItems.find(
      (item) => item.path?.toLowerCase() === firstSegment
    );
    if (directMatch) return directMatch.name;

    // No default highlight when on routes outside the main menu (e.g., student "Mijn Gegevens")
    return '';
  };

  const activeItemName = getActiveItemName();
  const isOnderwijsActive = activeItemName === 'Onderwijs';

  const [onderwijsOpen, setOnderwijsOpen] = useState(isOnderwijsActive);

  useLayoutEffect(() => {
    setOnderwijsOpen(isOnderwijsActive);
  }, [isOnderwijsActive]);

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="mb-8 flex w-full items-center gap-2 text-2xl font-bold text-text-default">
          <GraduationCap className="size-10" />
          <span
            className={cn(
              'transition-opacity duration-150 ease-in-out',
              'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
            )}
          >
            MaktApp
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {(user?.role || '').toLowerCase() === 'student' ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={firstSegment === 'mijn-profiel'}
                  variant={
                    firstSegment === 'mijn-profiel' ? 'collapse' : 'default'
                  }
                  tooltip="Mijn Gegevens"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/mijn-profiel`);
                  }}
                >
                  <Link to={`/mijn-profiel`}>
                    <GraduationCap />
                    <span
                      className={cn(
                        'transition-opacity duration-150 ease-in-out',
                        'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
                      )}
                    >
                      Mijn Gegevens
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null}
            {menuItems.map((item) =>
              item.subItems ? (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => {
                      setOnderwijsOpen(!onderwijsOpen);
                      navigate('/onderwijs');
                    }}
                    isActive={activeItemName === item.name}
                    tooltip={item.name}
                    className="cursor-pointer"
                  >
                    <item.Icon />
                    <span
                      className={cn(
                        'transition-opacity duration-150 ease-in-out',
                        'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
                      )}
                    >
                      {item.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        'ml-auto size-4 transition-transform duration-200',
                        onderwijsOpen && 'rotate-180',
                        'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
                      )}
                    />
                  </SidebarMenuButton>
                  <AnimatePresence initial={false}>
                    {onderwijsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                        transition={{
                          duration: 0.085,
                          ease: 'easeOut',
                        }}
                      >
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.name}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  firstSegment === subItem.path.toLowerCase()
                                }
                              >
                                <Link to={`/${subItem.path.toLowerCase()}`}>
                                  {subItem.name}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeItemName === item.name}
                    variant={
                      activeItemName === item.name ? 'collapse' : 'default'
                    }
                    tooltip={item.name}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/${item.path.toLowerCase()}`);
                    }}
                  >
                    <Link to={`/${item.path.toLowerCase()}`}>
                      <item.Icon />
                      <span
                        className={cn(
                          'transition-opacity duration-150 ease-in-out',
                          'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden'
                        )}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="inline-flex md:hidden"
        >
          <PanelLeft />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Button onClick={logout} tooltip="Logout">
          <span
            className={cn(
              'w-full cursor-pointer',
              'group-data-[collapsible=icon]:hidden'
            )}
          >
            Logout
          </span>
          <LogOut />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarComponent;
