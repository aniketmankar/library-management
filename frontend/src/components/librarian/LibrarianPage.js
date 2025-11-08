import React from 'react';
import { Container, Row, Col, Card, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function LibrarianPage({ user }) {
  const navigate = useNavigate();
  const permissions = user?.permissions || [];

  const permissionCards = [
    {
      id: 'manage_books',
      title: 'Manage Books',
      icon: 'bi-book',
      color: 'primary',
      description: 'Add, edit, and delete books from the library',
      path: '/books'
    },
    {
      id: 'manage_members',
      title: 'Manage Members',
      icon: 'bi-people',
      color: 'success',
      description: 'Add, edit, and manage library members',
      path: '/members'
    },
    {
      id: 'issue_books',
      title: 'Issue Books',
      icon: 'bi-arrow-right-circle',
      color: 'info',
      description: 'Issue and return books to members',
      path: '/dashboard'
    },
    {
      id: 'view_reports',
      title: 'View Reports',
      icon: 'bi-graph-up',
      color: 'warning',
      description: 'View library reports and statistics',
      path: '/dashboard'
    }
  ];

  const handleNavigate = (permission, path) => {
    if (permissions.includes(permission)) {
      navigate(path);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">
            <i className="bi bi-person-badge me-2 text-primary"></i>
            Librarian Dashboard
          </h2>
          <p className="text-muted">Welcome, {user?.username}</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Your Permissions:</strong> You have access to the following features based on your assigned permissions.
          </Alert>
        </Col>
      </Row>

      {permissions.length === 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              You don't have any permissions assigned yet. Please contact the administrator.
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        {permissionCards.map((card) => {
          const hasPermission = permissions.includes(card.id);
          
          return (
            <Col key={card.id} lg={3} md={6} className="mb-4">
              <Card 
                className={`h-100 shadow-sm border-0 ${hasPermission ? 'cursor-pointer' : 'opacity-50'}`}
                style={{ 
                  cursor: hasPermission ? 'pointer' : 'not-allowed',
                  transition: 'transform 0.2s',
                  transform: hasPermission ? 'scale(1)' : 'scale(0.98)'
                }}
                onClick={() => handleNavigate(card.id, card.path)}
                onMouseEnter={(e) => hasPermission && (e.currentTarget.style.transform = 'translateY(-5px)')}
                onMouseLeave={(e) => hasPermission && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Card.Body className="text-center p-4">
                  <div 
                    className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-3`}
                    style={{ 
                      width: '80px', 
                      height: '80px',
                      background: hasPermission 
                        ? `linear-gradient(135deg, var(--bs-${card.color}) 0%, var(--bs-${card.color}) 100%)` 
                        : '#e0e0e0'
                    }}
                  >
                    <i className={`${card.icon} fs-1 text-white`}></i>
                  </div>
                  
                  <h5 className="mb-2">{card.title}</h5>
                  <p className="text-muted small mb-3">{card.description}</p>
                  
                  {hasPermission ? (
                    <Badge bg={card.color} className="px-3 py-2">
                      <i className="bi bi-check-circle me-1"></i>
                      Enabled
                    </Badge>
                  ) : (
                    <Badge bg="secondary" className="px-3 py-2">
                      <i className="bi bi-lock me-1"></i>
                      No Access
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                About Your Role
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="mb-2">
                <strong>Role:</strong> <Badge bg="primary">Librarian</Badge>
              </p>
              <p className="mb-2">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="mb-0">
                <strong>Active Permissions:</strong> 
                {permissions.length > 0 ? (
                  <span className="ms-2">
                    {permissions.map((perm, idx) => (
                      <Badge key={idx} bg="info" className="me-1">
                        {perm.replace('_', ' ')}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  <span className="text-muted ms-2">No permissions assigned</span>
                )}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LibrarianPage;