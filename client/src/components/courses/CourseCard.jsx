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

export const CourseCard = ({ course, onEdit, onDelete, onView }) => {
  if (!course) {
    return null;
  }

  const { name, description, price, modules = [] } = course;

  return (
    <Card className="flex flex-col h-full border hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{name}</CardTitle>
            <CardDescription>
              {description ||
                (modules.length > 0
                  ? `Bevat ${modules.length} ${
                      modules.length === 1 ? 'module' : 'modules'
                    }`
                  : 'Nog geen modules')}
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
        <div className="mb-4">
          <span className="text-2xl font-bold">€{price}</span>
        </div>
        {modules.length > 0 ? (
          <div className="space-y-4 text-sm">
            <h4 className="font-semibold">Modules:</h4>
            <ul className="space-y-2 list-disc list-inside">
              {modules.map((module) => (
                <li key={module.id} className="text-muted-foreground ">
                  <span className="font-semibold text-foreground">
                    {module.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground italic">
              Voeg modules toe om dit lespakket inhoud te geven.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
