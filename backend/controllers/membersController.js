const pool = require('../config/database');
const { validateMember, validateEmail, validatePhone } = require('../utils/validator');

// Generate unique member ID
async function generateMemberId(connection) {
  const year = new Date().getFullYear();
  const [lastMember] = await connection.query(
    'SELECT member_id FROM members WHERE member_id LIKE ? ORDER BY member_id DESC LIMIT 1',
    [`MEM${year}%`]
  );

  if (lastMember.length === 0) {
    return `MEM${year}001`;
  }

  const lastNumber = parseInt(lastMember[0].member_id.slice(-3));
  const newNumber = String(lastNumber + 1).padStart(3, '0');
  return `MEM${year}${newNumber}`;
}

// Get all members
exports.getAllMembers = async (req, res) => {
  let connection;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const membershipType = req.query.membership_type || '';
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    connection = await pool.getConnection();

    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR member_id LIKE ? OR phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (membershipType) {
      whereConditions.push('membership_type = ?');
      params.push(membershipType);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const [countResult] = await connection.query(`SELECT COUNT(*) as total FROM members ${whereClause}`, params);
    const total = countResult[0].total;

    const [members] = await connection.query(
      `SELECT id, member_id, name, email, phone, address, membership_type, membership_start, 
              membership_end, status, created_at, updated_at
       FROM members ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    connection.release();
    res.json({ members, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

// Get single member
exports.getMemberById = async (req, res) => {
  let connection;
  try {
    const memberId = req.params.id;
    connection = await pool.getConnection();
    const [members] = await connection.query('SELECT * FROM members WHERE id = ?', [memberId]);
    connection.release();

    if (members.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ member: members[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get member error:', error);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
};

// Create member
exports.createMember = async (req, res) => {
  let connection;
  try {
    const memberData = req.body;

    const validation = validateMember(memberData);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!validateEmail(memberData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (memberData.phone && !validatePhone(memberData.phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }

    connection = await pool.getConnection();

    const [existingEmail] = await connection.query('SELECT id FROM members WHERE email = ?', [memberData.email]);
    if (existingEmail.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Email already registered' });
    }

    const memberId = await generateMemberId(connection);
    const membershipStart = new Date();
    const membershipEnd = new Date();
    
    switch (memberData.membership_type || 'standard') {
      case 'premium':
        membershipEnd.setFullYear(membershipEnd.getFullYear() + 2);
        break;
      case 'student':
        membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);
        break;
      default:
        membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);
    }

    const [result] = await connection.query(
      `INSERT INTO members (member_id, name, email, phone, address, membership_type, 
        membership_start, membership_end, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memberId, memberData.name, memberData.email, memberData.phone || null,
        memberData.address || null, memberData.membership_type || 'standard',
        membershipStart.toISOString().split('T')[0], membershipEnd.toISOString().split('T')[0], 'active'
      ]
    );

    const [newMember] = await connection.query('SELECT * FROM members WHERE id = ?', [result.insertId]);
    connection.release();

    res.status(201).json({ message: 'Member added successfully', member: newMember[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// Update member
exports.updateMember = async (req, res) => {
  let connection;
  try {
    const memberId = req.params.id;
    const updates = req.body;

    const allowedFields = ['name', 'email', 'phone', 'address', 'membership_type', 'membership_end', 'status'];
    const updateFields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (updates.email && !validateEmail(updates.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (updates.phone && !validatePhone(updates.phone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }

    connection = await pool.getConnection();

    const [existingMember] = await connection.query('SELECT * FROM members WHERE id = ?', [memberId]);
    if (existingMember.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Member not found' });
    }

    if (updates.email) {
      const [duplicate] = await connection.query('SELECT id FROM members WHERE email = ? AND id != ?', [updates.email, memberId]);
      if (duplicate.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updates[field]);
    values.push(memberId);

    await connection.query(`UPDATE members SET ${setClause} WHERE id = ?`, values);

    const [updatedMember] = await connection.query('SELECT * FROM members WHERE id = ?', [memberId]);
    connection.release();

    res.json({ message: 'Member updated successfully', member: updatedMember[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
};

// Delete member
exports.deleteMember = async (req, res) => {
  let connection;
  try {
    const memberId = req.params.id;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete members' });
    }

    connection = await pool.getConnection();
    const [member] = await connection.query('SELECT * FROM members WHERE id = ?', [memberId]);

    if (member.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Member not found' });
    }

    try {
      const [transactions] = await connection.query(
        'SELECT COUNT(*) as count FROM transactions WHERE member_id = ? AND status = "issued"',
        [memberId]
      );
      if (transactions[0].count > 0) {
        connection.release();
        return res.status(400).json({ error: 'Cannot delete member with active book loans' });
      }
    } catch (err) {
      // Transactions table doesn't exist yet
    }

    await connection.query('UPDATE members SET status = "inactive" WHERE id = ?', [memberId]);
    connection.release();

    res.json({ message: 'Member deactivated successfully' });
  } catch (error) {
    if (connection) connection.release();
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
};

// Renew membership
exports.renewMembership = async (req, res) => {
  let connection;
  try {
    const memberId = req.params.id;
    const { months } = req.body;

    if (!months || months < 1 || months > 24) {
      return res.status(400).json({ error: 'Invalid renewal period (1-24 months)' });
    }

    connection = await pool.getConnection();
    const [member] = await connection.query('SELECT * FROM members WHERE id = ?', [memberId]);

    if (member.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Member not found' });
    }

    const currentEndDate = new Date(member[0].membership_end);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + parseInt(months));

    await connection.query(
      'UPDATE members SET membership_end = ?, status = "active" WHERE id = ?',
      [newEndDate.toISOString().split('T')[0], memberId]
    );

    const [updatedMember] = await connection.query('SELECT * FROM members WHERE id = ?', [memberId]);
    connection.release();

    res.json({ message: `Membership renewed for ${months} months`, member: updatedMember[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Renew membership error:', error);
    res.status(500).json({ error: 'Failed to renew membership' });
  }
};

// Get member stats
exports.getMemberStats = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [stats] = await connection.query(`
      SELECT COUNT(*) as total_members,
             SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_members,
             SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_members,
             SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_members,
             SUM(CASE WHEN membership_type = 'standard' THEN 1 ELSE 0 END) as standard_members,
             SUM(CASE WHEN membership_type = 'premium' THEN 1 ELSE 0 END) as premium_members,
             SUM(CASE WHEN membership_type = 'student' THEN 1 ELSE 0 END) as student_members
      FROM members
    `);
    connection.release();
    res.json({ stats: stats[0] });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get expiring memberships
exports.getExpiringMemberships = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [members] = await connection.query(`
      SELECT * FROM members 
      WHERE status = 'active' 
      AND membership_end BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY membership_end ASC
    `);
    connection.release();
    res.json({ members });
  } catch (error) {
    if (connection) connection.release();
    console.error('Get expiring memberships error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring memberships' });
  }
};