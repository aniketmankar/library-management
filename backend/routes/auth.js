const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  let connection;
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    connection = await pool.getConnection();
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );

    const token = jwt.sign(
      { id: result.insertId, email, username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    connection.release();
    res.status(201).json({ 
      message: 'Registered successfully', 
      user: { id: result.insertId, username, email, role: 'user' }, 
      token 
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    connection.release();
    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, username: user.username, email: user.email, role: user.role }, 
      token 
    });
  } catch (error) {
    if (connection) connection.release();
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, username, email, role FROM users WHERE id = ?', 
      [req.user.id]
    );
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;