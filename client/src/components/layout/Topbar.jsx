const Topbar = ({ toggleSidebar }) => {
  return (
    <header className="bg-primary h-16 flex items-center px-6 w-full text-white">
      <button onClick={toggleSidebar} className="md:hidden mr-4">
        ☰
      </button>
      <div className="text-xl font-bold text-white">SchoolAdmin Demo</div>
    </header>
  );
};

export default Topbar;
