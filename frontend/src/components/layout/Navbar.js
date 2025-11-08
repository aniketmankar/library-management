import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';

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

  // Check if user has permission
  const hasPermission = (permission) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'librarian') {
      return user?.permissions?.includes(permission);
    }
    return false;
  };

  // Get role badge color
  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'danger',
      librarian: 'primary',
      member: 'info'
    };
    return { color: roleColors[role] || 'secondary', label: role };
  };

  const roleBadge = getRoleBadge(user?.role);

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
            {/* Dashboard - Available to all */}
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActive('/dashboard')}
            >
              <i className="bi bi-speedometer2 me-1"></i>
              Dashboard
            </Nav.Link>

            {/* Admin Panel - Only for Admins */}
            {user?.role === 'admin' && (
              <Nav.Link 
                as={Link} 
                to="/admin" 
                className={isActive('/admin')}
              >
                <i className="bi bi-shield-lock me-1"></i>
                Admin
              </Nav.Link>
            )}

            {/* Librarian Panel - Only for Librarians */}
            {user?.role === 'librarian' && (
              <Nav.Link 
                as={Link} 
                to="/librarian" 
                className={isActive('/librarian')}
              >
                <i className="bi bi-person-badge me-1"></i>
                Librarian
              </Nav.Link>
            )}

            {/* Books - Admin or Librarian with manage_books */}
            {(user?.role === 'admin' || hasPermission('manage_books')) && (
              <Nav.Link 
                as={Link} 
                to="/books" 
                className={isActive('/books')}
              >
                <i className="bi bi-book me-1"></i>
                Books
              </Nav.Link>
            )}
            
            {/* Members - Admin or Librarian with manage_members */}
            {(user?.role === 'admin' || hasPermission('manage_members')) && (
              <Nav.Link 
                as={Link} 
                to="/members" 
                className={isActive('/members')}
              >
                <i className="bi bi-people me-1"></i>
                Members
              </Nav.Link>
            )}
          </Nav>

          <Nav>
            <NavDropdown 
              title={
                <>
                  <i className="bi bi-person-circle me-2"></i>
                  {user?.username || 'User'}
                  <Badge bg={roleBadge.color} className="ms-2">
                    {roleBadge.label}
                  </Badge>
                </>
              } 
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item disabled>
                <small className="text-muted">
                  {user?.email}
                  <br />
                  Role: <span className={`badge bg-${roleBadge.color}`}>{user?.role}</span>
                  {user?.role === 'librarian' && user?.permissions?.length > 0 && (
                    <>
                      <br />
                      <span className="text-muted">Permissions: {user.permissions.length}</span>
                    </>
                  )}
                </small>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              
              {/* Show permissions for librarians */}
              {user?.role === 'librarian' && user?.permissions?.length > 0 && (
                <>
                  <NavDropdown.Header>Your Permissions</NavDropdown.Header>
                  {user.permissions.map((perm, idx) => (
                    <NavDropdown.Item key={idx} disabled>
                      <small>
                        <i className="bi bi-check-circle text-success me-2"></i>
                        {perm.replace('_', ' ')}
                      </small>
                    </NavDropdown.Item>
                  ))}
                  <NavDropdown.Divider />
                </>
              )}
              
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