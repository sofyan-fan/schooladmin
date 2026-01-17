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
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FDFBF7]"
          style={{
            paddingLeft: `max(1rem, env(safe-area-inset-left))`,
            paddingRight: `max(1rem, env(safe-area-inset-right))`,
            paddingBottom: `max(1rem, env(safe-area-inset-bottom))`,
          }}
        >
          {children ? children : <Outlet />}
        </div>
      </SidebarInset>
      <Toaster
        position="top-center"
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
            minWidth: '280px',
            maxWidth: '90vw',
            width: 'max-content',
            whiteSpace: 'normal',
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
