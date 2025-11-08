import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import AddMember from './AddMember';
import EditMember from './EditMember';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, search, statusFilter]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/members`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search,
          status: statusFilter
        }
      });

      setMembers(response.data.members);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load members. Please try again.');
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleAddMember = () => {
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/members/${selectedMember.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Member deactivated successfully!');
      setShowDeleteModal(false);
      setSelectedMember(null);
      fetchMembers();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete member');
    }
  };

  const onMemberAdded = () => {
    setShowAddModal(false);
    setSuccessMessage('Member added successfully!');
    fetchMembers();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const onMemberUpdated = () => {
    setShowEditModal(false);
    setSelectedMember(null);
    setSuccessMessage('Member updated successfully!');
    fetchMembers();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger'
    };
    return <Badge bg={statusMap[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const getMembershipBadge = (type) => {
    const typeMap = {
      standard: 'primary',
      premium: 'warning',
      student: 'info'
    };
    return <Badge bg={typeMap[type] || 'primary'}>{type.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <i className="bi bi-people me-2 text-primary"></i>
            Members Management
          </h2>
          <p className="text-muted">Manage library members and memberships</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="success" 
            onClick={handleAddMember}
            data-testid="add-member-button"
          >
            <i className="bi bi-person-plus me-2"></i>
            Add New Member
          </Button>
        </Col>
      </Row>

      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or member ID..."
                  value={search}
                  onChange={handleSearchChange}
                  data-testid="search-input"
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select 
                value={statusFilter} 
                onChange={handleStatusChange}
                data-testid="status-filter"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <Badge bg="secondary" className="fs-6 py-2 px-3">
                {pagination.total} Members
              </Badge>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-person-x fs-1 text-muted d-block mb-3"></i>
              <p className="text-muted">No members found</p>
              <Button variant="success" onClick={handleAddMember}>
                Add Your First Member
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" data-testid="members-table">
                <thead className="table-light">
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <code className="small">{member.member_id}</code>
                      </td>
                      <td><strong>{member.name}</strong></td>
                      <td>
                        <small>
                          <i className="bi bi-envelope me-1"></i>
                          {member.email}
                        </small>
                      </td>
                      <td>
                        <small>
                          <i className="bi bi-telephone me-1"></i>
                          {member.phone || 'N/A'}
                        </small>
                      </td>
                      <td>{getMembershipBadge(member.membership_type)}</td>
                      <td>{formatDate(member.membership_end)}</td>
                      <td>{getStatusBadge(member.status)}</td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditMember(member)}
                          data-testid={`edit-member-${member.id}`}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteMember(member)}
                          data-testid={`delete-member-${member.id}`}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {pagination.pages > 1 && (
          <Card.Footer className="bg-white border-top">
            <Row className="align-items-center">
              <Col>
                <small className="text-muted">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} members
                </small>
              </Col>
              <Col xs="auto">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="me-2"
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </Button>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>

      {/* Add Member Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddMember onSuccess={onMemberAdded} onCancel={() => setShowAddModal(false)} />
        </Modal.Body>
      </Modal>

      {/* Edit Member Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMember && (
            <EditMember 
              member={selectedMember} 
              onSuccess={onMemberUpdated} 
              onCancel={() => setShowEditModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deactivation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to deactivate this member?</p>
          {selectedMember && (
            <div className="alert alert-warning">
              <strong>{selectedMember.name}</strong>
              <br />
              <small>{selectedMember.email}</small>
            </div>
          )}
          <p className="text-muted small">The member status will be set to inactive.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="bi bi-person-x me-2"></i>
            Deactivate Member
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MembersList;