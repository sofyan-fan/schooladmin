const Sidebar = ({ isOpen }) => {
  const menuItems = [
    'Dashboard',
    'Leerlingen',
    'Docenten',
    'Financiën',
    'Instellingen',
  ];
  const activeItem = 'Dashboard';

  return (
    <aside
      className={`bg-background-elevated w-64 p-4 h-screen border-r border-border md:block ${
        isOpen ? 'block' : 'hidden'
      }`}
    >
      <div className="text-2xl font-bold mb-8 text-text-default">
        SchoolAdmin
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item} className="mb-2">
              <a
                href="#"
                className={`block p-2 text-text-muted hover:bg-background-highlight rounded-full ${
                  activeItem === item ? 'bg-primary text-white font-bold' : ''
                }`}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
