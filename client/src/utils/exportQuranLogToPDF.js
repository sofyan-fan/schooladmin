import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export Quran Log data to PDF format
 * @param {Object} params - Export parameters
 * @param {Array} params.logs - Quran log entries to export
 * @param {Object} params.options - Additional options (title, fileName, studentName, etc.)
 * @returns {void}
 */
const exportQuranLogToPDF = async ({ logs, options = {} }) => {
  const {
    title = "Qur'an Logboek",
    subtitle = new Date().toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    fileName = `quran_log_${new Date().toISOString().split('T')[0]}.pdf`,
    studentName = null, // Optional: filter title for specific student
  } = options;

  // Primary color: #88BB18 (136, 187, 24)
  const primaryColor = [136, 187, 24];

  // Load embedded jsPDF Nunito font modules if present
  const fontModules = import.meta.glob('../pdf-fonts/*.js');
  const hasRegular = Boolean(fontModules['../pdf-fonts/Nunito-Regular.js']);
  const hasBold = Boolean(fontModules['../pdf-fonts/Nunito-Bold.js']);
  const fontImports = [
    hasRegular && fontModules['../pdf-fonts/Nunito-Regular.js']?.(),
    hasBold && fontModules['../pdf-fonts/Nunito-Bold.js']?.(),
  ].filter(Boolean);
  if (fontImports.length) {
    await Promise.all(fontImports);
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Validate fonts
  const supportsFont = (family, style) => {
    try {
      doc.setFont(family, style);
      doc.getTextWidth('a');
      return true;
    } catch {
      try {
        doc.setFont('helvetica', 'normal');
      } catch {}
      return false;
    }
  };

  const supportsNormal = hasRegular && supportsFont('Nunito', 'normal');
  const supportsBold = hasBold && supportsFont('Nunito', 'bold');

  if (supportsNormal) {
    doc.setFont('Nunito', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }

  // Set document properties
  doc.setProperties({
    title: title,
    subject: "Qur'an Log Export",
    author: 'MaktApp',
    keywords: 'quran, log, memorization',
    creator: 'MaktApp School Admin System',
  });

  let yPos = margin;

  // Header - Branding
  doc.setFontSize(14);
  doc.setTextColor(120, 120, 120);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text('MaktApp', margin, yPos + 5);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('School Admin', pageW - margin, yPos + 5, { align: 'right' });

  yPos += 18;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  const displayTitle = studentName ? `${title} - ${studentName}` : title;
  doc.text(displayTitle.toUpperCase(), pageW / 2, yPos, { align: 'center' });
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += 8;

  // Subtitle (date)
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageW / 2, yPos, { align: 'center' });
  }

  yPos += 10;

  // Summary box
  const summaryBoxH = 14;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPos, pageW - 2 * margin, summaryBoxH, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const totalLogs = logs.length;
  const memorizedCount = logs.filter((l) => l.memorized).length;
  
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Totaal logs:', margin + 5, yPos + 9);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(String(totalLogs), margin + 35, yPos + 9);

  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Gememoriseerd:', pageW / 2, yPos + 9);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(String(memorizedCount), pageW / 2 + 35, yPos + 9);

  yPos += summaryBoxH + 8;

  // Prepare table columns
  const tableColumns = [
    { header: 'Leerling', dataKey: 'student' },
    { header: 'Begin', dataKey: 'from' },
    { header: 'Einde', dataKey: 'to' },
    { header: 'Datum', dataKey: 'date' },
    { header: 'Memo', dataKey: 'memo' },
  ];

  // Prepare table rows
  const tableRows = logs.map((log) => ({
    student: log.studentLabel || `Student ${log.studentId}` || '-',
    from: log.from || '-',
    to: log.to || '-',
    date: log.date || '-',
    memo: log.memorized ? '✓' : '-',
  }));

  // Add the table
  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    startY: yPos,
    theme: 'striped',
    styles: {
      ...(supportsNormal && { font: 'Nunito' }),
      fontSize: 9,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      ...(supportsBold && { fontStyle: 'bold' }),
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
      ...(supportsNormal && { fontStyle: 'normal' }),
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      student: { cellWidth: 55 },
      from: { cellWidth: 35 },
      to: { cellWidth: 35 },
      date: { cellWidth: 30 },
      memo: { cellWidth: 15, halign: 'center' },
    },
    margin: { top: yPos, right: margin, bottom: 20, left: margin },
    didDrawPage: function (data) {
      // Footer on each page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      doc.text(
        `Pagina ${pageNum}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // Save the PDF
  doc.save(fileName);
};

/**
 * Export Nourania Log data to PDF format
 * @param {Object} params - Export parameters
 * @param {Array} params.logs - Nourania log entries to export
 * @param {Object} params.options - Additional options (title, fileName, studentName, etc.)
 * @returns {void}
 */
export const exportNouraniaLogToPDF = async ({ logs, options = {} }) => {
  const {
    title = 'Nourania Logboek',
    subtitle = new Date().toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    fileName = `nourania_log_${new Date().toISOString().split('T')[0]}.pdf`,
    studentName = null,
  } = options;

  // Primary color: #88BB18 (136, 187, 24)
  const primaryColor = [136, 187, 24];

  // Load embedded jsPDF Nunito font modules if present
  const fontModules = import.meta.glob('../pdf-fonts/*.js');
  const hasRegular = Boolean(fontModules['../pdf-fonts/Nunito-Regular.js']);
  const hasBold = Boolean(fontModules['../pdf-fonts/Nunito-Bold.js']);
  const fontImports = [
    hasRegular && fontModules['../pdf-fonts/Nunito-Regular.js']?.(),
    hasBold && fontModules['../pdf-fonts/Nunito-Bold.js']?.(),
  ].filter(Boolean);
  if (fontImports.length) {
    await Promise.all(fontImports);
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Validate fonts
  const supportsFont = (family, style) => {
    try {
      doc.setFont(family, style);
      doc.getTextWidth('a');
      return true;
    } catch {
      try {
        doc.setFont('helvetica', 'normal');
      } catch {}
      return false;
    }
  };

  const supportsNormal = hasRegular && supportsFont('Nunito', 'normal');
  const supportsBold = hasBold && supportsFont('Nunito', 'bold');

  if (supportsNormal) {
    doc.setFont('Nunito', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }

  // Set document properties
  doc.setProperties({
    title: title,
    subject: 'Nourania Log Export',
    author: 'MaktApp',
    keywords: 'nourania, log, lessons',
    creator: 'MaktApp School Admin System',
  });

  let yPos = margin;

  // Header - Branding
  doc.setFontSize(14);
  doc.setTextColor(120, 120, 120);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text('MaktApp', margin, yPos + 5);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('School Admin', pageW - margin, yPos + 5, { align: 'right' });

  yPos += 18;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  const displayTitle = studentName ? `${title} - ${studentName}` : title;
  doc.text(displayTitle.toUpperCase(), pageW / 2, yPos, { align: 'center' });
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += 8;

  // Subtitle (date)
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageW / 2, yPos, { align: 'center' });
  }

  yPos += 10;

  // Summary box
  const summaryBoxH = 14;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPos, pageW - 2 * margin, summaryBoxH, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const totalLogs = logs.length;
  
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Totaal logs:', margin + 5, yPos + 9);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(String(totalLogs), margin + 35, yPos + 9);

  // Count unique lessons covered
  const uniqueLessons = new Set();
  logs.forEach((l) => {
    if (l.begin) uniqueLessons.add(l.begin);
    if (l.einde) uniqueLessons.add(l.einde);
  });

  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Lessen behandeld:', pageW / 2, yPos + 9);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(String(uniqueLessons.size), pageW / 2 + 40, yPos + 9);

  yPos += summaryBoxH + 8;

  // Helper to format lesson value
  const lessonLabel = (val) => {
    if (!val) return '-';
    const num = val.replace('les-', '');
    return `Les ${num}`;
  };

  // Prepare table columns
  const tableColumns = [
    { header: 'Leerling', dataKey: 'student' },
    { header: 'Begin', dataKey: 'begin' },
    { header: 'Einde', dataKey: 'einde' },
    { header: 'Datum', dataKey: 'date' },
    { header: 'Omschrijving', dataKey: 'description' },
  ];

  // Prepare table rows
  const tableRows = logs.map((log) => ({
    student: log.studentLabel || `Student ${log.studentId}` || '-',
    begin: lessonLabel(log.begin),
    einde: lessonLabel(log.einde),
    date: log.date || '-',
    description: log.description || '-',
  }));

  // Add the table
  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    startY: yPos,
    theme: 'striped',
    styles: {
      ...(supportsNormal && { font: 'Nunito' }),
      fontSize: 9,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      ...(supportsBold && { fontStyle: 'bold' }),
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
      ...(supportsNormal && { fontStyle: 'normal' }),
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    columnStyles: {
      student: { cellWidth: 50 },
      begin: { cellWidth: 25 },
      einde: { cellWidth: 25 },
      date: { cellWidth: 30 },
      description: { cellWidth: 'auto' },
    },
    margin: { top: yPos, right: margin, bottom: 20, left: margin },
    didDrawPage: function (data) {
      // Footer on each page
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      doc.text(
        `Pagina ${pageNum}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // Save the PDF
  doc.save(fileName);
};

export default exportQuranLogToPDF;
