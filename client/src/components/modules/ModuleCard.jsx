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
import { Edit, Eye, MoreVertical, PlusCircle, Trash2 } from 'lucide-react';

export const ModuleCard = ({ module, onEdit, onDelete, onView }) => {
  const { name, subjects = [] } = module;

  // --- CONFIGURATION ---
  // Set the maximum number of subjects to display directly on the card.
  const maxSubjects = 2;
  const displayedSubjects = subjects.slice(0, maxSubjects);
  const remainingCount = subjects.length - displayedSubjects.length;

  return (
    <Card
      className="group flex flex-col h-full cursor-pointer overflow-hidden border transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/20"
      onClick={onView}
    >
      {/* --- Card Header: Strong, clear title --- */}
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            {/* Added truncate to the title for safety against very long module names */}
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate" title={name}>
              {name}
            </CardTitle>
            <CardDescription>
              Bevat {subjects.length} {subjects.length === 1 ? 'vak' : 'vakken'}
            </CardDescription>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-5 w-5" />
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
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Verwijderen</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* --- Card Content: Layout is structured to enforce consistent height --- */}
      <CardContent className="flex-grow flex flex-col justify-center">
        {/* This container has a minimum height to ensure all cards align,
            regardless of whether they have 0, 1, or 2 subjects listed.
            The height (min-h-[4.5rem]) is calculated to fit 2 subject rows + spacing. */}
        <div className="min-h-[4.5rem] flex flex-col justify-center">
          {subjects.length > 0 ? (
            <div className="space-y-3">
              {displayedSubjects.map((subject) => (
                <div
                  key={subject.subjectId}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-medium text-foreground truncate" title={subject.subjectName}>
                    {subject.subjectName}
                  </span>
                  <Badge variant="outline" className="flex-shrink-0 font-normal">
                    {subject.level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            // The empty state message is centered within the same fixed-height area.
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
              <PlusCircle className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm">Voeg vakken toe</p>
            </div>
          )}
        </div>

        {/* The "+ more" indicator is outside the fixed-height container,
            so it appears consistently at the bottom only when needed. */}
        {remainingCount > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-3 mt-auto">
            + {remainingCount} meer
          </p>
        )}
      </CardContent>
    </Card>
  );
};