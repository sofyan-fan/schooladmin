import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export schedule data to PDF format
 * @param {Object} params - Export parameters
 * @param {Array} params.columns - Column definitions with header and accessorKey
 * @param {Array} params.rows - Row data to export
 * @param {Object} params.options - Additional options (title, subtitle, fileName, etc.)
 * @returns {void}
 */
const exportScheduleToPDF = ({ columns, rows, options = {} }) => {
  const {
    title = 'Jaarplanning Overzicht',
    subtitle = new Date().toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    fileName = `jaarplanning_${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'landscape',
    format = 'a4',
  } = options;

  // Create new PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  // Set document properties
  doc.setProperties({
    title: title,
    subject: 'School Admin Export',
    author: 'School Admin System',
    keywords: 'jaarplanning, schedule, export',
    creator: 'School Admin System',
  });

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138); // Primary blue color similar to Excel export
  doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 20, {
    align: 'center',
  });

  // Add subtitle (date/time)
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 28, {
      align: 'center',
    });
  }

  // Prepare table columns
  const tableColumns = columns.map((col) => ({
    header: col.header || col.displayName || col.accessorKey,
    dataKey: col.accessorKey,
    // Use column meta for width hints if available
    ...(col.meta?.pdfWidth && { width: col.meta.pdfWidth }),
  }));

  // Prepare table rows
  const tableRows = rows.map((row) => {
    const rowData = {};
    columns.forEach((col) => {
      let value = row[col.accessorKey];

      // Apply formatting based on column type or meta
      if (col.meta?.pdfFormat && typeof col.meta.pdfFormat === 'function') {
        value = col.meta.pdfFormat(value, row);
      } else if (col.accessorKey === 'date' && value) {
        // Default date formatting for date columns
        try {
          value = new Date(value).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        } catch {
          // Keep original value if date parsing fails
        }
      } else if (
        (col.accessorKey === 'start_time' || col.accessorKey === 'end_time') &&
        row.start_time
      ) {
        // Handle time columns
        if (row.start_time && row.end_time) {
          value = `${row.start_time} - ${row.end_time}`;
        } else if (row.start_time) {
          value = row.start_time;
        } else if (row.end_time) {
          value = `Tot ${row.end_time}`;
        } else {
          value = 'Hele dag';
        }
        // Only set this for the start_time column, skip end_time
        if (col.accessorKey === 'end_time') {
          value = '';
        }
      }

      rowData[col.accessorKey] = value || '';
    });
    return rowData;
  });

  // Add the table using autoTable plugin
  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138], // Primary blue
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250], // Light gray for alternate rows
    },
    columnStyles: {
      // Default column styles
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
    },
    margin: { top: 35, right: 10, bottom: 20, left: 10 },
    didDrawPage: function (data) {
      // Footer with page numbers
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      // Left: Export date/time
      const exportDate = new Date().toLocaleString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(
        `Geëxporteerd: ${exportDate}`,
        data.settings.margin.left,
        doc.internal.pageSize.getHeight() - 10
      );

      // Right: Page numbers
      const pageText = `Pagina ${currentPage} van ${pageCount}`;
      doc.text(
        pageText,
        doc.internal.pageSize.getWidth() - data.settings.margin.right,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    },
    didDrawCell: function () {
      // Optional: Add custom cell rendering if needed
    },
  });

  // Summary section removed as per requirement

  // Save the PDF
  doc.save(fileName);
};

export default exportScheduleToPDF;
