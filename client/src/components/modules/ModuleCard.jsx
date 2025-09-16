import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Eye, MoreVertical, Trash2 } from 'lucide-react';

export const ModuleCard = ({ module, onEdit, onDelete, onView }) => {
  const { name, subjects = [] } = module;
  const primary = subjects[0] || {};

  return (
    <Card
      className="group py-4 flex flex-col h-full cursor-pointer overflow-hidden border transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/20 gap-0"
      onClick={onView}
    >
      {/* Compact header */}
      <CardHeader className="pb-0 relative">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0 pr-10">
            <CardTitle
              className="text-lg font-semibold group-hover:text-primary transition-colors truncate"
              title={name}
            >
              {name}
            </CardTitle>
            {primary?.material && (
              <Badge
                variant="outline"
                className="mt-1 w-fit text-xs font-normal px-2 py-0.5"
              >
                {primary.material}
              </Badge>
            )}
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 absolute right-2 top-2"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full opacity-60 transition-opacity group-hover:opacity-100"
                >
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
      {/* No extra body to keep the card compact */}
      <CardContent className="py-0" />
    </Card>
  );
};
