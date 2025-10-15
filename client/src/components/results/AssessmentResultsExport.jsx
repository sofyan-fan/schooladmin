import classAPI from '@/apis/classAPI';
import resultAPI from '@/apis/resultAPI';
import ExportDialog from '@/utils/ExportDialog';
import exportScheduleToPDF from '@/utils/exportScheduleToPDF';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * AssessmentResultsExport
 * Shows ExportDialog and performs Excel/PDF export for an assessment's results.
 * If students/resultsMap are not provided, it will fetch them when opened.
 */
export default function AssessmentResultsExport({
  assessment,
  open,
  onOpenChange,
  students: studentsProp,
  resultsMap: resultsProp,
}) {
  const [students, setStudents] = useState(studentsProp || []);
  const [resultsMap, setResultsMap] = useState(resultsProp || {});
  const [, setLoading] = useState(false);

  useEffect(() => {
    setStudents(studentsProp || []);
  }, [studentsProp]);

  useEffect(() => {
    setResultsMap(resultsProp || {});
  }, [resultsProp]);

  useEffect(() => {
    const fetchDataIfNeeded = async () => {
      if (!open || !assessment) return;

      const needsStudents =
        !studentsProp ||
        (Array.isArray(studentsProp) && studentsProp.length === 0);
      const needsResults =
        !resultsProp || Object.keys(resultsProp || {}).length === 0;
      if (!needsStudents && !needsResults) return;

      setLoading(true);
      try {
        let fetchedStudents = studentsProp || [];
        if (needsStudents) {
          const classDetails = await classAPI.get_class(assessment.class_id);
          fetchedStudents = classDetails.students || [];
          setStudents(fetchedStudents);
        }

        if (needsResults) {
          const allResults = await resultAPI.get_results();
          const assessmentResults = allResults.filter(
            (r) => r.assessment_id === assessment.id
          );
          const map = assessmentResults.reduce((acc, r) => {
            acc[r.student_id] = r;
            return acc;
          }, {});
          setResultsMap(map);
        }
      } catch (e) {
        console.error('Failed to fetch data for export', e);
        toast.error('Kon de exportgegevens niet ophalen.');
      } finally {
        setLoading(false);
      }
    };

    fetchDataIfNeeded();
  }, [open, assessment, studentsProp, resultsProp]);

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Resultaten');

      workbook.creator = 'School Admin System';
      workbook.created = new Date();
      workbook.modified = new Date();

      worksheet.getColumn(1).width = 30; // Leerling
      worksheet.getColumn(2).width = 20; // Cijfer

      worksheet.mergeCells('A1:B1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `RESULTATEN – ${assessment?.name ?? ''} (Klas ${
        assessment?.class ?? ''
      })`;
      titleCell.font = {
        bold: true,
        size: 18,
        color: { argb: 'FF1E3A8A' },
        name: 'Calibri',
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 28;
      worksheet.getRow(2).height = 8;

      const headerRow = worksheet.getRow(3);
      headerRow.values = ['Leerling', 'Cijfer'];
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

      const rows = (students || []).map((st) => {
        const r = resultsMap[st.id];
        return {
          studentName: `${st.first_name ?? ''} ${st.last_name ?? ''}`.trim(),
          grade: r?.grade ?? '',
        };
      });

      rows.forEach((row, idx) => {
        const rowIndex = idx + 4;
        const dataRow = worksheet.getRow(rowIndex);
        dataRow.values = [row.studentName, row.grade];
        dataRow.height = 20;
        const isEven = idx % 2 === 0;
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
      const fileName = `assessment_${(assessment?.name || 'assessment')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')}_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      saveAs(blob, fileName);
      toast.success('Resultaten succesvol geëxporteerd naar Excel!');
    } catch (e) {
      console.error(e);
      toast.error('Kon niet exporteren naar Excel. Probeer het opnieuw.');
    }
  };

  const exportToPDF = () => {
    try {
      const columns = [
        { header: 'Leerling', accessorKey: 'student' },
        { header: 'Cijfer', accessorKey: 'grade' },
      ];

      const rows = (students || []).map((st) => {
        const r = resultsMap[st.id];
        return {
          student: `${st.first_name ?? ''} ${st.last_name ?? ''}`.trim(),
          grade: r?.grade ?? '',
        };
      });

      const title = `Resultaten – ${assessment?.name ?? ''} (Klas ${
        assessment?.class ?? ''
      })`;
      const fileName = `assessment_${(assessment?.name || 'assessment')
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')}_${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      exportScheduleToPDF({
        columns,
        rows,
        options: {
          title,
          fileName,
          orientation: 'portrait',
          headAlign: 'left',
        },
      });
      toast.success('Resultaten succesvol geëxporteerd naar PDF!');
    } catch (e) {
      console.error(e);
      toast.error('Kon niet exporteren naar PDF. Probeer het opnieuw.');
    }
  };

  return (
    <ExportDialog
      isOpen={open}
      onClose={onOpenChange}
      onExportExcel={exportToExcel}
      onExportPDF={exportToPDF}
      title="Exporteer resultaten"
      description={`Exporteer de resultaten van ${
        assessment?.name ?? 'de toets'
      }.`}
    />
  );
}
