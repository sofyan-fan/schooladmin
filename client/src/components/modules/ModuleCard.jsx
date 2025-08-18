import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Eye, MoreVertical, Trash2 } from 'lucide-react';

export const ModuleCard = ({ module, onEdit, onDelete, onView }) => {
  const { name, subjects = [] } = module;

  return (
    <Card className="flex flex-col h-full border hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{name}</CardTitle>
            <CardDescription>
              {subjects.length > 0
                ? `Bevat ${subjects.length} ${
                    subjects.length === 1 ? 'vak' : 'vakken'
                  }`
                : 'Nog geen vakken'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">Acties</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="mr-2 h-4 w-4" />
                <span>Bekijken</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Bewerken</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Verwijderen</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        {subjects.length > 0 ? (
          <div className="space-y-4 text-sm">
            <ul className="space-y-3">
              {subjects.map((item, idx) => (
                <li key={idx} className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {item.subjectName || item.subjectId}
                  </span>
                  <span className="text-muted-foreground">
                    Niveau: {item.level}, Literatuur: {item.material}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground italic">
              Voeg vakken toe om dit module inhoud te geven.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
