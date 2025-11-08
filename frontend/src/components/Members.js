import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Row, Col, Card, Button, Table, Modal, Form, 
  Alert, Spinner, Badge, InputGroup, Pagination 
} from 'react-bootstrap';
import './Members.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMembershipType, setFilterMembershipType] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [renewMonths, setRenewMonths] = useState(12);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    membership_type: 'standard',
    status: 'active'
  });

  useEffect(() => {
    fetchMembers();
  }, [pagination.page, searchTerm, filterStatus, filterMembershipType]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          status: filterStatus,
          membership_type: filterMembershipType
        }
      };

      const response = await axios.get(`${API_URL}/members`, config);
      setMembers(response.data.members);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (member = null) => {
    if (member) {
      setEditMode(true);
      setCurrentMember(member);
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        address: member.address || '',
        membership_type: member.membership_type,
        status: member.status
      });
    } else {
      setEditMode(false);
      setCurrentMember(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        membership_type: 'standard',
        status: 'active'
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentMember(null);
    setError('');
    setSuccess('');
  };

  const handleShowRenewModal = (member) => {
    setCurrentMember(member);
    setRenewMonths(12);
    setShowRenewModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseRenewModal = () => {
    setShowRenewModal(false);
    setCurrentMember(null);
    setRenewMonths(12);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode) {
        await axios.put(`${API_URL}/members/${currentMember.id}`, formData, config);
        setSuccess('Member updated successfully');
      } else {
        await axios.post(`${API_URL}/members`, formData, config);
        setSuccess('Member added successfully');
      }

      setTimeout(() => {
        handleCloseModal();
        fetchMembers();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save member');
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${API_URL}/members/${currentMember.id}/renew`, 
        { months: renewMonths }, 
        config
      );
      setSuccess(`Membership renewed for ${renewMonths} months`);
      setTimeout(() => {
        handleCloseRenewModal();
        fetchMembers();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to renew membership');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to deactivate this member?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/members/${memberId}`, config);
      setSuccess('Member deactivated successfully');
      fetchMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate member');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger'
    };
    return badges[status] || 'secondary';
  };

  const getMembershipBadge = (type) => {
    const badges = {
      standard: 'primary',
      premium: 'warning',
      student: 'info'
    };
    return badges[type] || 'primary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (endDate) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30 && daysLeft > 0;
  };

  return (
    <Container fluid className="members-container py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-bold mb-0">
              <i className="bi bi-people me-2 text-success"></i>
              Members Management
            </h2>
            <Button variant="success" onClick={() => handleShowModal()}>
              <i className="bi bi-person-plus me-2"></i>
              Add New Member
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          <i className="bi bi-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or member ID..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filterMembershipType} 
                onChange={(e) => {
                  setFilterMembershipType(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">All Membership Types</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="student">Student</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" onClick={fetchMembers} className="w-100">
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="success" />
          <p className="text-muted mt-3">Loading members...</p>
        </div>
      ) : (
        <>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Membership End</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length > 0 ? (
                    members.map(member => (
                      <tr key={member.id}>
                        <td>
                          <code className="fw-semibold">{member.member_id}</code>
                        </td>
                        <td className="fw-semibold">{member.name}</td>
                        <td>
                          <i className="bi bi-envelope me-1"></i>
                          {member.email}
                        </td>
                        <td>
                          {member.phone ? (
                            <>
                              <i className="bi bi-telephone me-1"></i>
                              {member.phone}
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td>
                          <Badge bg={getMembershipBadge(member.membership_type)}>
                            {member.membership_type}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getStatusBadge(member.status)}>
                            {member.status}
                          </Badge>
                        </td>
                        <td>
                          {formatDate(member.membership_end)}
                          {isExpiringSoon(member.membership_end) && (
                            <span className="ms-2">
                              <i className="bi bi-exclamation-circle text-warning" 
                                 title="Expiring soon"></i>
                            </span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowRenewModal(member)}
                            title="Renew Membership"
                          >
                            <i className="bi bi-arrow-clockwise"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(member)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                        No members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={pagination.page === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(pagination.page - 1)} 
                  disabled={pagination.page === 1}
                />
                {[...Array(pagination.pages)].map((_, i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={i + 1 === pagination.page}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next 
                  onClick={() => handlePageChange(pagination.page + 1)} 
                  disabled={pagination.page === pagination.pages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(pagination.pages)} 
                  disabled={pagination.page === pagination.pages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Member Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi ${editMode ? 'bi-pencil' : 'bi-person-plus'} me-2`}></i>
            {editMode ? 'Edit Member' : 'Add New Member'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <i className="bi bi-check-circle me-2"></i>
                {success}
              </Alert>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter member name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="member@example.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Membership Type *</Form.Label>
                  <Form.Select
                    name="membership_type"
                    value={formData.membership_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="standard">Standard (1 Year)</option>
                    <option value="premium">Premium (2 Years)</option>
                    <option value="student">Student (1 Year)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {editMode && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status *</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter member address"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              <i className={`bi ${editMode ? 'bi-check-circle' : 'bi-person-plus'} me-2`}></i>
              {editMode ? 'Update Member' : 'Add Member'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Renew Membership Modal */}
      <Modal show={showRenewModal} onHide={handleCloseRenewModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-arrow-clockwise me-2"></i>
            Renew Membership
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRenewSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <i className="bi bi-check-circle me-2"></i>
                {success}
              </Alert>
            )}

            {currentMember && (
              <div className="mb-3">
                <p className="mb-2">
                  <strong>Member:</strong> {currentMember.name}
                </p>
                <p className="mb-2">
                  <strong>Current Expiry:</strong> {formatDate(currentMember.membership_end)}
                </p>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Renewal Period (Months) *</Form.Label>
              <Form.Control
                type="number"
                value={renewMonths}
                onChange={(e) => setRenewMonths(e.target.value)}
                min="1"
                max="24"
                required
              />
              <Form.Text className="text-muted">
                Enter number of months to extend (1-24)
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseRenewModal}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              <i className="bi bi-check-circle me-2"></i>
              Renew Membership
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Members;