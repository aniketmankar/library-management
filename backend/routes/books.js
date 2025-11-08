const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const booksController = require('../controllers/booksController');

// Get all books
router.get('/', authenticateToken, booksController.getAllBooks);

// Get single book
router.get('/:id', authenticateToken, booksController.getBookById);

// Create book
router.post('/', authenticateToken, booksController.createBook);

// Update book
router.put('/:id', authenticateToken, booksController.updateBook);

// Delete book
router.delete('/:id', authenticateToken, booksController.deleteBook);

// Get categories
router.get('/categories/list', authenticateToken, booksController.getCategories);

// Get book stats
router.get('/stats/summary', authenticateToken, booksController.getBookStats);

module.exports = router;