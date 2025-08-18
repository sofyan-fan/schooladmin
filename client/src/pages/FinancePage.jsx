import LayoutWrapper from '../components/layout/LayoutWrapper';
import { CircleDollarSign } from 'lucide-react';
const FinancePage = () => {
  return (
    <LayoutWrapper>
      <div className="flex items-center gap-2">
        <CircleDollarSign className="size-9" />
        <h1 className="text-3xl font-[530]">Financiën</h1>
      </div>
      <p>DEZE PAGINA KOMT NOG</p>
    </LayoutWrapper>
  );
};

export default FinancePage;
