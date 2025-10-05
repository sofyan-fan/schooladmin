import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

const dayColors = {
  Monday: 'bg-blue-100 text-blue-800',
  Tuesday: 'bg-green-100 text-green-800',
  Wednesday: 'bg-yellow-100 text-yellow-800',
  Thursday: 'bg-purple-100 text-purple-800',
  Friday: 'bg-pink-100 text-pink-800',
  Saturday: 'bg-indigo-100 text-indigo-800',
  Sunday: 'bg-gray-100 text-gray-800',
};

const RosterManagementTable = ({ rosters, onEdit, onDelete, onView }) => {
  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klas</TableHead>
            <TableHead>Vak</TableHead>
            <TableHead>Docent</TableHead>
            <TableHead>Lokaal</TableHead>
            <TableHead>Dag</TableHead>
            <TableHead>Tijd</TableHead>
            <TableHead className="w-[70px]">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rosters.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                Geen roosters gevonden. Klik op "Rooster Toevoegen" om te
                beginnen.
              </TableCell>
            </TableRow>
          ) : (
            rosters.map((roster) => (
              <TableRow key={roster.id}>
                <TableCell className="font-medium">
                  {roster.class_layout?.name || 'Geen klas'}
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {roster.subject?.name || 'Geen vak'}
                  </span>
                </TableCell>
                <TableCell>
                  {roster.teacher
                    ? `${roster.teacher.first_name} ${roster.teacher.last_name}`
                    : 'Geen docent'}
                </TableCell>
                <TableCell>{roster.classroom?.name || 'Geen lokaal'}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      dayColors[roster.day_of_week] ||
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {roster.day_of_week}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatTime(roster.start_time)} -{' '}
                    {formatTime(roster.end_time)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(roster)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Bekijken
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(roster)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(roster)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RosterManagementTable;


