const express = require('express');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const membersRoutes = require('./routes/members');
const dashboardRoutes = require('./routes/dashboard');
const librariansRoutes = require('./routes/librarians');

const app = express();
const PORT = process.env.PORT || 5002;

// CORS Middleware
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

// Database initialization
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Connected to MySQL database');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'librarian', 'member') DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_role (role),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Users table ready');

    // Create librarian_permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS librarian_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        permission VARCHAR(50) NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_permission (user_id, permission),
        INDEX idx_user_permission (user_id, permission)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Librarian permissions table ready');

    // Create books table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(20) UNIQUE,
        category VARCHAR(100),
        total_copies INT DEFAULT 1,
        available_copies INT DEFAULT 1,
        publication_year INT,
        publisher VARCHAR(200),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_title (title),
        INDEX idx_author (author),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Books table ready');

    // Create members table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        membership_type ENUM('standard', 'premium', 'student') DEFAULT 'standard',
        membership_start DATE NOT NULL,
        membership_end DATE NOT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_member_id (member_id),
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Members table ready');

    // Create default admin user
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?', 
      ['admin@library.com']
    );
    
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@library.com', hashedPassword, 'admin']
      );
      console.log('✓ Default admin user created');
      console.log('  Email: admin@library.com');
      console.log('  Password: admin123');
    }

    // Create sample librarian if none exists
    const [librarians] = await connection.query(
      'SELECT * FROM users WHERE role = ?',
      ['librarian']
    );

    if (librarians.length === 0) {
      const hashedPassword = await bcrypt.hash('librarian123', 10);
      const [libResult] = await connection.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Sample Librarian', 'librarian@library.com', hashedPassword, 'librarian']
      );

      // Grant all permissions to sample librarian
      const permissions = ['manage_books', 'manage_members', 'issue_books', 'view_reports'];
      const permissionValues = permissions.map(perm => [libResult.insertId, perm]);
      await connection.query(
        'INSERT INTO librarian_permissions (user_id, permission) VALUES ?',
        [permissionValues]
      );

      console.log('✓ Sample librarian created');
      console.log('  Email: librarian@library.com');
      console.log('  Password: librarian123');
    }

    // Seed sample data if tables are empty
    const [bookCount] = await connection.query('SELECT COUNT(*) as count FROM books');
    if (bookCount[0].count === 0) {
      await seedSampleBooks(connection);
    }

    const [memberCount] = await connection.query('SELECT COUNT(*) as count FROM members');
    if (memberCount[0].count === 0) {
      await seedSampleMembers(connection);
    }

    connection.release();
  } catch (error) {
    console.error('Database initialization error:', error.message);
    process.exit(1);
  }
}

// Seed sample books
async function seedSampleBooks(connection) {
  const sampleBooks = [
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      category: 'Fiction',
      total_copies: 5,
      available_copies: 5,
      publication_year: 1925,
      publisher: 'Scribner',
      description: 'A classic American novel set in the Jazz Age'
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      category: 'Fiction',
      total_copies: 4,
      available_copies: 4,
      publication_year: 1960,
      publisher: 'J.B. Lippincott & Co.',
      description: 'A gripping tale of racial injustice and childhood innocence'
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      category: 'Science Fiction',
      total_copies: 6,
      available_copies: 6,
      publication_year: 1949,
      publisher: 'Secker & Warburg',
      description: 'A dystopian social science fiction novel'
    }
  ];

  for (const book of sampleBooks) {
    await connection.query(
      `INSERT INTO books (title, author, isbn, category, total_copies, available_copies, 
       publication_year, publisher, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        book.title, book.author, book.isbn, book.category, 
        book.total_copies, book.available_copies, book.publication_year, 
        book.publisher, book.description
      ]
    );
  }
  console.log('✓ Sample books added');
}

// Seed sample members
async function seedSampleMembers(connection) {
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const sampleMembers = [
    {
      member_id: 'MEM2025001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: '123 Main Street, City, State',
      membership_type: 'standard',
      membership_start: today.toISOString().split('T')[0],
      membership_end: oneYearLater.toISOString().split('T')[0],
      status: 'active'
    },
    {
      member_id: 'MEM2025002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      address: '456 Oak Avenue, City, State',
      membership_type: 'premium',
      membership_start: today.toISOString().split('T')[0],
      membership_end: oneYearLater.toISOString().split('T')[0],
      status: 'active'
    }
  ];

  for (const member of sampleMembers) {
    await connection.query(
      `INSERT INTO members (member_id, name, email, phone, address, membership_type, 
       membership_start, membership_end, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.member_id, member.name, member.email, member.phone, 
        member.address, member.membership_type, member.membership_start, 
        member.membership_end, member.status
      ]
    );
  }
  console.log('✓ Sample members added');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server running',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/librarians', librariansRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log('\n=================================');
  console.log('📚 Library Management System API');
  console.log('=================================\n');
  
  await initializeDatabase();
  
  console.log(`\n✓ Server running on port ${PORT}`);
  console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
  console.log('Available Endpoints:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/dashboard/stats');
  console.log('  GET    /api/dashboard/activity');
  console.log('  GET    /api/books');
  console.log('  POST   /api/books');
  console.log('  GET    /api/books/:id');
  console.log('  PUT    /api/books/:id');
  console.log('  DELETE /api/books/:id');
  console.log('  GET    /api/members');
  console.log('  POST   /api/members');
  console.log('  GET    /api/members/:id');
  console.log('  PUT    /api/members/:id');
  console.log('  DELETE /api/members/:id');
  console.log('  GET    /api/librarians (Admin only)');
  console.log('  POST   /api/librarians (Admin only)');
  console.log('  PUT    /api/librarians/:id (Admin only)');
  console.log('  DELETE /api/librarians/:id (Admin only)');
  console.log('\n=================================\n');
});