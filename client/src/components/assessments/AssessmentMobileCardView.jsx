import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  BookCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy', { locale: nl });
  } catch {
    return dateStr;
  }
}

function AssessmentCard({ assessment, onView, onEdit, onDelete, onManageResults }) {
  return (
    <Card className="overflow-hidden active:scale-[0.98] transition-transform">
      <CardContent className="p-0">
        <div className="block p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="size-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookCheck className="size-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {assessment.name || 'Toets/Examen'}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {assessment.class && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {assessment.class}
                  </Badge>
                )}
              </div>
              {assessment.date && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(assessment.date)}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Acties</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onManageResults(assessment)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Resultaten beheren
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onView(assessment)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Bekijken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(assessment)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bewerken
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(assessment)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Action Row */}
        <div className="flex border-t divide-x">
          <button
            type="button"
            className="flex-1 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
            onClick={() => onManageResults(assessment)}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Resultaten
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-1.5"
            onClick={() => onView(assessment)}
          >
            <Eye className="h-3.5 w-3.5" />
            Bekijken
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-1.5"
            onClick={() => onEdit(assessment)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Bewerken
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ type }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookCheck className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Geen {type} gevonden</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Pas je zoekterm aan of voeg een nieuwe {type.toLowerCase()} toe.
      </p>
    </div>
  );
}

export default function AssessmentMobileCardView({
  assessments,
  loading,
  type = 'toetsen',
  onView,
  onEdit,
  onDelete,
  onManageResults,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Filter assessments by search
  const filteredAssessments = useMemo(() => {
    if (!search.trim()) return assessments;
    const q = search.toLowerCase();
    return assessments.filter((a) => {
      const name = (a.name || '').toLowerCase();
      const className = (a.class || '').toLowerCase();
      return name.includes(q) || className.includes(q);
    });
  }, [assessments, search]);

  // Paginate
  const totalPages = Math.ceil(filteredAssessments.length / pageSize);
  const paginatedAssessments = useMemo(() => {
    const start = page * pageSize;
    return filteredAssessments.slice(start, start + pageSize);
  }, [filteredAssessments, page, pageSize]);

  // Reset page when search changes
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  if (loading) {
    return (
      <div className="md:hidden">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Zoek ${type}...`}
              className="pl-9"
              disabled
            />
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="md:hidden">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Zoek op naam of klas...`}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results count */}
      {search.trim() && (
        <p className="text-sm text-muted-foreground mb-3">
          {filteredAssessments.length} resultaten gevonden
        </p>
      )}

      {/* Cards */}
      {paginatedAssessments.length === 0 ? (
        <EmptyState type={type} />
      ) : (
        <div className="space-y-3">
          {paginatedAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onManageResults={onManageResults}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Vorige
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Volgende
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Total count */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        {assessments.length} {type} totaal
      </p>
    </div>
  );
}
