import classApi from '@/apis/classAPI';
import { createColumns } from '@/components/classes/columns';
import CreateClassModal from '@/components/classes/CreateClassModal';
import DeleteClassModal from '@/components/classes/DeleteClassModal';
import EditClassModal from '@/components/classes/EditClassModal';
import ViewClassModal from '@/components/classes/ViewClassModal';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { TableCell, TableRow } from '@/components/ui/table';
import ExportDialog from '@/utils/ExportDialog';
import exportScheduleToPDF from '@/utils/exportScheduleToPDF';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const NoData = (
  <TableRow>
    <TableCell colSpan={5} className="h-48 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Users className="size-12 text-gray-400" />
        <h3 className="text-xl font-semibold">Geen klassen gevonden</h3>
        <p className="text-muted-foreground">
          Begin door een nieuwe klas toe te voegen.
        </p>
      </div>
    </TableCell>
  </TableRow>
);

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportClass, setExportClass] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classData = await classApi.get_classes();
      setClasses(classData);
    } catch (e) {
      console.error('Failed to load classes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (newClass) => {
    try {
      const addedClass = await classApi.add_class(newClass);
      setClasses((prev) => [...prev, addedClass]);
      toast.success('Klas succesvol toegevoegd.');
    } catch (err) {
      toast.error(`Toevoegen van klas mislukt: ${err.message}`);
      throw err; // re-throw error so modal can catch it
    }
  };

  const handleUpdate = async (classData) => {
    try {

      const updatedClass = await classApi.update_class(classData);
      setClasses((prev) =>
        prev.map((c) => (c.id === updatedClass.id ? updatedClass : c))
      );

      toast.success('Klas succesvol bijgewerkt.');
      setOpenEdit(false);
    } catch (err) {
      toast.error(`Bijwerken van klas mislukt: ${err.message}`);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await classApi.delete_class(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Klas succesvol verwijderd.');
      setOpenDelete(false);
    } catch (err) {
      toast.error(`Verwijderen van klas mislukt: ${err.message}`);
    }
  };

  const handleDeleteClick = (record) => {
    setSelected(record);
    setOpenDelete(true);
  };

  const handleView = (record) => {
    setSelected(record);
    setOpenView(true);
  };

  const handleEdit = (record) => {
    setSelected(record);
    setOpenEdit(true);
  };

  const handleOpenExport = (record) => {
    setExportClass(record);
    setIsExportDialogOpen(true);
  };

  const columns = useMemo(
    () =>
      createColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
        onExport: handleOpenExport,
      }),
    []
  );

  const table = useReactTable({
    data: classes,
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

  const handleExportExcel = async () => {
    const cls = exportClass;
    if (!cls) {
      toast.info('Geen klas geselecteerd om te exporteren.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Klas');

      workbook.creator = 'School Admin System';
      workbook.lastModifiedBy = 'School Admin System';
      workbook.created = new Date();
      workbook.modified = new Date();

      worksheet.getColumn(1).width = 38; // Student

      worksheet.mergeCells('A1:D1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `KLASSENLIJST – ${cls.name ?? ''}`;
      titleCell.font = {
        bold: true,
        size: 18,
        color: { argb: 'FF1E3A8A' },
        name: 'Calibri',
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' },
      };
      worksheet.getRow(1).height = 28;
      worksheet.getRow(2).height = 18;

      const mentor = cls.mentor
        ? `${cls.mentor.first_name ?? ''} ${cls.mentor.last_name ?? ''}`.trim()
        : 'n.v.t.';
      const courseName = cls.course?.name ?? 'n.v.t.';

      worksheet.mergeCells('A2:D2');
      const infoCell = worksheet.getCell('A2');
      infoCell.value = `Mentor: ${mentor}    Lespakket: ${courseName}`;
      infoCell.font = {
        italic: true,
        size: 11,
        color: { argb: 'FF6B7280' },
        name: 'Calibri',
      };
      infoCell.alignment = { vertical: 'middle', horizontal: 'center' };

      const headerRow = worksheet.getRow(3);
      headerRow.values = ['Student'];
      headerRow.height = 22;
      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 12,
          name: 'Calibri',
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
          left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
          bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
          right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        };
      });

      const students = Array.isArray(cls.students) ? cls.students : [];

      students.forEach((student, index) => {
        const rowIndex = index + 4;
        const dataRow = worksheet.getRow(rowIndex);
        const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''
          }`.trim();
        dataRow.values = [fullName || ''];
        dataRow.height = 20;

        const isEven = index % 2 === 0;
        dataRow.eachCell((cell) => {
          cell.font = { size: 11, name: 'Calibri' };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8F9FA' },
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          };
        });
      });

      worksheet.views = [{ state: 'frozen', ySplit: 3 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const dateStr = new Date().toISOString().split('T')[0];
      const safeName = String(cls.name || 'klas')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');
      const fileName = `klassenlijst_${safeName}_${dateStr}.xlsx`;
      saveAs(blob, fileName);
      toast.success('Klas succesvol geëxporteerd naar Excel!');
    } catch (e) {
      console.error('Failed to export class to Excel:', e);
      toast.error(
        'Kon de klas niet exporteren naar Excel. Probeer het opnieuw.'
      );
    }
  };

  const handleExportPDF = async () => {
    const cls = exportClass;
    if (!cls) {
      toast.info('Geen klas geselecteerd om te exporteren.');
      return;
    }

    try {
      const mentor = cls.mentor
        ? `${cls.mentor.first_name ?? ''} ${cls.mentor.last_name ?? ''}`.trim()
        : 'n.v.t.';
      const courseName = cls.course?.name ?? 'n.v.t.';
      const students = Array.isArray(cls.students) ? cls.students : [];

      const rows = students.map((student) => ({
        student:
          `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || '',
      }));

      const columns = [
        { header: 'Student', accessorKey: 'student', displayName: 'Student' },
      ];

      const subtitleParts = [];
      if (courseName && courseName !== 'n.v.t.') {
        subtitleParts.push(`Lespakket: ${courseName}`);
      }
      if (mentor && mentor !== 'n.v.t.') {
        subtitleParts.push(`Mentor: ${mentor}`);
      }
      const subtitle = subtitleParts.join('   •   ') || undefined;
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const safeName = String(cls.name || 'klas')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '');

      await exportScheduleToPDF({
        columns,
        rows,
        options: {
          title: `Klassenlijst – ${cls.name ?? ''}`,
          subtitle,
          fileName: `klassenlijst_${safeName}_${dateStr}.pdf`,
          orientation: 'portrait',
          headAlign: 'left',
        },
      });
      toast.success('Klas succesvol geëxporteerd naar PDF!');
    } catch (e) {
      console.error('Failed to export class to PDF:', e);
      toast.error('Kon de klas niet exporteren naar PDF. Probeer het opnieuw.');
    }
  };

  return (
    <>
      <PageHeader
        title="Klassen"
        icon={<Users className="size-9" />}
        description="Beheer hier alle klassen."
        buttonText="Nieuwe klas"
        onAdd={() => setOpenCreate(true)}
      />
      <Toolbar table={table} filterColumn="name" />
      <DataTable
        table={table}
        loading={loading}
        columns={columns}
        NoDataComponent={NoData}
      />

      <ViewClassModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        classData={selected}
      />
      <CreateClassModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSave={handleCreate}
      />
      <EditClassModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        onSave={handleUpdate}
        classData={selected}
      />
      <DeleteClassModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onDelete={() => handleDelete(selected?.id)}
        classData={selected}
      />
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => {
          setIsExportDialogOpen(false);
        }}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        title="Klas exporteren"
        description="Kies een bestandsformaat voor het exporteren van deze klassenlijst."
      />
    </>
  );
}
