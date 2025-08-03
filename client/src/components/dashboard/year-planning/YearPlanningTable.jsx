import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileDown, Pencil, Plus, Trash2 } from 'lucide-react';

const YearPlanningTable = ({
  items,
  onEditClick,
  onDeleteClick,
  onAddClick,
  onExportClick,
}) => {
  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wide text-neutral-600">
        <TableRow>
          <TableHead>Activiteit</TableHead>
          <TableHead>Datum</TableHead>
          {/* <TableHead>Tijd</TableHead> */}
          <TableHead className="text-right">
            <div className="flex items-center justify-end">
              {/* <span>Acties</span> */}
              <Button
                variant="default"
                size="sm"
                className="ml-4 bg-primary text-white hover:cursor-pointer hover:bg-lime-500"
                onClick={onAddClick}
              >
                <Plus className="h-4 w-4 mr-2" />
                Toevoegen
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 cursor-pointer hover:bg-primary hover:text-white"
                onClick={onExportClick}
              >
                <FileDown className="size-8 cursor-pointer" />
              </Button>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          console.log("item: ", item),
          <TableRow
            key={index}
            className="border-b border-neutral-200 hover:bg-neutral-50 text-lg text-neutral-700"
          >
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell> {item.date.split('T')[0]}</TableCell>
            {/* <TableCell>{item.time}</TableCell> */}
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:bg-primary hover:text-white rounded-full"
                  onClick={() => onEditClick(item)}
                >
                  <Pencil className="size-6 " />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:bg-primary hover:text-white rounded-full"
                  onClick={() => onDeleteClick(item)}
                >
                  <Trash2 className="size-6 " />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default YearPlanningTable;
