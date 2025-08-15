import { useAuth } from '@/hooks/useAuth';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  return (
    <header className="bg-primary h-16 flex items-center justify-end px-6 w-full text-white">
      <button onClick={toggleSidebar} className="md:hidden mr-4">
        ☰
      </button>


      {user && (
        <div className="flex items-center space-x-4">
          <span>Welkom, {user.email}</span>
         
        </div>
      )}
    </header>
  );
};

export default Topbar;
