const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all librarians
exports.getAllLibrarians = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [librarians] = await connection.query(`
      SELECT u.id, u.username, u.email, u.created_at,
             GROUP_CONCAT(lp.permission) as permissions
      FROM users u
      LEFT JOIN librarian_permissions lp ON u.id = lp.user_id
      WHERE u.role = 'librarian'
      GROUP BY u.id, u.username, u.email, u.created_at
      ORDER BY u.created_at DESC
    `);
    
    // Parse permissions string into array
    const formattedLibrarians = librarians.map(lib => ({
      ...lib,
      permissions: lib.permissions ? lib.permissions.split(',') : []
    }));
    
    connection.release();
    res.json({ librarians: formattedLibrarians });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get librarians error:', error);
    res.status(500).json({ error: 'Failed to fetch librarians' });
  }
};

// Get single librarian
exports.getLibrarianById = async (req, res) => {
  let connection;
  try {
    const librarianId = req.params.id;
    connection = await pool.getConnection();
    
    const [librarians] = await connection.query(`
      SELECT u.id, u.username, u.email, u.created_at,
             GROUP_CONCAT(lp.permission) as permissions
      FROM users u
      LEFT JOIN librarian_permissions lp ON u.id = lp.user_id
      WHERE u.id = ? AND u.role = 'librarian'
      GROUP BY u.id
    `, [librarianId]);
    
    if (librarians.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Librarian not found' });
    }
    
    const librarian = {
      ...librarians[0],
      permissions: librarians[0].permissions ? librarians[0].permissions.split(',') : []
    };
    
    connection.release();
    res.json({ librarian });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get librarian error:', error);
    res.status(500).json({ error: 'Failed to fetch librarian' });
  }
};

// Add new librarian
exports.createLibrarian = async (req, res) => {
  let connection;
  try {
    const { username, email, password, permissions } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const validPermissions = ['manage_books', 'manage_members', 'issue_books', 'view_reports'];
    const selectedPermissions = permissions || [];
    
    const invalidPerms = selectedPermissions.filter(p => !validPermissions.includes(p));
    if (invalidPerms.length > 0) {
      return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
    }

    connection = await pool.getConnection();
    
    // Check if email already exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email already registered' });
    }

    await connection.beginTransaction();

    // Create librarian user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'librarian']
    );

    const userId = result.insertId;

    // Add permissions
    if (selectedPermissions.length > 0) {
      const permissionValues = selectedPermissions.map(perm => [userId, perm]);
      await connection.query(
        'INSERT INTO librarian_permissions (user_id, permission) VALUES ?',
        [permissionValues]
      );
    }

    await connection.commit();

    const [newLibrarian] = await connection.query(`
      SELECT u.id, u.username, u.email, u.created_at,
             GROUP_CONCAT(lp.permission) as permissions
      FROM users u
      LEFT JOIN librarian_permissions lp ON u.id = lp.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    connection.release();

    res.status(201).json({
      message: 'Librarian created successfully',
      librarian: {
        ...newLibrarian[0],
        permissions: newLibrarian[0].permissions ? newLibrarian[0].permissions.split(',') : []
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Create librarian error:', error);
    res.status(500).json({ error: 'Failed to create librarian' });
  }
};

// Update librarian permissions
exports.updateLibrarian = async (req, res) => {
  let connection;
  try {
    const librarianId = req.params.id;
    const { username, email, permissions } = req.body;

    connection = await pool.getConnection();
    
    // Check if librarian exists
    const [existing] = await connection.query(
      'SELECT * FROM users WHERE id = ? AND role = "librarian"',
      [librarianId]
    );
    
    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Librarian not found' });
    }

    await connection.beginTransaction();

    // Update basic info if provided
    const updates = [];
    const values = [];
    
    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    
    if (email) {
      // Check if email is already taken by another user
      const [emailCheck] = await connection.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, librarianId]
      );
      
      if (emailCheck.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      updates.push('email = ?');
      values.push(email);
    }
    
    if (updates.length > 0) {
      values.push(librarianId);
      await connection.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update permissions
    if (permissions) {
      const validPermissions = ['manage_books', 'manage_members', 'issue_books', 'view_reports'];
      const selectedPermissions = Array.isArray(permissions) ? permissions : [];
      
      const invalidPerms = selectedPermissions.filter(p => !validPermissions.includes(p));
      if (invalidPerms.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
      }

      // Delete existing permissions
      await connection.query(
        'DELETE FROM librarian_permissions WHERE user_id = ?',
        [librarianId]
      );

      // Add new permissions
      if (selectedPermissions.length > 0) {
        const permissionValues = selectedPermissions.map(perm => [librarianId, perm]);
        await connection.query(
          'INSERT INTO librarian_permissions (user_id, permission) VALUES ?',
          [permissionValues]
        );
      }
    }

    await connection.commit();

    // Fetch updated librarian
    const [updated] = await connection.query(`
      SELECT u.id, u.username, u.email, u.created_at,
             GROUP_CONCAT(lp.permission) as permissions
      FROM users u
      LEFT JOIN librarian_permissions lp ON u.id = lp.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [librarianId]);

    connection.release();

    res.json({
      message: 'Librarian updated successfully',
      librarian: {
        ...updated[0],
        permissions: updated[0].permissions ? updated[0].permissions.split(',') : []
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Update librarian error:', error);
    res.status(500).json({ error: 'Failed to update librarian' });
  }
};

// Delete librarian
exports.deleteLibrarian = async (req, res) => {
  let connection;
  try {
    const librarianId = req.params.id;

    connection = await pool.getConnection();
    
    // Check if librarian exists
    const [librarian] = await connection.query(
      'SELECT * FROM users WHERE id = ? AND role = "librarian"',
      [librarianId]
    );
    
    if (librarian.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Librarian not found' });
    }

    await connection.beginTransaction();

    // Delete permissions
    await connection.query(
      'DELETE FROM librarian_permissions WHERE user_id = ?',
      [librarianId]
    );

    // Delete user
    await connection.query(
      'DELETE FROM users WHERE id = ?',
      [librarianId]
    );

    await connection.commit();
    connection.release();

    res.json({ message: 'Librarian deleted successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Delete librarian error:', error);
    res.status(500).json({ error: 'Failed to delete librarian' });
  }
};

// Get available permissions
exports.getPermissions = async (req, res) => {
  const permissions = [
    { id: 'manage_books', name: 'Manage Books', description: 'Add, edit, and delete books' },
    { id: 'manage_members', name: 'Manage Members', description: 'Add, edit, and manage library members' },
    { id: 'issue_books', name: 'Issue Books', description: 'Issue and return books' },
    { id: 'view_reports', name: 'View Reports', description: 'View library reports and statistics' }
  ];
  
  res.json({ permissions });
};