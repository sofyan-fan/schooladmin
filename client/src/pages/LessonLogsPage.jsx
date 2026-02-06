import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { BookOpen, CalendarDays, Eye, NotebookPen, Pencil, Search, Trash2, User } from 'lucide-react';

import lessonLogAPI, { LOG_TYPES } from '@/apis/lessonLogAPI';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const LessonLogsPage = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [logToView, setLogToView] = useState(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState(LOG_TYPES.LES);

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const teacherId = user?.teacherId || user?.id;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load lesson logs from database API
      const logsData = await lessonLogAPI.getAllLogs();
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Gegevens konden niet worden geladen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Enrich logs with roster details (API already includes related data)
  const enrichedLogs = useMemo(() => {
    return logs.map((log) => {
      const roster = log.roster;
      const subject = roster?.subject;
      const classInfo = roster?.class_layout;
      const teacher = roster?.teacher;

      return {
        // Normalize field names for consistency with UI (API uses snake_case)
        id: log.id,
        rosterId: log.roster_id,
        teacherId: log.teacher_id,
        teacherName: log.teacher_name,
        date: log.date,
        type: log.type,
        content: log.content,
        createdAt: log.created_at,
        updatedAt: log.updated_at,
        roster,
        subjectName: subject?.name || 'Onbekend vak',
        className: classInfo?.name || 'Onbekende klas',
        lessonTeacherId: roster?.teacher_id,
        lessonTeacherName: teacher
          ? `${teacher.first_name} ${teacher.last_name}`
          : 'Onbekende docent',
      };
    });
  }, [logs]);

  // Filter logs based on role (teachers only see their own logs, admins see all)
  const roleFilteredLogs = useMemo(() => {
    if (isAdmin) {
      return enrichedLogs;
    }
    // Teachers only see logs for their own lessons
    return enrichedLogs.filter(
      (log) =>
        Number(log.teacherId) === Number(teacherId) ||
        Number(log.lessonTeacherId) === Number(teacherId)
    );
  }, [enrichedLogs, isAdmin, teacherId]);

  // Apply search and filters
  const filteredLogs = useMemo(() => {
    let result = [...roleFilteredLogs];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.content?.toLowerCase().includes(term) ||
          log.subjectName?.toLowerCase().includes(term) ||
          log.className?.toLowerCase().includes(term) ||
          log.teacherName?.toLowerCase().includes(term)
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter((log) => log.subjectName === subjectFilter);
    }

    // Class filter
    if (classFilter !== 'all') {
      result = result.filter((log) => log.className === classFilter);
    }

    // Teacher filter (admin only)
    if (teacherFilter !== 'all') {
      result = result.filter((log) => log.lessonTeacherName === teacherFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((log) => (log.type || LOG_TYPES.LES) === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [roleFilteredLogs, searchTerm, subjectFilter, classFilter, teacherFilter, typeFilter, sortOrder]);

  // Get unique subjects and classes for filter dropdowns
  const uniqueSubjects = useMemo(() => {
    const subjectSet = new Set(roleFilteredLogs.map((log) => log.subjectName));
    return Array.from(subjectSet).filter(Boolean).sort();
  }, [roleFilteredLogs]);

  const uniqueClasses = useMemo(() => {
    const classSet = new Set(roleFilteredLogs.map((log) => log.className));
    return Array.from(classSet).filter(Boolean).sort();
  }, [roleFilteredLogs]);

  const uniqueTeachers = useMemo(() => {
    const teacherSet = new Set(roleFilteredLogs.map((log) => log.lessonTeacherName));
    return Array.from(teacherSet).filter(Boolean).sort();
  }, [roleFilteredLogs]);

  const handleViewClick = (log) => {
    setLogToView(log);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (log) => {
    setLogToDelete(log);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (log) => {
    setLogToEdit(log);
    setEditContent(log.content || '');
    setEditType(log.type || LOG_TYPES.LES);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (logToEdit && editContent.trim()) {
      try {
        const updatedLog = await lessonLogAPI.updateLog(logToEdit.id, {
          content: editContent.trim(),
          type: editType,
        });
        
        // Update local state with the response from the server
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logToEdit.id
              ? updatedLog
              : l
          )
        );
        
        const typeLabel = editType === LOG_TYPES.QURAN ? "Qur'an" : 'Les';
        toast.success(`${typeLabel}notitie bijgewerkt`);
      } catch (error) {
        console.error('Failed to update lesson log:', error);
        toast.error('Notitie kon niet worden bijgewerkt');
      }
    }
    setEditDialogOpen(false);
    setLogToEdit(null);
    setEditContent('');
    setEditType(LOG_TYPES.LES);
  };

  const handleConfirmDelete = async () => {
    if (logToDelete) {
      try {
        await lessonLogAPI.deleteLog(logToDelete.id);
        setLogs((prev) => prev.filter((l) => l.id !== logToDelete.id));
        toast.success('Lesnotitie verwijderd');
      } catch (error) {
        console.error('Failed to delete lesson log:', error);
        toast.error('Notitie kon niet worden verwijderd');
      }
    }
    setDeleteDialogOpen(false);
    setLogToDelete(null);
  };

  const formatLogDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: nl });
    } catch {
      return dateStr;
    }
  };

  const capitalizeFirst = (str) =>
    typeof str === 'string' && str.length
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : '';

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader
          title="Lessen Logs Overzicht"
          icon={<NotebookPen className="size-9" />}
          description={isAdmin ? 'Bekijk alle lesnotities van docenten.' : 'Bekijk en beheer je lesnotities.'}
        />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Lessen Logs Overzicht"
        icon={<NotebookPen className="size-9" />}
        description={isAdmin ? 'Bekijk alle lesnotities van docenten.' : 'Bekijk en beheer je lesnotities.'}
      />

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoeken in notities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter op vak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle vakken</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter op klas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle klassen</SelectItem>
            {uniqueClasses.map((className) => (
              <SelectItem key={className} value={className}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter op docent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle docenten</SelectItem>
              {uniqueTeachers.map((teacher) => (
                <SelectItem key={teacher} value={teacher}>
                  {teacher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            <SelectItem value={LOG_TYPES.LES}>Les</SelectItem>
            <SelectItem value={LOG_TYPES.QURAN}>Qur'an</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sorteren" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nieuwste eerst</SelectItem>
            <SelectItem value="oldest">Oudste eerst</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs list */}
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pb-4">
        {filteredLogs.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <NotebookPen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">Geen lesnotities gevonden</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {logs.length === 0
                ? isAdmin
                  ? 'Er zijn nog geen lesnotities door docenten toegevoegd.'
                  : 'Je hebt nog geen notities toegevoegd aan je lessen. Ga naar je rooster en klik op een les om een notitie toe te voegen.'
                : 'Pas je zoek- of filterinstellingen aan om notities te vinden.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewClick(log)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header with subject, class, and type badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={
                        (log.type || LOG_TYPES.LES) === LOG_TYPES.QURAN
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                      }
                    >
                      {(log.type || LOG_TYPES.LES) === LOG_TYPES.QURAN ? (
                        <>
                          <BookOpen className="h-3 w-3 mr-1" />
                          Qur'an
                        </>
                      ) : (
                        'Les'
                      )}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {log.subjectName}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{log.className}</span>
                  </div>

                  {/* Date and time info */}
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{capitalizeFirst(formatLogDate(log.date))}</span>
                    {log.roster?.start_time && log.roster?.end_time && (
                      <>
                        <span>•</span>
                        <span>
                          {log.roster.start_time.slice(0, 5)} - {log.roster.end_time.slice(0, 5)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Log content (truncated in list) */}
                  <p className="mt-3 text-sm text-foreground whitespace-pre-wrap line-clamp-2">
                    {log.content}
                  </p>

                  {/* Footer with author and timestamps */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {log.teacherName && (
                      <span>Door: {log.teacherName}</span>
                    )}
                    {log.updatedAt && log.updatedAt !== log.createdAt && (
                      <span>
                        Bewerkt: {format(new Date(log.updatedAt), 'd MMM yyyy HH:mm', { locale: nl })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => handleViewClick(log)}
                    title="Bekijken"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => handleEditClick(log)}
                        title="Bewerken"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(log)}
                        title="Verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats footer */}
      {filteredLogs.length > 0 && (
        <div className="mt-auto pt-2 text-sm text-muted-foreground text-center">
          {filteredLogs.length} notitie{filteredLogs.length !== 1 ? 's' : ''} gevonden
          {(searchTerm || subjectFilter !== 'all' || classFilter !== 'all' || teacherFilter !== 'all' || typeFilter !== 'all') && (
            <span> (van {roleFilteredLogs.length} totaal)</span>
          )}
        </div>
      )}

      {/* View dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Lesnotitie</DialogTitle>
          </DialogHeader>
          {logToView && (
            <div className="space-y-4">
              {/* Type badge + subject + class */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={
                    (logToView.type || LOG_TYPES.LES) === LOG_TYPES.QURAN
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                  }
                >
                  {(logToView.type || LOG_TYPES.LES) === LOG_TYPES.QURAN ? (
                    <>
                      <BookOpen className="h-3 w-3 mr-1" />
                      Qur'an
                    </>
                  ) : (
                    'Les'
                  )}
                </Badge>
                <span className="font-semibold text-foreground">
                  {logToView.subjectName}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{logToView.className}</span>
              </div>

              {/* Details grid */}
              <div className="rounded-md bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>{capitalizeFirst(formatLogDate(logToView.date))}</span>
                  {logToView.roster?.start_time && logToView.roster?.end_time && (
                    <>
                      <span>•</span>
                      <span>
                        {logToView.roster.start_time.slice(0, 5)} - {logToView.roster.end_time.slice(0, 5)}
                      </span>
                    </>
                  )}
                </div>
                {logToView.lessonTeacherName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span>Docent: {logToView.lessonTeacherName}</span>
                  </div>
                )}
                {logToView.roster?.classroom && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <NotebookPen className="h-4 w-4 shrink-0" />
                    <span>Lokaal: {logToView.roster.classroom.name}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Notitie</label>
                <div className="rounded-md border p-4 text-sm text-foreground whitespace-pre-wrap min-h-[80px] max-h-[300px] overflow-y-auto">
                  {logToView.content}
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                {logToView.teacherName && (
                  <span>Geschreven door: {logToView.teacherName}</span>
                )}
                {logToView.createdAt && (
                  <span>
                    Aangemaakt: {format(new Date(logToView.createdAt), 'd MMM yyyy HH:mm', { locale: nl })}
                  </span>
                )}
                {logToView.updatedAt && logToView.updatedAt !== logToView.createdAt && (
                  <span>
                    Bewerkt: {format(new Date(logToView.updatedAt), 'd MMM yyyy HH:mm', { locale: nl })}
                  </span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {!isAdmin && logToView && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewDialogOpen(false);
                  handleEditClick(logToView);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
            )}
            <Button onClick={() => setViewDialogOpen(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lesnotitie verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Weet je zeker dat je deze notitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
          </p>
          {logToDelete && (
            <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
              <div className="font-medium">
                {logToDelete.subjectName} - {logToDelete.className}
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {capitalizeFirst(formatLogDate(logToDelete.date))}
              </div>
              <p className="mt-2 line-clamp-2">{logToDelete.content}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Notitie bewerken</DialogTitle>
          </DialogHeader>
          {logToEdit && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <div className="font-medium">
                  {logToEdit.subjectName} - {logToEdit.className}
                </div>
                <div className="text-muted-foreground text-xs mt-1">
                  {capitalizeFirst(formatLogDate(logToEdit.date))}
                </div>
              </div>
              
              {/* Type toggle */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Type notitie</label>
                <ToggleGroup
                  type="single"
                  value={editType}
                  onValueChange={(value) => value && setEditType(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem
                    value={LOG_TYPES.LES}
                    aria-label="Les notitie"
                    className="px-4"
                  >
                    Les
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value={LOG_TYPES.QURAN}
                    aria-label="Qur'an notitie"
                    className="px-4"
                  >
                    Qur'an
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder={editType === LOG_TYPES.QURAN 
                  ? "Schrijf hier je Qur'an notitie..." 
                  : "Schrijf hier je notitie..."}
                className="min-h-[120px] resize-none"
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleConfirmEdit} disabled={!editContent.trim()}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonLogsPage;
