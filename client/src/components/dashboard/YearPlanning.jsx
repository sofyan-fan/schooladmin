import { Card } from '@/components/ui/card';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useState } from 'react';
import { toast } from 'sonner';
import eventAPI from '../../apis/eventAPI';
import exportScheduleToPDF from '../../utils/exportScheduleToPDF';
import AddEventDialog from './year-planning/AddEventDialog';
import DeleteEventDialog from './year-planning/DeleteEventDialog';
import EditEventDialog from './year-planning/EditEventDialog';
import ExportDialog from './year-planning/ExportDialog';
import YearPlanningTable from './year-planning/YearPlanningTable';

const YearPlanning = ({ items, setItems }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Jaarplanning');

    // Set up workbook properties
    workbook.creator = 'School Admin System';
    workbook.lastModifiedBy = 'School Admin System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Set up columns first (without headers)
    worksheet.getColumn(1).width = 18; // Date column
    worksheet.getColumn(2).width = 25; // Activity column
    worksheet.getColumn(3).width = 12; // Time column
    worksheet.getColumn(4).width = 35; // Description column

    // Add title row with school branding
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'JAARPLANNING OVERZICHT';
    titleCell.font = {
      bold: true,
      size: 18,
      color: { argb: 'FF1E3A8A' },
      name: 'Calibri',
    };
    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' },
    };

    // Ensure title row height
    worksheet.getRow(1).height = 30;

    // Add some spacing
    worksheet.getRow(2).height = 10;

    // Move headers to row 3
    const headerRow = worksheet.getRow(3);
    headerRow.values = ['Datum', 'Activiteit', 'Tijd', 'Beschrijving'];
    headerRow.height = 25;

    // Style the header row
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
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
        right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      };
    });

    // Sort items by date for better organization
    const sortedItems = [...items].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    // Add data rows starting from row 4
    sortedItems.forEach((item, index) => {
      const rowIndex = index + 4;
      const dataRow = worksheet.getRow(rowIndex);

      // Format date properly
      let formattedDate = '';
      if (item.date) {
        try {
          formattedDate = new Date(item.date).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        } catch {
          formattedDate = item.date;
        }
      }

      // Format time properly
      let formattedTime = '';
      if (item.start_time && item.end_time) {
        formattedTime = `${item.start_time} - ${item.end_time}`;
      } else if (item.start_time) {
        formattedTime = item.start_time;
      } else if (item.end_time) {
        formattedTime = `Tot ${item.end_time}`;
      } else {
        formattedTime = 'Hele dag';
      }

      dataRow.values = [
        formattedDate,
        item.name || '',
        formattedTime,
        item.description || '',
      ];

      dataRow.height = Math.max(
        20,
        Math.ceil((item.description?.length || 0) / 60) * 15
      );

      // Style data rows with alternating colors
      const isEvenRow = index % 2 === 0;
      dataRow.eachCell((cell, colNumber) => {
        cell.font = {
          size: 11,
          name: 'Calibri',
        };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFFFFFFF' : 'FFF8F9FA' },
        };

        cell.alignment = {
          vertical: 'top',
          horizontal: 'left',
          wrapText: true,
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };

        // Special formatting for different columns
        if (colNumber === 2) {
          // Activity name column (now second column) - make bold
          cell.font = { ...cell.font, bold: true };
        }
      });
    });

    // Add summary row
    const summaryRowIndex = sortedItems.length + 5;
    worksheet.mergeCells(`A${summaryRowIndex}:D${summaryRowIndex}`);
    const summaryCell = worksheet.getCell(`A${summaryRowIndex}`);
    summaryCell.value = `Totaal aantal activiteiten: ${sortedItems.length}`;
    summaryCell.font = {
      bold: true,
      size: 12,
      color: { argb: 'FF1E3A8A' },
      name: 'Calibri',
    };
    summaryCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    summaryCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F9FF' },
    };
    summaryCell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
    };

    // Set print options
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    };

    // Add header and footer for printing
    worksheet.headerFooter.oddHeader =
      '&C&"Calibri,Bold"&14Jaarplanning Overzicht';
    worksheet.headerFooter.oddFooter = '&L&D &T&R&P van &N';

    // Freeze the header row
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 3,
      },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Generate filename with current date
    const fileName = `jaarplanning_${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    saveAs(blob, fileName);
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel();
      toast.success('Jaarplanning succesvol geëxporteerd naar Excel!');
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      toast.error(
        'Kon de jaarplanning niet exporteren naar Excel. Probeer het opnieuw.'
      );
    }
  };

  const handleExportPDF = () => {
    try {
      // Prepare columns for PDF export
      const columns = [
        {
          header: 'Activiteit',
          accessorKey: 'name',
          displayName: 'Activiteit',
        },
        {
          header: 'Datum',
          accessorKey: 'date',
          displayName: 'Datum',
        },
        {
          header: 'Tijd',
          accessorKey: 'start_time',
          displayName: 'Tijd',
        },
        {
          header: 'Beschrijving',
          accessorKey: 'description',
          displayName: 'Beschrijving',
        },
      ];

      // Sort items by date for better organization
      const sortedItems = [...items].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      });

      // Export to PDF
      exportScheduleToPDF({
        columns,
        rows: sortedItems,
        options: {
          title: 'Jaarplanning Overzicht',
          fileName: `jaarplanning_${
            new Date().toISOString().split('T')[0]
          }.pdf`,
        },
      });

      toast.success('Jaarplanning succesvol geëxporteerd naar PDF!');
    } catch (error) {
      console.error('Failed to export to PDF:', error);
      toast.error(
        'Kon de jaarplanning niet exporteren naar PDF. Probeer het opnieuw.'
      );
    }
  };

  const handleEditClick = (item) => {
    setEditedItem({
      ...item,
      startTime: item.start_time || '',
      endTime: item.end_time || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditedItem(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const eventData = {
        id: editedItem.id,
        event_name: editedItem.name,
        event_date: editedItem.date,
        description: editedItem.description,
        start_time: editedItem.startTime || '',
        end_time: editedItem.endTime || '',
      };
      const updatedEvent = await eventAPI.update_event(eventData);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedEvent.id ? { ...item, ...updatedEvent } : item
        )
      );
      toast.success(`"${editedItem.name}" is bijgewerkt!`);
      handleEditDialogClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Kon de activiteit niet bijwerken. Probeer het opnieuw.');
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await eventAPI.delete_event(itemToDelete.id);
      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemToDelete.id)
      );
      toast.success(`"${itemToDelete.name}" is verwijderd!`);
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Kon de activiteit niet verwijderen. Probeer het opnieuw.');
    } finally {
      handleDeleteDialogClose();
    }
  };

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
    setNewItem({
      name: '',
      date: '',
      startTime: '',
      endTime: '',
      description: '',
    });
  };

  const handleSaveNewItem = async (event) => {
    event.preventDefault();
    try {
      const eventData = {
        event_name: newItem.name,
        event_date: newItem.date,
        description: newItem.description,
        start_time: newItem.startTime || '',
        end_time: newItem.endTime || '',
      };
      const newEventData = await eventAPI.add_event(eventData);
      setItems((prevItems) => [...prevItems, newEventData]);
      toast.success(`"${newItem.name}" is toegevoegd aan de jaarplanning!`);
      handleAddDialogClose();
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Kon de activiteit niet toevoegen. Probeer het opnieuw.');
    }
  };

  const newEvent = () => {
    setNewItem({
      name: '',
      date: '',
      startTime: '',
      endTime: '',
      description: '',
    });
    setIsAddDialogOpen(true);
  };

  const mappedItems = items;

  return (
    <>
      <Card className="rounded-lg border shadow-sm bg-white p-6 min-h-[28rem]">
        <YearPlanningTable
          items={mappedItems}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onAddClick={newEvent}
          onExportClick={() => setIsExportDialogOpen(true)}
          loading={false}
        />
      </Card>
      <EditEventDialog
        isOpen={isEditDialogOpen}
        onClose={handleEditDialogClose}
        editedItem={editedItem}
        onInputChange={handleInputChange}
        onSaveChanges={handleSaveChanges}
      />
      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleConfirmDelete}
      />
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />
      <AddEventDialog
        isOpen={isAddDialogOpen}
        onClose={handleAddDialogClose}
        newItem={newItem}
        onNewItemChange={handleNewItemChange}
        onSave={handleSaveNewItem}
      />
    </>
  );
};

export default YearPlanning;
