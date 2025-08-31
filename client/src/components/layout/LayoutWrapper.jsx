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
        <main className="flex-1 overflow-y-auto p-6 bg-background">
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
            background: 'oklch(1 0 0)', // Pure white background
            border: '1.5px solid oklch(0.73 0.1825 127.06)', // Primary blue border
            color: 'oklch(0.24 0.02 250)', // Dark gray text
            boxShadow: '0 4px 12px oklch(0.24 0.02 250 / 0.1)', // Subtle shadow
            borderRadius: '0.75rem', // Matches your --radius
            fontSize: '16px', // Bigger font
            fontWeight: '500', // Medium weight
            padding: '16px 20px', // More padding for better spacing
            minWidth: '300px', // Minimum width
            maxWidth: '500px', // Maximum width to prevent it from being too wide
            width: 'max-content', // Dynamic width based on content
            whiteSpace: 'nowrap', // Prevent text wrapping
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
