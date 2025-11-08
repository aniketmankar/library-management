import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card, Navbar, Nav, Button } from 'react-bootstrap';
import './MainLayout.css';

function MainLayout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="main-layout">
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
                className="d-flex align-items-center"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          <Col lg={2} md={3} className="sidebar-col p-0">
            <div className="sidebar bg-light border-end">
              <Nav className="flex-column pt-3">
                <Nav.Link 
                  onClick={() => navigate('/dashboard')} 
                  className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </Nav.Link>
                <Nav.Link 
                  onClick={() => navigate('/books')} 
                  className={`sidebar-link ${isActive('/books') ? 'active' : ''}`}
                >
                  <i className="bi bi-book me-2"></i>
                  Books
                </Nav.Link>
                <Nav.Link 
                  onClick={() => navigate('/members')} 
                  className={`sidebar-link ${isActive('/members') ? 'active' : ''}`}
                >
                  <i className="bi bi-people me-2"></i>
                  Members
                </Nav.Link>
                <div className="sidebar-divider"></div>
                <div className="px-3 py-2">
                  <small className="text-muted">Coming Soon</small>
                </div>
                <Nav.Link className="sidebar-link disabled">
                  <i className="bi bi-arrow-left-right me-2"></i>
                  Transactions
                </Nav.Link>
                <Nav.Link className="sidebar-link disabled">
                  <i className="bi bi-graph-up me-2"></i>
                  Reports
                </Nav.Link>
                <Nav.Link className="sidebar-link disabled">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </Nav.Link>
              </Nav>
            </div>
          </Col>
          <Col lg={10} md={9} className="content-col p-0">
            <div className="main-content">
              {children}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default MainLayout;