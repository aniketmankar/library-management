import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';
import AddBook from './AddBook';
import EditBook from './EditBook';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

function BooksList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [pagination.page, search, categoryFilter]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search,
          category: categoryFilter
        }
      });

      setBooks(response.data.books);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Fetch books error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/books/categories/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleAddBook = () => {
    setShowAddModal(true);
  };

  const handleEditBook = (book) => {
    setSelectedBook(book);
    setShowEditModal(true);
  };

  const handleDeleteBook = (book) => {
    setSelectedBook(book);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/books/${selectedBook.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Book deleted successfully!');
      setShowDeleteModal(false);
      setSelectedBook(null);
      fetchBooks();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete book');
    }
  };

  const onBookAdded = () => {
    setShowAddModal(false);
    setSuccessMessage('Book added successfully!');
    fetchBooks();
    fetchCategories();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const onBookUpdated = () => {
    setShowEditModal(false);
    setSelectedBook(null);
    setSuccessMessage('Book updated successfully!');
    fetchBooks();
    fetchCategories();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <i className="bi bi-book me-2 text-primary"></i>
            Books Management
          </h2>
          <p className="text-muted">Manage your library's book collection</p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={handleAddBook}
            data-testid="add-book-button"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New Book
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
                  placeholder="Search by title, author, or ISBN..."
                  value={search}
                  onChange={handleSearchChange}
                  data-testid="search-input"
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select 
                value={categoryFilter} 
                onChange={handleCategoryChange}
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <Badge bg="secondary" className="fs-6 py-2 px-3">
                {pagination.total} Books
              </Badge>
            </Col>
          </Row>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Loading books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
              <p className="text-muted">No books found</p>
              <Button variant="primary" onClick={handleAddBook}>
                Add Your First Book
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0" data-testid="books-table">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th className="text-center">Copies</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <strong>{book.title}</strong>
                        {book.publication_year && (
                          <small className="text-muted d-block">
                            ({book.publication_year})
                          </small>
                        )}
                      </td>
                      <td>{book.author}</td>
                      <td>
                        <code className="small">{book.isbn || 'N/A'}</code>
                      </td>
                      <td>
                        {book.category ? (
                          <Badge bg="info">{book.category}</Badge>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary">{book.total_copies}</Badge>
                      </td>
                      <td className="text-center">
                        <Badge bg={book.available_copies > 0 ? 'success' : 'danger'}>
                          {book.available_copies}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditBook(book)}
                          data-testid={`edit-book-${book.id}`}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteBook(book)}
                          data-testid={`delete-book-${book.id}`}
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
                  {pagination.total} books
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

      {/* Add Book Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AddBook onSuccess={onBookAdded} onCancel={() => setShowAddModal(false)} />
        </Modal.Body>
      </Modal>

      {/* Edit Book Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Book</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBook && (
            <EditBook 
              book={selectedBook} 
              onSuccess={onBookUpdated} 
              onCancel={() => setShowEditModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this book?</p>
          {selectedBook && (
            <div className="alert alert-warning">
              <strong>{selectedBook.title}</strong> by {selectedBook.author}
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
            Delete Book
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default BooksList;