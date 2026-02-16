import { jsPDF } from 'jspdf';

const exportReportCardToPDF = async ({
  student,
  className,
  schoolYear = new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
  modules = [],
  overallPassed = null,
  comments = '',
}) => {
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

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

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

  doc.setProperties({
    title: `Jaar-rapport - ${student.first_name} ${student.last_name}`,
    subject: 'Student Report Card',
    author: 'MaktApp',
    keywords: 'rapport, report card, student',
    creator: 'MaktApp School Admin System',
  });

  let yPos = margin;

  doc.setFontSize(14);
  doc.setTextColor(120, 120, 120);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text('MaktApp', margin, yPos + 5);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const schoolInfo = [
    'School Admin',
    'info@maktapp.com',
  ];
  schoolInfo.forEach((line, idx) => {
    doc.text(line, pageW - margin, yPos + 5 + (idx * 4), { align: 'right' });
  });

  yPos += 18;

  doc.setFontSize(22);
  doc.setTextColor(136, 187, 24);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('JAAR-RAPPORT', pageW / 2, yPos, { align: 'center' });
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += 12;

  const studentBoxH = 20;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, yPos, pageW - 2 * margin, studentBoxH, 2, 2, 'F');

  yPos += 5;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);

  const studentInfo = [
    { label: 'Naam:', value: `${student.first_name} ${student.last_name}` },
    { label: 'Leerlingnummer:', value: student.id.toString() },
    { label: 'Klas/Jaar:', value: className },
    { label: 'Schooljaar:', value: schoolYear },
  ];

  const col1X = margin + 5;
  const col2X = pageW / 2 + 5;
  const labelWidth = 35;

  // Row 1: Naam and Leerlingnummer
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text(studentInfo[0].label, col1X, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(studentInfo[0].value, col1X + labelWidth, yPos);

  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text(studentInfo[1].label, col2X, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(studentInfo[1].value, col2X + labelWidth, yPos);

  // Row 2: Klas/Jaar and Schooljaar
  yPos += 6;
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text(studentInfo[2].label, col1X, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(studentInfo[2].value, col1X + labelWidth, yPos);

  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text(studentInfo[3].label, col2X, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(studentInfo[3].value, col2X + labelWidth, yPos);

  yPos += studentBoxH - 6;

  yPos += 8;
  
  let statusText = 'Onvolledig';
  let statusColor = [156, 163, 175]; // gray for incomplete/failed
  let statusIcon = '⊘';
  
  if (overallPassed === true) {
    statusText = 'Geslaagd voor het jaar';
    statusColor = [136, 187, 24]; // --primary green
    statusIcon = '✓';
  } else if (overallPassed === false) {
    statusText = 'Niet geslaagd voor het jaar';
    // Keep gray for failed status
    statusIcon = '✗';
  }

  const statusBoxH = 10;
  doc.setDrawColor(...statusColor);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, yPos, pageW - 2 * margin, statusBoxH, 2, 2, 'S');

  doc.setFontSize(11);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.setTextColor(...statusColor);
  doc.text('SLAGINGSSTATUS:', margin + 5, yPos + 7);
  doc.text(`${statusIcon}  ${statusText}`, pageW - margin - 5, yPos + 7, { align: 'right' });
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += statusBoxH + 8;

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Slagingsvoorwaarden', margin, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += 8;

  const tableX = margin;
  const tableW = pageW - 2 * margin;
  const colWidths = {
    subject: tableW * 0.5,
    required: tableW * 0.25,
    status: tableW * 0.25,
  };

  doc.setFillColor(136, 187, 24);
  doc.rect(tableX, yPos, tableW, 8, 'F');

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Vak', tableX + 3, yPos + 5.5);
  doc.text('Verplicht', tableX + colWidths.subject + 3, yPos + 5.5);
  doc.text('Status', tableX + colWidths.subject + colWidths.required + 3, yPos + 5.5);
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += 8;

  doc.setTextColor(50, 50, 50);
  modules.forEach((module, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 249, 250);
    }
    doc.rect(tableX, yPos, tableW, 8, 'F');

    doc.setFontSize(9);
    doc.text(module.module_name || '-', tableX + 3, yPos + 5.5);

    // Display "Ja" or "Nee" for Verplicht column instead of checkbox
    const requiredText = module.required ? 'Ja' : 'Nee';
    const requiredColor = module.required ? [136, 187, 24] : [156, 163, 175]; // green for Ja, gray for Nee
    doc.setTextColor(...requiredColor);
    doc.text(requiredText, tableX + colWidths.subject + 3, yPos + 5.5);
    doc.setTextColor(50, 50, 50);

    let statusLabel = '-';
    let statusTextColor = [156, 163, 175];
    
    if (module.passed === true) {
      statusLabel = 'Behaald';
      statusTextColor = [34, 197, 94];
    } else if (module.passed === false) {
      statusLabel = 'Niet behaald';
      statusTextColor = [239, 68, 68];
    }
    
    doc.setTextColor(...statusTextColor);
    doc.text(statusLabel, tableX + colWidths.subject + colWidths.required + 3, yPos + 5.5);
    doc.setTextColor(50, 50, 50);

    yPos += 8;
  });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(tableX, yPos - (modules.length * 8) - 8, tableW, (modules.length * 8) + 8);

  yPos += 5;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const footerNote = 'Een leerling is geslaagd voor het jaar als alle aangevinkte vakken behaald zijn.';
  doc.text(footerNote, margin, yPos);

  yPos += 10;

  if (yPos + 35 > pageH - margin) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Opmerkingen docent/mentor', margin, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');

  yPos += 6;

  const commentsBoxH = 30;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, pageW - 2 * margin, commentsBoxH, 1, 1);

  if (comments) {
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const commentLines = doc.splitTextToSize(comments, pageW - 2 * margin - 10);
    doc.text(commentLines, margin + 5, yPos + 5);
  }

  yPos += commentsBoxH + 10;

  if (yPos + 20 > pageH - margin) {
    doc.addPage();
    yPos = margin;
  }

  const currentDate = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Datum:', margin, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  doc.text(currentDate, margin + 20, yPos);

  yPos += 15;

  if (supportsBold) doc.setFont('Nunito', 'bold');
  doc.text('Handtekening docent/mentor:', margin, yPos);
  if (supportsNormal) doc.setFont('Nunito', 'normal');
  
  yPos += 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(margin + 60, yPos, pageW - margin, yPos);

  const fileName = `rapport_${student.first_name}_${student.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Export multiple report cards to a single PDF file (one page per student)
 */
export const exportMultipleReportCardsToPDF = async ({
  students, // Array of { student, modules, overallPassed, comments }
  className,
  schoolYear = new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
}) => {
  if (!students || students.length === 0) return;

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

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

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

  doc.setProperties({
    title: `Jaar-rapporten - ${className}`,
    subject: 'Student Report Cards',
    author: 'MaktApp',
    keywords: 'rapport, report card, student',
    creator: 'MaktApp School Admin System',
  });

  // Helper to render a single report card page
  const renderReportCardPage = (studentData) => {
    const { student, modules = [], overallPassed = null, comments = '' } = studentData;

    if (supportsNormal) {
      doc.setFont('Nunito', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    let yPos = margin;

    doc.setFontSize(14);
    doc.setTextColor(120, 120, 120);
    if (supportsNormal) doc.setFont('Nunito', 'normal');
    doc.text('MaktApp', margin, yPos + 5);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const schoolInfo = ['School Admin', 'info@maktapp.com'];
    schoolInfo.forEach((line, idx) => {
      doc.text(line, pageW - margin, yPos + 5 + idx * 4, { align: 'right' });
    });

    yPos += 18;

    doc.setFontSize(22);
    doc.setTextColor(136, 187, 24);
    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text('JAAR-RAPPORT', pageW / 2, yPos, { align: 'center' });
    if (supportsNormal) doc.setFont('Nunito', 'normal');

    yPos += 12;

    const studentBoxH = 20;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, yPos, pageW - 2 * margin, studentBoxH, 2, 2, 'F');

    yPos += 5;
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    const studentInfo = [
      { label: 'Naam:', value: `${student.first_name} ${student.last_name}` },
      { label: 'Leerlingnummer:', value: student.id.toString() },
      { label: 'Klas/Jaar:', value: className },
      { label: 'Schooljaar:', value: schoolYear },
    ];

    const col1X = margin + 5;
    const col2X = pageW / 2 + 5;
    const labelWidth = 35;

    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text(studentInfo[0].label, col1X, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');
    doc.text(studentInfo[0].value, col1X + labelWidth, yPos);

    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text(studentInfo[1].label, col2X, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');
    doc.text(studentInfo[1].value, col2X + labelWidth, yPos);

    yPos += 6;
    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text(studentInfo[2].label, col1X, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');
    doc.text(studentInfo[2].value, col1X + labelWidth, yPos);

    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text(studentInfo[3].label, col2X, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');
    doc.text(studentInfo[3].value, col2X + labelWidth, yPos);

    yPos += studentBoxH - 6;

    yPos += 8;

    let statusText = 'Onvolledig';
    let statusColor = [156, 163, 175];
    let statusIcon = '⊘';

    if (overallPassed === true) {
      statusText = 'Geslaagd voor het jaar';
      statusColor = [136, 187, 24];
      statusIcon = '✓';
    } else if (overallPassed === false) {
      statusText = 'Niet geslaagd voor het jaar';
      statusIcon = '✗';
    }

    const statusBoxH = 10;
    doc.setDrawColor(...statusColor);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, yPos, pageW - 2 * margin, statusBoxH, 2, 2, 'S');

    doc.setFontSize(11);
    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.setTextColor(...statusColor);
    doc.text('SLAGINGSSTATUS:', margin + 5, yPos + 7);
    doc.text(`${statusIcon}  ${statusText}`, pageW - margin - 5, yPos + 7, { align: 'right' });
    if (supportsNormal) doc.setFont('Nunito', 'normal');

    yPos += statusBoxH + 8;

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text('Slagingsvoorwaarden', margin, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');

    yPos += 8;

    const tableX = margin;
    const tableW = pageW - 2 * margin;
    const colWidths = {
      subject: tableW * 0.5,
      required: tableW * 0.25,
      status: tableW * 0.25,
    };

    doc.setFillColor(136, 187, 24);
    doc.rect(tableX, yPos, tableW, 8, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text('Vak', tableX + 3, yPos + 5.5);
    doc.text('Verplicht', tableX + colWidths.subject + 3, yPos + 5.5);
    doc.text('Status', tableX + colWidths.subject + colWidths.required + 3, yPos + 5.5);
    if (supportsNormal) doc.setFont('Nunito', 'normal');

    yPos += 8;

    doc.setTextColor(50, 50, 50);
    modules.forEach((module, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 249, 250);
      }
      doc.rect(tableX, yPos, tableW, 8, 'F');

      doc.setFontSize(9);
      doc.text(module.module_name || '-', tableX + 3, yPos + 5.5);

      // Display "Ja" or "Nee" for Verplicht column instead of checkbox
      const requiredText = module.required ? 'Ja' : 'Nee';
      const requiredColor = module.required ? [136, 187, 24] : [156, 163, 175]; // green for Ja, gray for Nee
      doc.setTextColor(...requiredColor);
      doc.text(requiredText, tableX + colWidths.subject + 3, yPos + 5.5);
      doc.setTextColor(50, 50, 50);

      let statusLabel = '-';
      let statusTextColor = [156, 163, 175];

      if (module.passed === true) {
        statusLabel = 'Behaald';
        statusTextColor = [34, 197, 94];
      } else if (module.passed === false) {
        statusLabel = 'Niet behaald';
        statusTextColor = [239, 68, 68];
      }

      doc.setTextColor(...statusTextColor);
      doc.text(statusLabel, tableX + colWidths.subject + colWidths.required + 3, yPos + 5.5);
      doc.setTextColor(50, 50, 50);

      yPos += 8;
    });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(tableX, yPos - modules.length * 8 - 8, tableW, modules.length * 8 + 8);

    yPos += 5;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerNote = 'Een leerling is geslaagd voor het jaar als alle aangevinkte vakken behaald zijn.';
    doc.text(footerNote, margin, yPos);

    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text('Opmerkingen docent/mentor', margin, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');

    yPos += 6;

    const commentsBoxH = 30;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageW - 2 * margin, commentsBoxH, 1, 1);

    if (comments) {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const commentLines = doc.splitTextToSize(comments, pageW - 2 * margin - 10);
      doc.text(commentLines, margin + 5, yPos + 5);
    }

    yPos += commentsBoxH + 10;

    const currentDate = new Date().toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text('Datum:', margin, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');
    doc.text(currentDate, margin + 20, yPos);

    yPos += 15;

    if (supportsBold) doc.setFont('Nunito', 'bold');
    doc.text('Handtekening docent/mentor:', margin, yPos);
    if (supportsNormal) doc.setFont('Nunito', 'normal');

    yPos += 3;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margin + 60, yPos, pageW - margin, yPos);
  };

  // Render each student on a new page
  students.forEach((studentData, index) => {
    if (index > 0) {
      doc.addPage();
    }
    renderReportCardPage(studentData);
  });

  const fileName = `rapporten_${className}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default exportReportCardToPDF;
