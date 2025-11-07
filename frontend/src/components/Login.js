import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      const { user, token } = response.data;
      
      onLogin(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="auth-container">
      <div className="auth-wrapper">
        <Card className="auth-card shadow-lg">
          <Card.Body className="p-5">
            <div className="text-center mb-5">
              <i className="bi bi-book fs-1 text-primary"></i>
              <h2 className="mt-3 mb-2">Library Management</h2>
              <p className="text-muted">Sign in to your account</p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4" data-testid="login-error">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  data-testid="login-email"
                  className="form-control-lg"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  data-testid="login-password"
                  className="form-control-lg"
                />
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100 btn-lg fw-bold mb-3"
                disabled={loading}
                data-testid="login-button"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-center mb-4">
                <p className="mb-0">
                  Don't have an account?{' '}
                  <Link to="/register" className="fw-bold text-decoration-none" data-testid="register-link">
                    Create one here
                  </Link>
                </p>
              </div>

              <hr className="my-4" />
              
              <div className="alert alert-info" role="alert">
                <h6 className="alert-heading mb-2">
                  <i className="bi bi-info-circle me-2"></i>Demo Credentials
                </h6>
                <small>
                  <strong>Email:</strong> admin@library.com<br />
                  <strong>Password:</strong> admin123
                </small>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default Login;