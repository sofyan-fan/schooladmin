import { Badge } from '@/components/ui/badge';
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
import { Edit, Eye, Layers3, MoreVertical, Trash2 } from 'lucide-react'; // Using MoreVertical as it's common for this pattern

export const CourseCard = ({ course, onEdit, onDelete, onView }) => {
  if (!course) {
    return null;
  }

  const { name, description, price, modules = [] } = course;

  const maxModules = 5;
  const displayedModules = modules.slice(0, maxModules);
  const remainingCount = modules.length - maxModules;

  return (
    // 1. The parent card needs a `relative` position for the absolute child to be positioned correctly.
    <Card
      className="group relative py-1 flex flex-col h-full cursor-pointer overflow-hidden border transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/20"
      onClick={onView}
    >
      {/* 2. The DropdownMenu is positioned absolutely within the card. */}
      {/* <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-50 transition-opacity group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
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
            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Verwijderen</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}

      {/* --- Card Header --- */}
      <CardHeader className="p-4">
        {/* 3. Right padding (`pr-10`) is added to prevent text from flowing under the absolute icon. */}
        <div className="flex justify-between items-center pr-10">
          <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate" title={name}>
            {name}
          </CardTitle>
          <span className="text-2xl font-bold text-primary flex-shrink-0">
            €{price}
          </span>
        </div>
      </CardHeader>

      {/* --- Card Content --- */}
      <CardContent className="flex-grow flex flex-col p-4 pt-0">
        <CardDescription className="text-sm text-muted-foreground" title={description}>
          {description || `Bevat ${modules.length} ${modules.length === 1 ? 'module' : 'modules'}`}
        </CardDescription>

        <div className="min-h-[4.5rem] flex items-center pt-4">
          {modules.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {displayedModules.map((module) => (
                <Badge key={module.id} variant="secondary" className="font-normal">
                  {module.name}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge variant="outline" className="font-normal">
                  + {remainingCount}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center text-muted-foreground space-x-2">
              <Layers3 className="h-4 w-4" />
              <span className="text-xs italic">Nog geen modules toegewezen</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};