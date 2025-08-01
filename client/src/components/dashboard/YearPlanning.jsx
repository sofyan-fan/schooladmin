import RequestHandler from '@/apis/RequestHandler';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import eventApi from '../../apis/dashboard/eventiApi';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const YearPlanning = ({ items, setItems }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editedItem, setEditedItem] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
  });
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // const exportToExcel = () => {
  //   const worksheet = XLSX.utils.json_to_sheet(
  //     items.map((item) => ({
  //       Activiteit: item.title,
  //       Datum: item.date,
  //       Tijd: item.time,
  //       Tag: item.tag || '',
  //     }))
  //   );
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Jaarplanning');
  //   XLSX.writeFile(workbook, 'jaarplanning.xlsx');
  // };
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Jaarplanning');

    // Define columns with headers and column widths
    worksheet.columns = [
      { header: 'Activiteit', key: 'title', width: 30 },
      { header: 'Datum', key: 'date', width: 20 },
      // { header: 'Tijd', key: 'time', width: 15 },
      { header: 'Tag', key: 'tag', width: 20 },
    ];

    // Add data rows
    items.forEach((item) => {
      worksheet.addRow({
        title: item.title,
        date: item.date,
        time: item.time,
        tag: item.tag || '',
      });
    });

    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }, // dark indigo-blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Export the workbook
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
    setSelectedItem(item);
    setEditedItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedItem(null);
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
      const response = await RequestHandler.put(
        `/api/jaarplanning/${editedItem.id}`,
        editedItem
      );
      if (response.status === 200) {
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === editedItem.id ? editedItem : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      handleEditDialogClose();
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
      const response = await eventApi.deleteEvent(itemToDelete.id);
      if (response.status === 200) {
        console.log(itemToDelete.id);
        setItems((prevItems) =>
          prevItems.filter((item) => item.id !== itemToDelete.id)
        );
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      handleDeleteDialogClose();
    }
  };

  const handleAddDialogClose = () => {
    setIsAddDialogOpen(false);
    setNewItem({ title: '', date: '', time: '' });
  };

  const handleSaveNewItem = async (event) => {
    event.preventDefault();
    try {
      const response = await eventApi.addEvent(newItem);
      // console.log(newItem);
      if (response.status === 200) {
        setItems((prevItems) => [...prevItems, response.data]);
        handleAddDialogClose();
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const newEvent = () => {
    setNewItem({ title: '', date: '', time: '', description: '' });
    setIsAddDialogOpen(true);
  };

  return (
    <>
      <Card className="overflow-hidden rounded-lg border py-0 shadow-sm bg-white">
        <div className="relative max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white text-xs uppercase tracking-wide text-neutral-600">
              <TableRow>
                <TableHead>Activiteit</TableHead>
                <TableHead>Datum</TableHead>
                {/* <TableHead>Tijd</TableHead> */}
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">
                    {/* <span>Acties</span> */}
                    <Button
                      variant="default"
                      size="sm"
                      className="ml-4 bg-primary text-white hover:cursor-pointer hover:bg-lime-500"
                      onClick={newEvent}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 cursor-pointer hover:bg-primary hover:text-white"
                      onClick={() => setIsExportDialogOpen(true)}
                    >
                      <FileDown className="size-8 cursor-pointer" />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(
                (item, index) => (
                  console.log(item),
                  (
                    <TableRow
                      key={index}
                      className="border-b border-neutral-200 hover:bg-neutral-50 text-lg text-neutral-700"
                    >
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell> {item.date}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                            onClick={() => handleEditClick(item)}
                          >
                            <Pencil className="size-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-error hover:text-white cursor-pointer"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 className="size-6 " />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      {selectedItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Activiteit bewerken</DialogTitle>
              <DialogDescription>
                Pas de gegevens van de activiteit aan. Klik op opslaan als je
                klaar bent.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Activiteit
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={editedItem.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Datum
                </Label>
                <Input
                  id="date"
                  name="date"
                  value={editedItem.date}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Tijd
                </Label>
                <Input
                  id="time"
                  name="time"
                  value={editedItem.time}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleEditDialogClose}
              >
                Annuleren
              </Button>
              <Button type="submit" onClick={handleSaveChanges}>
                Wijzigingen opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {itemToDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Weet je het zeker?</DialogTitle>
              <DialogDescription>
                Deze actie kan niet ongedaan worden gemaakt. Dit zal de
                activiteit permanent verwijderen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDeleteDialogClose}
              >
                Annuleren
              </Button>
              <Button type="submit" onClick={handleConfirmDelete}>
                Verwijderen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exporteren naar Excel</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de jaarplanning wilt exporteren naar een
              Excel-bestand?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" onClick={handleConfirmExport}>
              Exporteren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveNewItem}>
            <DialogHeader>
              <DialogTitle>Nieuwe activiteit toevoegen</DialogTitle>
              <DialogDescription>
                Vul de gegevens voor de nieuwe activiteit in.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Activiteit
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={newItem.title}
                  onChange={handleNewItemChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Datum
                </Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={newItem.date}
                  onChange={handleNewItemChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Beschrijving
                </Label>
                <Input
                  // type="textarea"
                  type="textarea"
                  id="description"
                  name="description"
                  value={newItem.description}
                  onChange={handleNewItemChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDialogClose}
              >
                Annuleren
              </Button>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YearPlanning;
