import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { PanelLeft } from 'lucide-react';

const Topbar = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-10 bg-primary h-14 flex items-center px-4 w-full text-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 mr-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:inline-flex -ml-2.5"
        >
          <PanelLeft className="size-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <PanelLeft className="size-4 " />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>

      {user && (
        <div className="flex items-center space-x-4 min-w-0 max-w-[50%] sm:max-w-none">
          <span className="truncate text-sm sm:text-base">Welkom, {user.email}</span>
        </div>
      )}
    </header>
  );
};

export default Topbar;
