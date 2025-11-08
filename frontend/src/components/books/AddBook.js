import React, { useState } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function AddBook({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    total_copies: 1,
    publication_year: '',
    publisher: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/books`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter book title"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Author <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              placeholder="Enter author name"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>ISBN</Form.Label>
            <Form.Control
              type="text"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              placeholder="978-0-123456-78-9"
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Control
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Fiction, Science, History"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Total Copies</Form.Label>
            <Form.Control
              type="number"
              name="total_copies"
              value={formData.total_copies}
              onChange={handleChange}
              min="1"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Publication Year</Form.Label>
            <Form.Control
              type="number"
              name="publication_year"
              value={formData.publication_year}
              onChange={handleChange}
              min="1000"
              max={new Date().getFullYear() + 1}
              placeholder={new Date().getFullYear()}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Publisher</Form.Label>
            <Form.Control
              type="text"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder="Publisher name"
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the book"
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Adding...
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle me-2"></i>
              Add Book
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}

export default AddBook;