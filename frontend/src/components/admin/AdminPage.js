import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function AdminPage() {
  const [librarians, setLibrarians] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLibrarian, setSelectedLibrarian] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    permissions: []
  });

  useEffect(() => {
    fetchLibrarians();
    fetchPermissions();
  }, []);

  const fetchLibrarians = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/librarians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLibrarians(response.data.librarians);
      setError('');
    } catch (err) {
      setError('Failed to load librarians. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/librarians/permissions/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data.permissions);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const handleAddLibrarian = () => {
    setFormData({ username: '', email: '', password: '', permissions: [] });
    setShowAddModal(true);
  };

  const handleEditLibrarian = (librarian) => {
    setSelectedLibrarian(librarian);
    setFormData({
      username: librarian.username,
      email: librarian.email,
      password: '',
      permissions: librarian.permissions || []
    });
    setShowEditModal(true);
  };

  const handleDeleteLibrarian = (librarian) => {
    setSelectedLibrarian(librarian);
    setShowDeleteModal(true);
  };

  const handlePermissionChange = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/librarians`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Librarian added successfully!');
      setShowAddModal(false);
      fetchLibrarians();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add librarian');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = {
        username: formData.username,
        email: formData.email,
        permissions: formData.permissions
      };
      
      await axios.put(`${API_URL}/librarians/${selectedLibrarian.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Librarian updated successfully!');
      setShowEditModal(false);
      setSelectedLibrarian(null);
      fetchLibrarians();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update librarian');
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/librarians/${selectedLibrarian.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessMessage('Librarian removed successfully!');
      setShowDeleteModal(false);
      setSelectedLibrarian(null);
      fetchLibrarians();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete librarian');
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <i className="bi bi-shield-lock me-2 text-danger"></i>
            Admin Panel
          </h2>
          <p className="text-muted">Manage librarians and their permissions</p>
        </Col>
        <Col xs="auto">
          <Button variant="danger" onClick={handleAddLibrarian}>
            <i className="bi bi-person-plus me-2"></i>
            Add Librarian
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
          <h5 className="mb-0">
            <i className="bi bi-people me-2"></i>
            Librarians ({librarians.length})
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Loading librarians...</p>
            </div>
          ) : librarians.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-person-x fs-1 text-muted d-block mb-3"></i>
              <p className="text-muted">No librarians yet</p>
              <Button variant="danger" onClick={handleAddLibrarian}>
                Add Your First Librarian
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Permissions</th>
                    <th>Added On</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {librarians.map((librarian) => (
                    <tr key={librarian.id}>
                      <td><strong>{librarian.username}</strong></td>
                      <td>
                        <small>
                          <i className="bi bi-envelope me-1"></i>
                          {librarian.email}
                        </small>
                      </td>
                      <td>
                        {librarian.permissions.length > 0 ? (
                          librarian.permissions.map((perm, idx) => (
                            <Badge key={idx} bg="info" className="me-1">
                              {perm.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted">No permissions</span>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(librarian.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditLibrarian(librarian)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteLibrarian(librarian)}
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
      </Card>

      {/* Add Librarian Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Librarian</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitAdd}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Enter username"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="librarian@library.com"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength="6"
                placeholder="Minimum 6 characters"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              <div className="border rounded p-3 bg-light">
                {permissions.map((perm) => (
                  <Form.Check
                    key={perm.id}
                    type="checkbox"
                    id={`add-${perm.id}`}
                    label={
                      <div>
                        <strong>{perm.name}</strong>
                        <br />
                        <small className="text-muted">{perm.description}</small>
                      </div>
                    }
                    checked={formData.permissions.includes(perm.id)}
                    onChange={() => handlePermissionChange(perm.id)}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit">
              <i className="bi bi-person-plus me-2"></i>
              Add Librarian
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Librarian Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Librarian</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitEdit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Permissions</Form.Label>
              <div className="border rounded p-3 bg-light">
                {permissions.map((perm) => (
                  <Form.Check
                    key={perm.id}
                    type="checkbox"
                    id={`edit-${perm.id}`}
                    label={
                      <div>
                        <strong>{perm.name}</strong>
                        <br />
                        <small className="text-muted">{perm.description}</small>
                      </div>
                    }
                    checked={formData.permissions.includes(perm.id)}
                    onChange={() => handlePermissionChange(perm.id)}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check-circle me-2"></i>
              Update Librarian
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to remove this librarian?</p>
          {selectedLibrarian && (
            <div className="alert alert-warning">
              <strong>{selectedLibrarian.username}</strong>
              <br />
              <small>{selectedLibrarian.email}</small>
            </div>
          )}
          <p className="text-muted small">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="bi bi-trash me-2"></i>
            Delete Librarian
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminPage;