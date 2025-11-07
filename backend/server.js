const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// Simple CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Users table ready');

    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@library.com']);
    
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@library.com', hashedPassword, 'admin']
      );
      console.log('✓ Default admin user created');
    }

    connection.release();
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

app.post('/api/auth/register', async (req, res) => {
  let connection;
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
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
      { expiresIn: '24h' }
    );

    connection.release();
    res.status(201).json({ message: 'Registered', user: { id: result.insertId, username, email, role: 'user' }, token });
  } catch (error) {
    console.error('Register error:', error);
    if (connection) connection.release();
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
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
      { expiresIn: '24h' }
    );

    connection.release();
    res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
  } catch (error) {
    console.error('Login error:', error);
    if (connection) connection.release();
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, username, email, role FROM users WHERE id = ?', [req.user.id]);
    connection.release();
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({ totalBooks: 150, totalMembers: 45, booksIssued: 23, overdueBooks: 5 });
});

app.get('/api/dashboard/activity', authenticateToken, (req, res) => {
  res.json({ activities: [
    { id: 1, date: '2025-11-03', activity: 'Book Issued', user: 'Admin' },
    { id: 2, date: '2025-11-03', activity: 'Member Added', user: 'Admin' }
  ]});
});

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});