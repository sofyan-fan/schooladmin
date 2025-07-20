import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';

const YearPlanning = ({ items }) => {
  return (
    <Card className="overflow-hidden rounded-lg border-amber-200 py-0 shadow-sm bg-white">
      {/* <CardHeader>
        <CardTitle>Jaarplanning</CardTitle>
        <CardDescription>
          Een overzicht van alle gebeurtenissen.
        </CardDescription>
      </CardHeader> */}
      <Table>
        <TableHeader className="bg-white text-xs uppercase tracking-wide text-neutral-600">
          <TableRow>
            <TableHead>Activiteit</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Tijd</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={index}
              className="border-b border-neutral-200 hover:bg-neutral-50 text-lg text-neutral-700"
            >
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>{item.date}</TableCell>
              <TableCell>{item.time}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-x-2">
                  <Button variant="ghost" size="icon" className="cursor-pointer">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-error hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 " />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default YearPlanning;
