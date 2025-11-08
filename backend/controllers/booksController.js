const pool = require('../config/database');
const { validateBook, validateISBN } = require('../utils/validator')

// Get all books
exports.getAllBooks = async (req, res) => {
  let connection;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    connection = await pool.getConnection();

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(title LIKE ? OR author LIKE ? OR isbn LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM books ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    const [books] = await connection.query(
      `SELECT * FROM books ${whereClause} 
       ORDER BY ${sortBy} ${sortOrder} 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();

    res.json({
      books,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

// Get single book
exports.getBookById = async (req, res) => {
  let connection;
  try {
    const bookId = req.params.id;
    connection = await pool.getConnection();
    const [books] = await connection.query('SELECT * FROM books WHERE id = ?', [bookId]);
    connection.release();

    if (books.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ book: books[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
};

// Create book
exports.createBook = async (req, res) => {
  let connection;
  try {
    const bookData = req.body;

    const validation = validateBook(bookData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (bookData.isbn && !validateISBN(bookData.isbn)) {
      return res.status(400).json({ error: 'Invalid ISBN format' });
    }

    connection = await pool.getConnection();

    if (bookData.isbn) {
      const [existing] = await connection.query('SELECT id FROM books WHERE isbn = ?', [bookData.isbn]);
      if (existing.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'ISBN already exists' });
      }
    }

    const availableCopies = bookData.total_copies || 1;

    const [result] = await connection.query(
      `INSERT INTO books (title, author, isbn, category, total_copies, available_copies,
        publication_year, publisher, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookData.title, bookData.author, bookData.isbn || null, bookData.category || null,
        bookData.total_copies || 1, availableCopies, bookData.publication_year || null,
        bookData.publisher || null, bookData.description || null
      ]
    );

    const [newBook] = await connection.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    connection.release();

    res.status(201).json({ message: 'Book added successfully', book: newBook[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Add book error:', error);
    res.status(500).json({ error: 'Failed to add book' });
  }
};

// Update book
exports.updateBook = async (req, res) => {
  let connection;
  try {
    const bookId = req.params.id;
    const updates = req.body;

    const allowedFields = ['title', 'author', 'isbn', 'category', 'total_copies', 'publication_year', 'publisher', 'description'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    connection = await pool.getConnection();

    const [existingBook] = await connection.query('SELECT * FROM books WHERE id = ?', [bookId]);
    if (existingBook.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Book not found' });
    }

    if (updates.isbn) {
      if (!validateISBN(updates.isbn)) {
        connection.release();
        return res.status(400).json({ error: 'Invalid ISBN format' });
      }
      const [duplicate] = await connection.query('SELECT id FROM books WHERE isbn = ? AND id != ?', [updates.isbn, bookId]);
      if (duplicate.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'ISBN already exists' });
      }
    }

    if (updates.total_copies !== undefined) {
      const currentBook = existingBook[0];
      const issuedCopies = currentBook.total_copies - currentBook.available_copies;
      if (updates.total_copies < issuedCopies) {
        connection.release();
        return res.status(400).json({ error: `Cannot reduce total copies below ${issuedCopies} (currently issued)` });
      }
      updates.available_copies = updates.total_copies - issuedCopies;
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updates[field]);
    if (updates.available_copies !== undefined) values.push(updates.available_copies);
    values.push(bookId);

    await connection.query(
      `UPDATE books SET ${setClause}${updates.available_copies !== undefined ? ', available_copies = ?' : ''} WHERE id = ?`,
      values
    );

    const [updatedBook] = await connection.query('SELECT * FROM books WHERE id = ?', [bookId]);
    connection.release();

    res.json({ message: 'Book updated successfully', book: updatedBook[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  let connection;
  try {
    const bookId = req.params.id;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete books' });
    }

    connection = await pool.getConnection();
    const [book] = await connection.query('SELECT * FROM books WHERE id = ?', [bookId]);

    if (book.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Book not found' });
    }

    try {
      const [transactions] = await connection.query(
        'SELECT COUNT(*) as count FROM transactions WHERE book_id = ? AND status = "issued"',
        [bookId]
      );
      if (transactions[0].count > 0) {
        connection.release();
        return res.status(400).json({ error: 'Cannot delete book with active transactions' });
      }
    } catch (err) {
      // Transactions table doesn't exist yet
    }

    await connection.query('DELETE FROM books WHERE id = ?', [bookId]);
    connection.release();

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    if (connection) connection.release();
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [categories] = await connection.query(
      'SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category'
    );
    connection.release();
    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get book stats
exports.getBookStats = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [stats] = await connection.query(`
      SELECT COUNT(*) as total_books, SUM(total_copies) as total_copies,
             SUM(available_copies) as available_copies, COUNT(DISTINCT category) as total_categories
      FROM books
    `);
    connection.release();
    res.json({ stats: stats[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};