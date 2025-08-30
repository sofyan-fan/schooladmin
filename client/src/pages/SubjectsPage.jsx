import subjectAPI from '@/apis/subjectAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import CreateModal from '@/components/subjects/CreateModal';
import EditModal from '@/components/subjects/EditModal';
import { getColumns } from '@/components/subjects/columns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { BookOpen, LibraryBig } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NoData = (
  <TableRow>
    <TableCell colSpan={5} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <BookOpen className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">No Subjects Found</h3>
        <p className="text-muted-foreground">
          Get started by adding a new subject.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const data = useMemo(() => subjects, [subjects]);

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsEditModalOpen(true);
  };

  const handleDelete = (subject) => {
    setDeletingSubject(subject);
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete), []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = () => {
    setLoading(true);
    setApiError('');
    subjectAPI
      .get_subjects()
      .then((data) => setSubjects(data || []))
      .catch(() =>
        setApiError('Failed to load subjects. Please try again later.')
      )
      .finally(() => setLoading(false));
  };

  const handleSaveSubject = (subjectToSave) => {
    const formattedSubject = {
      ...subjectToSave,
      levels: subjectToSave.levels.map((l) =>
        typeof l === 'object' ? l.level : l
      ),
      materials: subjectToSave.materials.map((m) =>
        typeof m === 'object' ? m.material : m
      ),
    };

    setSubjects((prevSubjects) => {
      const subjectExists = prevSubjects.find(
        (s) => s.id === formattedSubject.id
      );
      if (subjectExists) {
        return prevSubjects.map((s) =>
          s.id === formattedSubject.id ? formattedSubject : s
        );
      }
      return [...prevSubjects, formattedSubject];
    });

    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingSubject(null);
  };

  const handleCancelDelete = () => {
    setDeletingSubject(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSubject) return;
    try {
      await subjectAPI.delete_subject(deletingSubject.id);
      fetchSubjects();
    } catch {
      setApiError('Failed to delete subject. Please try again.');
    } finally {
      setDeletingSubject(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Vakkenbibliotheek"
        icon={<LibraryBig className="size-9" />}
        description="Beheer hier de vakken, niveaus en lesmaterialen."
        buttonText="Vak Toevoegen"
        onAdd={() => setIsCreateModalOpen(true)}
      />
      <Toolbar table={table} filterColumn="name" />

      {apiError && (
        <div className="text-red-500 mb-4 p-4 bg-red-100 rounded-md border border-red-200">
          {apiError}
        </div>
      )}

      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />

      <CreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSave={handleSaveSubject}
      />

      <EditModal
        open={isEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingSubject(null);
          }
          setIsEditModalOpen(isOpen);
        }}
        onSave={handleSaveSubject}
        subject={editingSubject}
      />

      {deletingSubject && (
        <AlertDialog open={!!deletingSubject} onOpenChange={handleCancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                subject.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default SubjectsPage;
