const { prisma } = require('../../prisma/connection');

/* -------------------- BOOK INVENTORY CRUD -------------------- */

// Get all books
exports.get_all_books = async (req, res) => {
  try {
    const books = await prisma.book_inventory.findMany({
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get a single book by ID with recent transactions
exports.get_book_by_id = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book_inventory.findUnique({
      where: { id: parseInt(id) },
      include: {
        transactions: {
          include: {
            student: { select: { id: true, first_name: true, last_name: true } },
          },
          orderBy: { created_at: 'desc' },
          take: 50,
        },
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Create a new book
exports.create_book = async (req, res) => {
  try {
    const { name, purchase_price, sell_price, stock } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const book = await prisma.book_inventory.create({
      data: {
        name: name.trim(),
        purchase_price: parseFloat(purchase_price) || 0,
        sell_price: parseFloat(sell_price) || 0,
        stock: parseInt(stock) || 0,
      },
    });

    res.status(201).json({ message: 'Book created', book });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Update a book
exports.update_book = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, purchase_price, sell_price, stock } = req.body;

    const existing = await prisma.book_inventory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = await prisma.book_inventory.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(purchase_price !== undefined
          ? { purchase_price: parseFloat(purchase_price) }
          : {}),
        ...(sell_price !== undefined
          ? { sell_price: parseFloat(sell_price) }
          : {}),
        ...(stock !== undefined ? { stock: parseInt(stock) } : {}),
      },
    });

    res.status(200).json({ message: 'Book updated', book });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete a book
exports.delete_book = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.book_inventory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await prisma.book_inventory.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Book deleted' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/* -------------------- RESTOCK (connected to finance) -------------------- */

exports.restock_book = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit_price, notes } = req.body;

    if (!quantity || parseInt(quantity) <= 0) {
      return res
        .status(400)
        .json({ error: 'Quantity must be a positive number' });
    }

    const book = await prisma.book_inventory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const qty = parseInt(quantity);
    const price = parseFloat(unit_price) || book.purchase_price;
    const totalPrice = qty * price;

    // Get active school year
    const activeYear = await prisma.school_year.findFirst({
      where: { is_active: true },
    });
    if (!activeYear) {
      return res.status(400).json({
        error: 'No active school year. Please activate a school year first.',
      });
    }

    // Find or create "Boekenaankoop" financial type
    let bookPurchaseType = await prisma.financial_type.findFirst({
      where: { name: 'Boekenaankoop' },
    });
    if (!bookPurchaseType) {
      bookPurchaseType = await prisma.financial_type.create({
        data: {
          name: 'Boekenaankoop',
          description: 'Inkoop van boeken voor voorraad',
        },
      });
    }

    // Atomic transaction: financial log + book transaction + stock update + saldo
    const result = await prisma.$transaction(async (tx) => {
      const financialLog = await tx.financial_log.create({
        data: {
          type_id: bookPurchaseType.id,
          amount: totalPrice,
          method: 'Bankoverschrijving',
          notes:
            notes ||
            `Bijbestelling: ${qty}x "${book.name}" @ €${price.toFixed(2)}`,
          transaction_type: 'expense',
          school_year_id: activeYear.id,
        },
      });

      const transaction = await tx.book_transaction.create({
        data: {
          book_id: parseInt(id),
          type: 'restock',
          quantity: qty,
          unit_price: price,
          total_price: totalPrice,
          financial_log_id: financialLog.id,
          notes,
        },
      });

      const updatedBook = await tx.book_inventory.update({
        where: { id: parseInt(id) },
        data: { stock: { increment: qty } },
      });

      // Decrease saldo (expense)
      const budget = await tx.finance_budget.findFirst();
      if (budget) {
        await tx.finance_budget.update({
          where: { id: budget.id },
          data: { amount: { decrement: totalPrice } },
        });
      }

      return { book: updatedBook, transaction, financialLog };
    });

    res.status(201).json({
      message: 'Book restocked successfully',
      book: result.book,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Error restocking book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/* -------------------- SELL BOOK (connected to finance) -------------------- */

exports.sell_book = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, student_id, unit_price, method, notes } = req.body;

    if (!quantity || parseInt(quantity) <= 0) {
      return res
        .status(400)
        .json({ error: 'Quantity must be a positive number' });
    }

    const book = await prisma.book_inventory.findUnique({
      where: { id: parseInt(id) },
    });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const qty = parseInt(quantity);
    if (book.stock < qty) {
      return res.status(400).json({
        error: `Not enough stock. Current stock: ${book.stock}, requested: ${qty}`,
      });
    }

    const sellUnitPrice = parseFloat(unit_price) || book.sell_price;
    const totalPrice = qty * sellUnitPrice;

    // Get active school year
    const activeYear = await prisma.school_year.findFirst({
      where: { is_active: true },
    });
    if (!activeYear) {
      return res.status(400).json({
        error: 'No active school year. Please activate a school year first.',
      });
    }

    // Find or create "Boekenverkoop" financial type
    let bookSaleType = await prisma.financial_type.findFirst({
      where: { name: 'Boekenverkoop' },
    });
    if (!bookSaleType) {
      bookSaleType = await prisma.financial_type.create({
        data: {
          name: 'Boekenverkoop',
          description: 'Verkoop van boeken aan leerlingen',
        },
      });
    }

    // Atomic transaction: financial log + book transaction + stock update + saldo
    const result = await prisma.$transaction(async (tx) => {
      const financialLog = await tx.financial_log.create({
        data: {
          type_id: bookSaleType.id,
          student_id: student_id ? parseInt(student_id) : null,
          amount: totalPrice,
          method: method || 'Cash',
          notes:
            notes ||
            `Verkoop: ${qty}x "${book.name}" @ €${sellUnitPrice.toFixed(2)}`,
          transaction_type: 'income',
          school_year_id: activeYear.id,
        },
        include: {
          type: true,
          student: { select: { first_name: true, last_name: true } },
        },
      });

      const transaction = await tx.book_transaction.create({
        data: {
          book_id: parseInt(id),
          type: 'sale',
          quantity: qty,
          unit_price: sellUnitPrice,
          total_price: totalPrice,
          student_id: student_id ? parseInt(student_id) : null,
          financial_log_id: financialLog.id,
          notes,
        },
      });

      const updatedBook = await tx.book_inventory.update({
        where: { id: parseInt(id) },
        data: { stock: { decrement: qty } },
      });

      // Increase saldo (income)
      const budget = await tx.finance_budget.findFirst();
      if (budget) {
        await tx.finance_budget.update({
          where: { id: budget.id },
          data: { amount: { increment: totalPrice } },
        });
      }

      return { book: updatedBook, transaction, financialLog };
    });

    // Format financial log for FinancePage consumption
    const fl = result.financialLog;
    const formattedLog = {
      id: fl.id,
      type: fl.type?.name ?? '',
      student: fl.student
        ? `${fl.student.first_name} ${fl.student.last_name}`
        : null,
      student_id: fl.student_id,
      course: null,
      course_id: null,
      amount: fl.amount,
      method: fl.method,
      notes: fl.notes,
      date: fl.date,
      transaction_type: fl.transaction_type,
    };

    res.status(201).json({
      message: 'Book sold successfully',
      book: result.book,
      transaction: result.transaction,
      financial_log: formattedLog,
    });
  } catch (error) {
    console.error('Error selling book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/* -------------------- BOOK TRANSACTIONS -------------------- */

exports.get_book_transactions = async (req, res) => {
  try {
    const where = {};

    if (req.query.book_id) {
      where.book_id = parseInt(req.query.book_id);
    }
    if (req.query.type) {
      where.type = req.query.type;
    }

    const transactions = await prisma.book_transaction.findMany({
      where,
      include: {
        book: { select: { id: true, name: true } },
        student: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching book transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
