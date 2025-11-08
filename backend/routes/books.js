const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireStaff } = require('../middleware/rbac');
const booksController = require('../controllers/booksController');

// Get all books - accessible by all authenticated users
router.get('/', authenticateToken, booksController.getAllBooks);

// Get single book - accessible by all authenticated users
router.get('/:id', authenticateToken, booksController.getBookById);

// Create book - requires manage_books permission
router.post('/', authenticateToken, requirePermission('manage_books'), booksController.createBook);

// Update book - requires manage_books permission
router.put('/:id', authenticateToken, requirePermission('manage_books'), booksController.updateBook);

// Delete book - requires manage_books permission
router.delete('/:id', authenticateToken, requirePermission('manage_books'), booksController.deleteBook);

// Get categories - accessible by all authenticated users
router.get('/categories/list', authenticateToken, booksController.getCategories);

// Get book stats - requires staff access (admin/librarian)
router.get('/stats/summary', authenticateToken, requireStaff, booksController.getBookStats);

module.exports = router;