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
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookCheck,
  ChevronDown,
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
} from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

const SidebarComponent = () => {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const { toggleSidebar } = useSidebar();
  const firstSegment = pathname.split('/')[1] || '';
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: 'dashboard', Icon: Home },
    { name: 'Leerlingen', path: 'leerlingen', Icon: GraduationCap },
    { name: 'Docenten', path: 'docenten', Icon: Presentation },
    {
      name: 'Onderwijs',
      Icon: LayoutDashboard,
      subItems: [
        { name: 'Klassen', path: 'klassen' },
        { name: 'Leslokalen', path: 'lokalen' },
        { name: 'Roosters', path: 'roosters' },
      ],
    },
    { name: 'Vakken', path: 'vakken', Icon: LibraryBig },
    { name: 'Modules', path: 'modules', Icon: Component },
    { name: 'Lespakketten', path: 'lespakketten', Icon: Layers },
    { name: 'Toetsen & Examens', path: 'toetsen-en-examens', Icon: BookCheck },
    { name: 'Financiën', path: 'financien', Icon: CircleDollarSign },
    { name: 'Instellingen', path: 'instellingen', Icon: Settings },
  ];

  const getActiveItemName = () => {
    const parentMatch = menuItems.find((item) =>
      item.subItems?.some((sub) => sub.path.toLowerCase() === firstSegment)
    );
    if (parentMatch) return parentMatch.name;

    const directMatch = menuItems.find(
      (item) => item.path?.toLowerCase() === firstSegment
    );
    if (directMatch) return directMatch.name;

    return menuItems[0].name;
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
            Maktab
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) =>
              item.subItems ? (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => setOnderwijsOpen(!onderwijsOpen)}
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
