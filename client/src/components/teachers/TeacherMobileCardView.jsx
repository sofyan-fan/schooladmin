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
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { useMemo, useState } from 'react';

function TeacherCard({ teacher, onView, onEdit, onDelete }) {
  const fullName = [teacher.firstName, teacher.lastName]
    .filter(Boolean)
    .join(' ');
  const initials = `${(teacher.firstName || '')[0] || ''}${(teacher.lastName || '')[0] || ''}`.toUpperCase() || 'DO';

  return (
    <Card className="overflow-hidden active:scale-[0.98] transition-transform">
      <CardContent className="p-0">
        <div className="block p-4 pb-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="size-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {fullName || 'Docent'}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {teacher.className && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {teacher.className}
                  </Badge>
                )}
              </div>
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
                <DropdownMenuItem onClick={() => onView(teacher)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Snel bekijken
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(teacher)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bewerken
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(teacher.id)}
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
            className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-1.5"
            onClick={() => onView(teacher)}
          >
            <Eye className="h-3.5 w-3.5" />
            Bekijken
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-1.5"
            onClick={() => onEdit(teacher)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Bewerken
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
            onClick={() => onView(teacher)}
          >
            <User className="h-3.5 w-3.5" />
            Profiel
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
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <BookOpen className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Geen docenten gevonden</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Pas je zoekterm aan of voeg een nieuwe docent toe.
      </p>
    </div>
  );
}

export default function TeacherMobileCardView({
  teachers,
  loading,
  onView,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Filter teachers by search
  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter((t) => {
      const firstName = (t.firstName || '').toLowerCase();
      const lastName = (t.lastName || '').toLowerCase();
      const className = (t.className || '').toLowerCase();
      return (
        firstName.includes(q) ||
        lastName.includes(q) ||
        `${firstName} ${lastName}`.includes(q) ||
        className.includes(q)
      );
    });
  }, [teachers, search]);

  // Paginate
  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  const paginatedTeachers = useMemo(() => {
    const start = page * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, page, pageSize]);

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
              placeholder="Zoek docent..."
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
            placeholder="Zoek op naam of klas..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results count */}
      {search.trim() && (
        <p className="text-sm text-muted-foreground mb-3">
          {filteredTeachers.length} resultaten gevonden
        </p>
      )}

      {/* Cards */}
      {paginatedTeachers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {paginatedTeachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
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
        {teachers.length} docenten totaal
      </p>
    </div>
  );
}
