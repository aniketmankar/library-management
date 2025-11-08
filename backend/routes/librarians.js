const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const librariansController = require('../controllers/librariansController');

// Get available permissions (must be before :id route)
router.get('/permissions/list', authenticateToken, requireAdmin, librariansController.getPermissions);

// All other routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all librarians
router.get('/', librariansController.getAllLibrarians);

// Get single librarian
router.get('/:id', librariansController.getLibrarianById);

// Create librarian
router.post('/', librariansController.createLibrarian);

// Update librarian
router.put('/:id', librariansController.updateLibrarian);

// Delete librarian
router.delete('/:id', librariansController.deleteLibrarian);

module.exports = router;