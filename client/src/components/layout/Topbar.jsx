import { useAuth } from '@/hooks/useAuth';

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  console.log("user: ", user);
  return (
    <header className="bg-primary h-16 flex items-center justify-end px-6 w-full text-white">
      <button onClick={toggleSidebar} className="md:hidden mr-4">
        ☰
      </button>

      {/* <div className="flex-1 text-xl font-bold">SchoolAdmin Demo</div> */}

      {user && (
        <div className="flex items-center space-x-4">
          <span>Welkom, {user.email}</span>
          <button
            onClick={logout}
            className="underline text-sm hover:text-gray-200"
          >
            Uitloggen
          </button>
        </div>
      )}
    </header>
  );
};

export default Topbar;
