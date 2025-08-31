import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

const ExportButtons = ({ results, filteredCount, totalCount }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = ['Student', 'Vak', 'Cijfer', 'Datum'];
      const csvContent = [
        headers.join(','),
        ...results.map((result) =>
          [
            `"${result.student.first_name} ${result.student.last_name}"`,
            `"${result.subject?.name || 'Onbekend'}"`,
            result.grade.toFixed(1),
            new Date(result.date).toLocaleDateString('nl-NL'),
          ].join(',')
        ),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `resultaten_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // For now, create a simple PDF-like text format
      // In a real application, you would use a library like jsPDF or react-pdf
      const pdfContent = [
        'RESULTATEN RAPPORT',
        `Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`,
        `Aantal resultaten: ${results.length}`,
        '',
        'RESULTATEN:',
        '='.repeat(50),
        '',
        ...results.map((result) =>
          [
            `Student: ${result.student.first_name} ${result.student.last_name}`,
            `Vak: ${result.subject?.name || 'Onbekend'}`,
            `Cijfer: ${result.grade.toFixed(1)}`,
            `Datum: ${new Date(result.date).toLocaleDateString('nl-NL')}`,
            '-'.repeat(30),
          ].join('\n')
        ),
      ].join('\n');

      const blob = new Blob([pdfContent], {
        type: 'text/plain;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `resultaten_rapport_${new Date().toISOString().split('T')[0]}.txt`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exporteren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel/CSV ({filteredCount} resultaten)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          PDF Rapport ({filteredCount} resultaten)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
