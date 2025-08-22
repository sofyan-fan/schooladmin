import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import AppSidebar from './SidebarComponent';
import Topbar from './Topbar';

const LayoutWrapper = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children ? children : <Outlet />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LayoutWrapper;
