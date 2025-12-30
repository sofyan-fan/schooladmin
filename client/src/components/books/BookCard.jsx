import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, Pencil, Trash2 } from 'lucide-react';

export default function BookCard({ book, onView, onEdit, onDelete }) {
  return (
    <Card
      className="group py-4 flex flex-col h-full cursor-pointer overflow-hidden border transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/20 gap-0"
      onClick={onView}
    >
      <CardHeader className="pb-2 relative">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0 pr-10">
            <CardTitle
              className="text-lg font-semibold group-hover:text-primary transition-colors truncate"
              title={book?.title}
            >
              {book?.title || '—'}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge
                variant="outline"
                className="w-fit text-xs font-normal px-2 py-0.5 max-w-full truncate"
                title={book?.moduleName}
              >
                {book?.moduleName || '—'}
              </Badge>
            </CardDescription>
          </div>

          <CardAction
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
              onClick={onView}
              title="Bekijken"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
              onClick={onEdit}
              title="Bewerken"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-destructive opacity-70 transition-opacity group-hover:opacity-100"
              onClick={onDelete}
              title="Verwijderen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-xs text-muted-foreground">In bezit</div>
            <div className="mt-0.5 text-base font-semibold tabular-nums">
              {book?.ownedCount ?? 0}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-xs text-muted-foreground">In store</div>
            <div className="mt-0.5 text-base font-semibold tabular-nums">
              {book?.inStoreCount ?? 0}
            </div>
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <div className="text-xs text-muted-foreground">Totaal</div>
            <div className="mt-0.5 text-base font-semibold tabular-nums">
              {book?.totalCount ?? 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



