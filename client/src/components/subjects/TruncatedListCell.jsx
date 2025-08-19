import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const TruncatedListCell = ({ items }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const firstItem = items[0];

  if (items.length === 1) {
    return <span className="truncate">{firstItem}</span>;
  }

  const remainingCount = items.length - 1;

  return (
    <div className="flex items-center space-x-2">
      <span className="truncate" title={firstItem}>
        {firstItem}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="cursor-pointer rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/80">
            +{remainingCount} more
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs p-3">
          <ul className="space-y-1.5">
            {items.map((item, index) => (
              <li key={index} className="text-sm">
                {item}
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TruncatedListCell;
