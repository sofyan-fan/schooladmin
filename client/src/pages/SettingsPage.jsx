import LayoutWrapper from '../components/layout/LayoutWrapper';
import { Settings } from 'lucide-react';
const SettingsPage = () => {
  return (
    <LayoutWrapper>
      <div className="flex items-center gap-2">
        <Settings className="size-9" />
        <h1 className="text-3xl font-[530]">Instellingen</h1>
      </div>
      <p>DEZE PAGINA KOMT NOG</p>
    </LayoutWrapper>
  );
};

export default SettingsPage;
