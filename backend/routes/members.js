const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const membersController = require('../controllers/membersController');

// Get all members
router.get('/', authenticateToken, membersController.getAllMembers);

// Get single member
router.get('/:id', authenticateToken, membersController.getMemberById);

// Create member
router.post('/', authenticateToken, membersController.createMember);

// Update member
router.put('/:id', authenticateToken, membersController.updateMember);

// Delete member
router.delete('/:id', authenticateToken, membersController.deleteMember);

// Renew membership
router.post('/:id/renew', authenticateToken, membersController.renewMembership);

// Get member stats
router.get('/stats/summary', authenticateToken, membersController.getMemberStats);

// Get expiring memberships
router.get('/expiring/list', authenticateToken, membersController.getExpiringMemberships);

module.exports = router;