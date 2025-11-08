const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireStaff } = require('../middleware/rbac');
const membersController = require('../controllers/membersController');

// Get all members - requires manage_members permission
router.get('/', authenticateToken, requirePermission('manage_members'), membersController.getAllMembers);

// Get single member - requires manage_members permission
router.get('/:id', authenticateToken, requirePermission('manage_members'), membersController.getMemberById);

// Create member - requires manage_members permission
router.post('/', authenticateToken, requirePermission('manage_members'), membersController.createMember);

// Update member - requires manage_members permission
router.put('/:id', authenticateToken, requirePermission('manage_members'), membersController.updateMember);

// Delete member - requires manage_members permission
router.delete('/:id', authenticateToken, requirePermission('manage_members'), membersController.deleteMember);

// Renew membership - requires manage_members permission
router.post('/:id/renew', authenticateToken, requirePermission('manage_members'), membersController.renewMembership);

// Get member stats - requires staff access
router.get('/stats/summary', authenticateToken, requireStaff, membersController.getMemberStats);

// Get expiring memberships - requires staff access
router.get('/expiring/list', authenticateToken, requireStaff, membersController.getExpiringMemberships);

module.exports = router;