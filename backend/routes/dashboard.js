const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [bookStats] = await connection.query(
      'SELECT COUNT(*) as totalBooks, SUM(available_copies) as availableBooks FROM books'
    );
    
    const [memberStats] = await connection.query(
      'SELECT COUNT(*) as totalMembers, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as activeMembers FROM members'
    );
    
    connection.release();
    
    res.json({
      totalBooks: bookStats[0].totalBooks || 0,
      totalMembers: memberStats[0].totalMembers || 0,
      booksIssued: 0,
      overdueBooks: 0,
      availableBooks: bookStats[0].availableBooks || 0,
      activeMembers: memberStats[0].activeMembers || 0
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [recentBooks] = await connection.query(
      'SELECT title, author, created_at FROM books ORDER BY created_at DESC LIMIT 5'
    );
    
    const [recentMembers] = await connection.query(
      'SELECT name, email, created_at FROM members ORDER BY created_at DESC LIMIT 5'
    );
    
    connection.release();
    
    const activities = [
      ...recentBooks.map(book => ({
        id: `book_${book.title}`,
        date: book.created_at.toISOString().split('T')[0],
        activity: `Book Added: ${book.title}`,
        user: 'System'
      })),
      ...recentMembers.map(member => ({
        id: `member_${member.email}`,
        date: member.created_at.toISOString().split('T')[0],
        activity: `Member Registered: ${member.name}`,
        user: 'System'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    res.json({ activities });
  } catch (error) {
    if (connection) connection.release();
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

module.exports = router;