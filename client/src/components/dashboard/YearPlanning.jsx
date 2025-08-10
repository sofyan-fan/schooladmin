import { Card } from '@/components/ui/card';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useState } from 'react';
import eventAPI from '../../apis/dashboard/eventAPI';
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
    time: '',
    description: '',
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Jaarplanning');

    worksheet.columns = [
      { header: 'Activiteit', key: 'name', width: 30, size: 24 },
      { header: 'Datum', key: 'date', width: 20 },
      { header: 'Tag', key: 'tag', width: 20 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        name: item.name,
        date: item.date,
        time: item.time,
        tag: item.tag || '',
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'jaarplanning.xlsx');
  };

  const handleConfirmExport = () => {
    exportToExcel();
    setIsExportDialogOpen(false);
  };

  const handleEditClick = (item) => {
    setEditedItem({ ...item });
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
      };
      const updatedEvent = await eventAPI.editEvent(eventData);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === updatedEvent.id ? { ...item, ...updatedEvent } : item
        )
      );
      handleEditDialogClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
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
      await eventAPI.deleteEvent(itemToDelete.id);
      setItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemToDelete.id)
      );
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      handleDeleteDialogClose();
    }
  };

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
    setNewItem({ name: '', date: '', time: '', description: '' });
  };

  const handleSaveNewItem = async (event) => {
    event.preventDefault();
    try {
      const eventData = {
        event_name: newItem.name,
        event_date: newItem.date,
        description: newItem.description,
      };
      const newEventData = await eventAPI.add_event(eventData);
      setItems((prevItems) => [...prevItems, newEventData]);
      handleAddDialogClose();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const newEvent = () => {
    setNewItem({ name: '', date: '', time: '', description: '' });
    setIsAddDialogOpen(true);
  };

  const mappedItems = items.map((item) => ({
    ...item,
    name: item.event_name || item.name,
    date: item.event_date || item.date,
  }));

  return (
    <>
      <Card className="overflow-hidden rounded-lg border py-0 shadow-sm bg-white">
        <div className="relative max-h-96 overflow-y-auto">
          <YearPlanningTable
            items={mappedItems}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onAddClick={newEvent}
            onExportClick={() => setIsExportDialogOpen(true)}
          />
        </div>
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
        onConfirm={handleConfirmExport}
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
