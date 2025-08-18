import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const PageHeader = ({ title, icon, description, buttonText, onAdd }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-3xl font-[530]">{title}</h1>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <Button onClick={onAdd}>
      <Plus className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  </div>
);

export default PageHeader;
