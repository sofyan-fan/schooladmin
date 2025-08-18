import { LayoutDashboard } from 'lucide-react';
import LayoutWrapper from '../components/layout/LayoutWrapper';

const ClassLayoutsPage = () => {
  return (
    <LayoutWrapper>
      <div className="flex items-center gap-2">
        <LayoutDashboard className="size-9" />
        <h1 className="text-3xl font-[530]">Onderwijsindeling</h1>
      </div>
      <p>DEZE PAGINA KOMT NOG</p>
    </LayoutWrapper>
  );
};

export default ClassLayoutsPage;
