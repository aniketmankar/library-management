import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Navbar, Nav, Table, Alert, Spinner } from 'react-bootstrap';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMembers: 0,
    booksIssued: 0,
    overdueBooks: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [statsResponse, activityResponse] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, config),
        axios.get(`${API_URL}/dashboard/activity`, config)
      ]);

      setStats(statsResponse.data);
      setActivities(activityResponse.data.activities);
    } catch (err) {
      setError('Failed to load dashboard data. Please try refreshing the page.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleQuickAction = (action) => {
    alert(`${action} - Coming in Phase 2!`);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top" className="navbar-custom">
        <Container fluid>
          <Navbar.Brand className="fw-bold">
            <i className="bi bi-book me-2"></i>
            Library Management System
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Navbar.Text className="me-3 text-white">
                <i className="bi bi-person-circle me-2"></i>
                Welcome, <strong>{user?.username || 'User'}</strong>
              </Navbar.Text>
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={handleLogout}
                data-testid="logout-button"
                className="d-flex align-items-center"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="dashboard-container py-4">
        {error && (
          <Alert variant="danger" className="mb-4" dismissible>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        <Row className="mb-5">
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card h-100 shadow-sm border-0" data-testid="stat-total-books">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon bg-primary text-white">
                  <i className="bi bi-book"></i>
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-1 small">Total Books</p>
                  <h3 className="mb-0 fw-bold">{stats.totalBooks}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card h-100 shadow-sm border-0" data-testid="stat-total-members">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon bg-success text-white">
                  <i className="bi bi-people"></i>
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-1 small">Total Members</p>
                  <h3 className="mb-0 fw-bold">{stats.totalMembers}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card h-100 shadow-sm border-0" data-testid="stat-books-issued">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon bg-info text-white">
                  <i className="bi bi-bookmark"></i>
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-1 small">Books Issued</p>
                  <h3 className="mb-0 fw-bold">{stats.booksIssued}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card h-100 shadow-sm border-0" data-testid="stat-overdue-books">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon bg-warning text-white">
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <div className="ms-3">
                  <p className="text-muted mb-1 small">Overdue Books</p>
                  <h3 className="mb-0 fw-bold">{stats.overdueBooks}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-lightning me-2 text-warning"></i>
                  Quick Actions
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-3">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => handleQuickAction('Add Book')}
                    data-testid="quick-add-book"
                    className="d-flex align-items-center justify-content-center fw-bold"
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Book
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => handleQuickAction('Add Member')}
                    data-testid="quick-add-member"
                    className="d-flex align-items-center justify-content-center fw-bold"
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Add Member
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={() => handleQuickAction('Issue Book')}
                    data-testid="quick-issue-book"
                    className="d-flex align-items-center justify-content-center fw-bold"
                  >
                    <i className="bi bi-arrow-right-circle me-2"></i>
                    Issue Book
                  </Button>
                </div>
                <div className="alert alert-info mt-4 small" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  These features are coming in Phase 2!
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} className="mb-4">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-bottom">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-clock-history me-2 text-primary"></i>
                  Recent Activity
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {activities.length > 0 ? (
                  <Table hover responsive className="mb-0" data-testid="recent-activity-table">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => (
                        <tr key={activity.id}>
                          <td className="text-muted small">
                            <i className="bi bi-calendar-event me-2"></i>
                            {activity.date}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {activity.activity}
                            </span>
                          </td>
                          <td>
                            <i className="bi bi-person me-1"></i>
                            {activity.user}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center p-4 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No activities yet
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Dashboard;