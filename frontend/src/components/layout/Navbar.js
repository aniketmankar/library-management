import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';

function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <BSNavbar bg="primary" variant="dark" expand="lg" sticky="top" className="shadow-sm">
      <Container fluid>
        <BSNavbar.Brand as={Link} to="/dashboard" className="fw-bold">
          <i className="bi bi-book me-2"></i>
          Library Management System
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActive('/dashboard')}
            >
              <i className="bi bi-speedometer2 me-1"></i>
              Dashboard
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/books" 
              className={isActive('/books')}
            >
              <i className="bi bi-book me-1"></i>
              Books
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/members" 
              className={isActive('/members')}
            >
              <i className="bi bi-people me-1"></i>
              Members
            </Nav.Link>
          </Nav>

          <Nav>
            <NavDropdown 
              title={
                <>
                  <i className="bi bi-person-circle me-2"></i>
                  {user?.username || 'User'}
                </>
              } 
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item disabled>
                <small className="text-muted">
                  {user?.email}
                  <br />
                  Role: <span className="badge bg-secondary">{user?.role}</span>
                </small>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;