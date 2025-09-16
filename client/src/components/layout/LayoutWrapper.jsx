import { CheckCircle, XCircle } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import AppSidebar from './SidebarComponent';
import Topbar from './Topbar';

const LayoutWrapper = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 bg-[#FDFBF7]">
          {children ? children : <Outlet />}
        </main>
      </SidebarInset>
      <Toaster
        position="top-right"
        icons={{
          success: <CheckCircle className="size-6 text-primary" />,
          error: <XCircle className="size-6 text-destructive" />,
        }}
        toastOptions={{
          style: {
            background: 'oklch(1 0 0)',
            border: '1px solid oklch(0.73 0.1825 127.06)',
            color: 'oklch(0.24 0.02 250)',
            boxShadow: '0 4px 12px oklch(0.24 0.02 250 / 0.1)',
            borderRadius: '0.75rem',
            fontSize: '16px',
            fontWeight: '500',
            padding: '16px 20px',
            minWidth: '300px',
            maxWidth: '500px',
            width: 'max-content',
            whiteSpace: 'nowrap',
            flexDirection: 'row',
            gap: '10px',
          },
          duration: 3000,
        }}
      />
    </SidebarProvider>
  );
};

export default LayoutWrapper;
