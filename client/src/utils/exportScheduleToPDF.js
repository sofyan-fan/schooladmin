import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export schedule data to PDF format
 * @param {Object} params - Export parameters
 * @param {Array} params.columns - Column definitions with header and accessorKey
 * @param {Array} params.rows - Row data to export
 * @param {Object} params.options - Additional options (title, subtitle, fileName, etc.)
 * @returns {void}
 */
const exportScheduleToPDF = async ({ columns, rows, options = {} }) => {
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
    headAlign = 'center',
    // Optional accent color for title and header background. Accepts hex '#RRGGBB' or [r,g,b]
    accentColor,
  } = options;

  // Resolve accent color
  const defaultAccent = [30, 58, 138]; // blue (legacy default)
  let accent = defaultAccent;
  if (accentColor) {
    if (Array.isArray(accentColor) && accentColor.length === 3) {
      const [r, g, b] = accentColor.map((v) =>
        Number.isFinite(v) ? Math.max(0, Math.min(255, Math.floor(v))) : 0
      );
      accent = [r, g, b];
    } else if (typeof accentColor === 'string') {
      const hex = accentColor.trim().replace('#', '');
      if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        accent = [r, g, b];
      }
    }
  }

  // Load embedded jsPDF Nunito font modules if present (generated via make-jspdf-font.js)
  const fontModules = import.meta.glob('../pdf-fonts/*.js');
  const hasRegular = Boolean(fontModules['../pdf-fonts/Nunito-Regular.js']);
  const hasItalic = Boolean(fontModules['../pdf-fonts/Nunito-Italic.js']);
  const hasBold = Boolean(fontModules['../pdf-fonts/Nunito-Bold.js']);
  const fontImports = [
    hasRegular && fontModules['../pdf-fonts/Nunito-Regular.js']?.(),
    hasItalic && fontModules['../pdf-fonts/Nunito-Italic.js']?.(),
    hasBold && fontModules['../pdf-fonts/Nunito-Bold.js']?.(),
  ].filter(Boolean);
  if (fontImports.length) {
    await Promise.all(fontImports);
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });
  // Validate fonts to avoid runtime errors if a TTF is corrupt
  const supportsFont = (family, style) => {
    try {
      doc.setFont(family, style);
      // Force-load metrics; throws if font not valid
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
    subject: 'School Admin Export',
    author: 'School Admin System',
    keywords: 'jaarplanning, schedule, export',
    creator: 'School Admin System',
  });

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(...accent);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 20, {
    align: 'center',
  });
  if (supportsNormal) doc.setFont('Nunito', 'normal');

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
  const tableMargin = { top: 35, right: 10, bottom: 20, left: 10 };
  autoTable(doc, {
    columns: tableColumns,
    body: tableRows,
    startY: tableMargin.top,
    theme: 'striped',
    styles: {
      ...(supportsNormal && { font: 'Nunito' }),
    },
    headStyles: {
      fillColor: accent, // Accent color
      textColor: [255, 255, 255],
      fontSize: 11,
      ...(supportsBold && { fontStyle: 'bold' }),
      halign: headAlign,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [50, 50, 50],
      ...(supportsNormal && { fontStyle: 'normal' }),
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
    margin: tableMargin,
    didDrawPage: function (data) {
      doc.setFontSize(18);
      doc.setTextColor(100, 100, 100);

      // Left: Branding text
      if (supportsNormal) doc.setFont('Nunito', 'normal');
      doc.text(
        'MaktApp',
        data.settings.margin.left,
        doc.internal.pageSize.getHeight() - 10
      );
    },
    didDrawCell: function () {
      // Optional: Add custom cell rendering if needed
    },
  });

  // Removed rounded-corner decorations per request

  // Summary section removed as per requirement

  // Save the PDF
  doc.save(fileName);
};

export default exportScheduleToPDF;

// Named export: week schedule grid (landscape) similar to calendar view
export async function exportWeekScheduleToPDF({ events, anchorDate, options = {} }) {
  const {
    accentColor = '#88BB18',
    title, // optional override; if not provided we'll compute a concise range
  } = options;

  // Normalize accentColor to [r,g,b]
  let accent = [136, 187, 24];
  if (Array.isArray(accentColor) && accentColor.length === 3) {
    accent = accentColor;
  } else if (typeof accentColor === 'string') {
    const hex = accentColor.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      accent = [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  // Load embedded jsPDF Nunito font modules if present
  const fontModules = import.meta.glob('../pdf-fonts/*.js');
  const hasRegular = Boolean(fontModules['../pdf-fonts/Nunito-Regular.js']);
  const hasItalic = Boolean(fontModules['../pdf-fonts/Nunito-Italic.js']);
  const hasBold = Boolean(fontModules['../pdf-fonts/Nunito-Bold.js']);
  const fontImports = [
    hasRegular && fontModules['../pdf-fonts/Nunito-Regular.js']?.(),
    hasItalic && fontModules['../pdf-fonts/Nunito-Italic.js']?.(),
    hasBold && fontModules['../pdf-fonts/Nunito-Bold.js']?.(),
  ].filter(Boolean);
  if (fontImports.length) {
    await Promise.all(fontImports);
  }
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  // Validate fonts to avoid runtime errors if a TTF is corrupt
  const supportsFont = (family, style) => {
    try {
      doc.setFont(family, style);
      // Force-load metrics; throws if font not valid
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

  const margin = { top: 14, right: 10, bottom: 12, left: 18 };
  const timeColW = 18;
  const colGap = 4; // spacing between day columns
  const headerH = 10;
  const titleH = 12;
  const contentX = margin.left + timeColW;
  const contentW = pageW - margin.right - contentX;
  const dayCols = 7;
  const colW = (contentW - colGap * (dayCols - 1)) / dayCols;
  const blockInsetX = 0.2; // tighter inset from column edges
  const blockInsetY = 0.2; // tighter inset from horizontal grid lines

  // Week start (Monday) and end computed from anchor
  const weekStart = new Date(anchorDate);
  weekStart.setHours(0, 0, 0, 0);
  // Shift back to Monday: JS getDay() => 0=Sun,1=Mon,...6=Sat
  const dow = weekStart.getDay();
  const mondayOffset = (dow + 6) % 7; // 0 when Monday
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const conciseRange = (() => {
    const s = weekStart.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    const e = weekEnd.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${s} – ${e}`;
  })();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(...accent);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text(
    (title || `LESROOSTER – ${conciseRange}`).toUpperCase(),
    pageW / 2,
    margin.top + 2,
    { align: 'center' }
  );
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  // Compute hour range across events in window
  const inWindow = events.filter((e) => {
    const d = e.start;
    return d >= weekStart && d <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59, 999);
  });
  const minutes = (d) => d.getHours() * 60 + d.getMinutes();
  let minHour = 8;
  let maxHour = 18;
  if (inWindow.length) {
    const minStart = Math.min(...inWindow.map((e) => minutes(e.start)));
    const maxEnd = Math.max(...inWindow.map((e) => minutes(e.end)));
    minHour = Math.min(8, Math.floor(minStart / 60));
    maxHour = Math.max(18, Math.ceil(maxEnd / 60));
    minHour = Math.max(0, Math.min(minHour, 23));
    maxHour = Math.min(24, Math.max(maxHour, minHour + 1));
  }

  const yGridTop = margin.top + titleH + 2 + headerH; // beneath day headers
  const yGridBottom = pageH - margin.bottom;
  const totalMinutes = (maxHour - minHour) * 60;
  const yForMin = (m) =>
    yGridTop + ((m - minHour * 60) / totalMinutes) * (yGridBottom - yGridTop);
  const yForDate = (d) => yForMin(minutes(d));

  // Draw day column headers (Mon..Sun)
  doc.setFontSize(10.5);
  doc.setTextColor(60);
  for (let i = 0; i < dayCols; i++) {
    const x = contentX + i * (colW + colGap);
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const label = d.toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: '2-digit',
    });
    // header bg subtle
    doc.setFillColor(245, 245, 245);
    doc.rect(x, margin.top + titleH + 2, colW, headerH, 'F');
    doc.setTextColor(60);
    doc.text(label, x + 2, margin.top + titleH + 2 + headerH - 3);
    // column separator line
    if (i > 0) {
      const sepX = x - colGap / 2;
      doc.setDrawColor(235, 235, 235);
      doc.setLineWidth(0.2);
      doc.line(sepX, yGridTop, sepX, yGridBottom);
    }
  }

  // Draw side time labels and horizontal lines across entire grid
  doc.setFontSize(9.5);
  for (let h = minHour; h <= maxHour; h++) {
    const y = yForMin(h * 60);
    // hour label at left
    doc.setTextColor(120);
    const label = `${String(h).padStart(2, '0')}:00`;
    doc.text(label, margin.left, y + 2.2);
    // horizontal guide
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(contentX, y, pageW - margin.right, y);
  }

  // Group events by day, then by overlapping slots within day
  const dayEvents = Array.from({ length: dayCols }, () => []);
  inWindow.forEach((e) => {
    const idx =
      Math.floor((e.start - weekStart) / (1000 * 60 * 60 * 24)); // 0..6
    if (idx >= 0 && idx < dayCols) dayEvents[idx].push(e);
  });

  const colTextColor = [255, 255, 255];
  const blockRadius = 1.2; // slightly reduced radius
  const colPadding = 2; // slightly increased inner padding for readability

  // Helper: truncate a single line to fit within maxWidth with ellipsis
  const ellipsize = (text, maxWidth) => {
    if (!text) return '';
    if (doc.getTextWidth(text) <= maxWidth) return text;
    let truncated = text;
    // Reserve space for ellipsis
    while (truncated.length > 0 && doc.getTextWidth(truncated + '…') > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated.length ? truncated + '…' : '';
  };

  for (let i = 0; i < dayCols; i++) {
    const xBase = contentX + i * (colW + colGap);
    const eventsForDay = dayEvents[i].sort((a, b) => a.start - b.start);
    // Build overlapping groups
    const groups = [];
    let cur = [];
    let curEnd = null;
    eventsForDay.forEach((ev) => {
      if (cur.length === 0) {
        cur.push(ev);
        curEnd = ev.end;
      } else if (ev.start < curEnd) {
        cur.push(ev);
        if (ev.end > curEnd) curEnd = ev.end;
      } else {
        groups.push(cur);
        cur = [ev];
        curEnd = ev.end;
      }
    });
    if (cur.length) groups.push(cur);

    groups.forEach((group) => {
      const n = group.length;
      // minimal spacing between overlapping blocks
      const innerGap = n > 1 ? 0.8 : 0;
      const slotW = (colW - innerGap * (n - 1)) / n;
      group.forEach((ev, idx) => {
        const x = xBase + idx * (slotW + innerGap) + blockInsetX;
        let y1 = yForDate(ev.start) + blockInsetY;
        let y2 = yForDate(ev.end) - blockInsetY;
        let h = Math.max(12, y2 - y1); // compact but readable
        const drawW = slotW - blockInsetX * 2;

        // Block
        doc.setFillColor(...accent);
        doc.setDrawColor(255, 255, 255); // subtle separation
        doc.setLineWidth(0.4);
        doc.roundedRect(x, y1, drawW, h, blockRadius, blockRadius, 'FD');

        // Text
        let ty = y1 + 3.4;
        doc.setTextColor(...colTextColor);
        // Module (subject) first – compact, max 2 lines
        const moduleName = ev.title || '';
        doc.setFontSize(9.2);
        const moduleMaxW = drawW - colPadding * 2;
        const moduleLinesAll = doc.splitTextToSize(moduleName, moduleMaxW);
        const moduleLines =
          Array.isArray(moduleLinesAll) && moduleLinesAll.length > 2
            ? moduleLinesAll.slice(0, 2)
            : moduleLinesAll;
        const moduleLinesFitted = (Array.isArray(moduleLines) ? moduleLines : [moduleLines]).map((ln) =>
          ellipsize(ln, moduleMaxW)
        );
        doc.text(moduleLinesFitted, x + colPadding, ty);
        const moduleCount = Array.isArray(moduleLinesFitted) ? moduleLinesFitted.length : 1;
        ty += moduleCount * 4.2;
        // Time (HH:mm – HH:mm)
        const sh = String(ev.start.getHours()).padStart(2, '0');
        const sm = String(ev.start.getMinutes()).padStart(2, '0');
        const eh = String(ev.end.getHours()).padStart(2, '0');
        const em = String(ev.end.getMinutes()).padStart(2, '0');
        const timeRaw = `${sh}:${sm} – ${eh}:${em}`;
        if (h - (ty - y1) > 3.2) {
          doc.setFontSize(8.2);
          const timeStr = ellipsize(timeRaw, moduleMaxW);
          doc.text(timeStr, x + colPadding, ty);
          ty += 3.9;
        }
        // Classroom
        const classroomName = ev.resource?.classroomName || '';
        if (classroomName && h - (ty - y1) > 3.0) {
          doc.setFontSize(7.6);
          doc.text(ellipsize(classroomName, moduleMaxW), x + colPadding, ty);
          ty += 3.6;
        }
        // Teacher
        const teacherName = ev.resource?.teacherName || '';
        if (teacherName && h - (ty - y1) > 3.0) {
          doc.setFontSize(7.6);
          doc.text(ellipsize(teacherName, moduleMaxW), x + colPadding, ty);
        }
      });
    });
  }

  // Branding at top-left
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(14);
  doc.text('MaktApp', margin.left, margin.top + 2);

  const fileName = `rooster_week_${weekStart.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
