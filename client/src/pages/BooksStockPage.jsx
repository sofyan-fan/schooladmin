import bookInventoryAPI from '@/apis/bookInventoryAPI';
import PageHeader from '@/components/shared/PageHeader';
import DataTable from '@/components/shared/Table';
import Toolbar from '@/components/shared/Toolbar';
import { Badge } from '@/components/ui/badge';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  Edit,
  Eye,
  LibraryBig,
  Minus,
  PackagePlus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

/** Isolated cell component — only this cell re-renders on ping, not the whole table */
function StockAmountCell({ stock }) {
  const [pinging, setPinging] = useState(false);
  const prevStock = useRef(stock);
  const timer = useRef(null);

  useEffect(() => {
    if (prevStock.current !== stock) {
      prevStock.current = stock;
      setPinging(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setPinging(false), 600);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [stock]);

  return (
    <div className="relative flex items-center justify-center size-8">
      {pinging && (
        <span
          className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
            stock === 0
              ? 'bg-destructive'
              : stock <= 5
                ? 'bg-amber-400'
                : 'bg-emerald-400'
          }`}
        />
      )}
      <span
        className={`relative z-10 text-base font-bold tabular-nums ${
          stock === 0
            ? 'text-destructive'
            : stock <= 5
              ? 'text-amber-600'
              : 'text-emerald-700'
        }`}
      >
        {stock}
      </span>
    </div>
  );
}

export default function BooksStockPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [openBookDialog, setOpenBookDialog] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [openRestockDialog, setOpenRestockDialog] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockStep, setRestockStep] = useState('input'); // 'input' | 'confirm'
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [viewTransactions, setViewTransactions] = useState([]);

  // Table state
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Forms
  const bookForm = useForm({
    defaultValues: { name: '', purchase_price: '', sell_price: '', stock: '' },
    mode: 'onSubmit',
  });

  const restockForm = useForm({
    defaultValues: { quantity: '', unit_price: '', notes: '' },
    mode: 'onSubmit',
  });

  const eurFormatter = useMemo(
    () =>
      new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }),
    []
  );

  const formatDateNl = (value) => {
    try {
      return new Date(value).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(value ?? '');
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const booksData = await bookInventoryAPI.get_all_books();
        setBooks(booksData || []);
      } catch (e) {
        console.error('Failed to load data', e);
        toast.error('Kon gegevens niet laden.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalStock = books.reduce((sum, b) => sum + (b.stock || 0), 0);
    const totalPurchaseValue = books.reduce(
      (sum, b) => sum + (b.stock || 0) * (b.purchase_price || 0),
      0
    );
    const totalSellValue = books.reduce(
      (sum, b) => sum + (b.stock || 0) * (b.sell_price || 0),
      0
    );
    return { totalTitles, totalStock, totalPurchaseValue, totalSellValue };
  }, [books]);

  /* ============ HANDLERS ============ */

  const handleCreateBook = useCallback(() => {
    setEditingBookId(null);
    bookForm.reset({ name: '', purchase_price: '', sell_price: '', stock: '' });
    setOpenBookDialog(true);
  }, [bookForm]);

  const handleEditBook = useCallback(
    (book) => {
      setEditingBookId(book.id);
      bookForm.reset({
        name: book.name,
        purchase_price: String(book.purchase_price || ''),
        sell_price: String(book.sell_price || ''),
        stock: String(book.stock || ''),
      });
      setOpenBookDialog(true);
    },
    [bookForm]
  );

  const handleSubmitBook = async (values) => {
    const payload = {
      name: values.name,
      purchase_price: Number(values.purchase_price),
      sell_price: Number(values.sell_price),
      stock: Number(values.stock),
    };
    try {
      if (editingBookId != null) {
        const result = await bookInventoryAPI.update_book(
          editingBookId,
          payload
        );
        setBooks((prev) =>
          prev.map((b) => (b.id === editingBookId ? result.book : b))
        );
        toast.success(`"${result.book.name}" bijgewerkt`);
      } else {
        const result = await bookInventoryAPI.create_book(payload);
        setBooks((prev) => [...prev, result.book]);
        toast.success(`"${result.book.name}" toegevoegd`);
      }
      setOpenBookDialog(false);
      setEditingBookId(null);
    } catch (e) {
      console.error('Save book failed', e);
      toast.error('Opslaan boek mislukt');
    }
  };

  // Restock
  const handleOpenRestock = useCallback(
    (book) => {
      setRestockTarget(book);
      setRestockStep('input');
      restockForm.reset({
        quantity: '',
        unit_price: String(book.purchase_price || ''),
        notes: '',
      });
      setOpenRestockDialog(true);
    },
    [restockForm]
  );

  const handleRestockNext = () => {
    const values = restockForm.getValues();
    if (!values.quantity || Number(values.quantity) <= 0) {
      toast.error('Voer een geldig aantal in');
      return;
    }
    setRestockStep('confirm');
  };

  const handleConfirmRestock = async () => {
    const values = restockForm.getValues();
    try {
      const result = await bookInventoryAPI.restock_book(restockTarget.id, {
        quantity: Number(values.quantity),
        unit_price: Number(values.unit_price) || restockTarget.purchase_price,
        notes: values.notes,
      });
      setBooks((prev) =>
        prev.map((b) => (b.id === restockTarget.id ? result.book : b))
      );
      setOpenRestockDialog(false);
      setRestockTarget(null);
      toast.success(
        `${values.quantity}x "${restockTarget.name}" bijgevuld. Uitgave geregistreerd.`
      );
    } catch (e) {
      console.error('Restock failed', e);
      toast.error(
        e.response?.data?.error || 'Bijvullen mislukt'
      );
    }
  };

  // Stock adjustment (+/-)
  const handleAdjustStock = useCallback(
    async (book, delta) => {
      const newStock = book.stock + delta;
      if (newStock < 0) return;
      try {
        const result = await bookInventoryAPI.update_book(book.id, {
          stock: newStock,
        });
        setBooks((prev) =>
          prev.map((b) => (b.id === book.id ? result.book : b))
        );
      } catch (e) {
        console.error('Stock adjustment failed', e);
        toast.error('Voorraad aanpassen mislukt');
      }
    },
    []
  );

  // Delete
  const handleOpenDelete = useCallback((book) => {
    setDeleteTarget(book);
    setOpenDeleteDialog(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await bookInventoryAPI.delete_book(deleteTarget.id);
      setBooks((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
      toast.success(`"${deleteTarget.name}" verwijderd`);
    } catch (e) {
      console.error('Delete book failed', e);
      toast.error('Verwijderen mislukt');
    }
  };

  // View details
  const handleViewBook = useCallback(async (book) => {
    setViewTarget(book);
    setOpenViewDialog(true);
    try {
      const detail = await bookInventoryAPI.get_book_by_id(book.id);
      setViewTarget(detail);
      setViewTransactions(detail.transactions || []);
    } catch (e) {
      console.error('Failed to load book details', e);
    }
  }, []);

  /* ============ TABLE COLUMNS ============ */

  const columns = useMemo(
    () => [
      {
        header: 'Aantal',
        id: 'amount',
        size: 60,
        cell: ({ row }) => <StockAmountCell stock={row.original.stock} />,
      },
      {
        header: 'Naam',
        accessorKey: 'name',
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      },
      {
        header: 'Inkoopprijs',
        accessorKey: 'purchase_price',
        cell: (info) => eurFormatter.format(info.getValue()),
      },
      {
        header: 'Verkoopprijs',
        accessorKey: 'sell_price',
        cell: (info) => eurFormatter.format(info.getValue()),
      },
      {
        header: 'Voorraad',
        accessorKey: 'stock',
        cell: ({ row }) => {
          const val = row.original.stock;
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-7 shrink-0 rounded-full"
                disabled={val <= 0}
                onClick={() => handleAdjustStock(row.original, -1)}
                title="Voorraad -1"
              >
                <Minus className="size-3.5" />
              </Button>
              <span
                className={`min-w-[2rem] text-center font-semibold tabular-nums ${
                  val === 0
                    ? 'text-destructive'
                    : val <= 5
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                }`}
              >
                {val}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-7 shrink-0 rounded-full"
                onClick={() => handleAdjustStock(row.original, 1)}
                title="Voorraad +1"
              >
                <Plus className="size-3.5 text-primary" />
              </Button>
            </div>
          );
        },
      },
      {
        header: '',
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewBook(row.original)}
              title="Bekijken"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditBook(row.original)}
              title="Bewerken"
            >
              <Edit className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenRestock(row.original)}
              title="Bijvullen"
            >
              <PackagePlus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenDelete(row.original)}
              title="Verwijderen"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [
      eurFormatter,
      handleViewBook,
      handleEditBook,
      handleOpenRestock,
      handleOpenDelete,
      handleAdjustStock,
    ]
  );

  const table = useReactTable({
    data: books,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* ============ COMPUTED VALUES FOR RESTOCK/SELL CONFIRMATIONS ============ */

  const restockValues = restockForm.watch();
  const restockTotal =
    (Number(restockValues.quantity) || 0) *
    (Number(restockValues.unit_price) || restockTarget?.purchase_price || 0);

  /* ============ RENDER ============ */

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boekenvoorraad"
        icon={<LibraryBig className="size-9" />}
        description="Beheer de boekenvoorraad."
        buttonText="Nieuw boek"
        onAdd={handleCreateBook}
      />

      {/* Stats */}
      {/* <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="px-2.5 py-0.5">
          Titels: {stats.totalTitles}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700"
        >
          Totale voorraad: {stats.totalStock}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2.5 py-0.5 bg-blue-50 text-blue-700"
        >
          Inkoopwaarde: {eurFormatter.format(stats.totalPurchaseValue)}
        </Badge>
        <Badge
          variant="secondary"
          className="px-2.5 py-0.5 bg-amber-50 text-amber-700"
        >
          Verkoopwaarde: {eurFormatter.format(stats.totalSellValue)}
        </Badge>
      </div> */}

      <Toolbar table={table} filterColumn="name" hideColumns />
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[720px]">
          <DataTable table={table} columns={columns} loading={loading} />
        </div>
      </div>

      {/* ============ CREATE / EDIT BOOK DIALOG ============ */}
      <Dialog open={openBookDialog} onOpenChange={setOpenBookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBookId != null ? 'Boek bewerken' : 'Nieuw Boek'}
            </DialogTitle>
          </DialogHeader>
          <Form {...bookForm}>
            <form
              onSubmit={bookForm.handleSubmit(handleSubmitBook)}
              className="space-y-4"
            >
              <FormField
                control={bookForm.control}
                name="name"
                rules={{ required: 'Naam is verplicht' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={bookForm.control}
                  name="purchase_price"
                  rules={{ required: 'Inkoopprijs is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inkoopprijs (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bookForm.control}
                  name="sell_price"
                  rules={{ required: 'Verkoopprijs is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verkoopprijs (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={bookForm.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beginvoorraad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Opslaan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ============ RESTOCK DIALOG (with confirmation) ============ */}
      <Dialog
        open={openRestockDialog}
        onOpenChange={(v) => {
          setOpenRestockDialog(v);
          if (!v) {
            setRestockTarget(null);
            setRestockStep('input');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {restockStep === 'confirm'
                ? 'Bijvulling bevestigen'
                : 'Boek bijvullen'}
            </DialogTitle>
            {restockTarget && restockStep === 'input' && (
              <DialogDescription className="text-lg text-regular">
                Vul de voorraad aan voor &quot;{restockTarget.name}&quot;.&nbsp;
                <span className="font-medium">Huidige voorraad: {restockTarget.stock}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {restockStep === 'input' ? (
            <Form {...restockForm}>
              <div className="space-y-4">
                <FormField
                  control={restockForm.control}
                  name="quantity"
                  rules={{ required: 'Aantal is verplicht' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aantal bij te vullen</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={restockForm.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stukprijs (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={String(
                            restockTarget?.purchase_price || '0.00'
                          )}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {/* <FormField
                  control={restockForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opmerking (optioneel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Bijv. Bestelling #123" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                /> */}
                {/* Live total preview */}
                {Number(restockValues.quantity) > 0 && (
                  <div className="rounded-md border p-3 bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {restockValues.quantity}x @{' '}
                        {eurFormatter.format(
                          Number(restockValues.unit_price) ||
                            restockTarget?.purchase_price ||
                            0
                        )}
                      </span>
                      <span className="font-medium">
                        Totaal: {eurFormatter.format(restockTotal)}
                      </span>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenRestockDialog(false)}
                  >
                    Annuleren
                  </Button>
                  <Button type="button" onClick={handleRestockNext}>
                    Volgende
                  </Button>
                </DialogFooter>
              </div>
            </Form>
          ) : (
            // CONFIRMATION STEP
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boek</span>
                  <span className="font-medium">{restockTarget?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Huidige voorraad</span>
                  <span>{restockTarget?.stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bij te vullen</span>
                  <span>{restockValues.quantity} stuks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stukprijs</span>
                  <span>
                    {eurFormatter.format(
                      Number(restockValues.unit_price) ||
                        restockTarget?.purchase_price ||
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nieuwe voorraad</span>
                  <span className="font-medium">
                    {(restockTarget?.stock || 0) +
                      (Number(restockValues.quantity) || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium">Totale kosten (uitgave)</span>
                  <span className="font-bold text-lg text-rose-600">
                    {eurFormatter.format(restockTotal)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm">
                  Dit bedrag wordt als uitgave geregistreerd in de financiën.
                </span>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRestockStep('input')}
                >
                  Terug
                </Button>
                <Button type="button" onClick={handleConfirmRestock}>
                  Bevestigen
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============ DELETE CONFIRMATION DIALOG ============ */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Boek verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je &quot;{deleteTarget?.name}&quot; wilt
              verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ VIEW DETAILS DIALOG ============ */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Boekdetails</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Naam</div>
                  <div className="font-medium">{viewTarget.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Voorraad</div>
                  <div className="font-medium">
                    <Badge
                      variant={viewTarget.stock > 0 ? 'secondary' : 'destructive'}
                      className={
                        viewTarget.stock > 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : ''
                      }
                    >
                      {viewTarget.stock}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Inkoopprijs
                  </div>
                  <div className="font-medium">
                    {eurFormatter.format(viewTarget.purchase_price)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Verkoopprijs
                  </div>
                  <div className="font-medium">
                    {eurFormatter.format(viewTarget.sell_price)}
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              {viewTransactions.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Recente transacties
                  </div>
                  <Card className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Aantal</TableHead>
                          <TableHead>Totaal</TableHead>
                          <TableHead>Leerling</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              {formatDateNl(tx.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  tx.type === 'restock'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-green-50 text-green-700'
                                }
                              >
                                {tx.type === 'restock'
                                  ? 'Bijgevuld'
                                  : 'Verkocht'}
                              </Badge>
                            </TableCell>
                            <TableCell>{tx.quantity}</TableCell>
                            <TableCell>
                              {eurFormatter.format(tx.total_price)}
                            </TableCell>
                            <TableCell>
                              {tx.student
                                ? `${tx.student.first_name} ${tx.student.last_name}`
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
