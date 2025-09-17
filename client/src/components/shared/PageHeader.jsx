import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const PageHeader = ({
  title,
  icon,
  description,
  buttonText,
  onAdd,
  children,
  className,
}) => (
  <div className={cn('flex justify-between items-center mb-6', className)}>
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h1 className="text-3xl font-[530]">{title}</h1>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
    {children ? (
      children
    ) : onAdd ? (
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    ) : null}
  </div>
);

export default PageHeader;
