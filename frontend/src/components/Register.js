import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.username.length < 2) {
      setError('Username must be at least 2 characters long');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await axios.post(`${API_URL}/auth/register`, registrationData);
      const { user, token } = response.data;
      
      onRegister(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
              <i className="bi bi-book fs-1 text-success"></i>
              <h2 className="mt-3 mb-2">Create Account</h2>
              <p className="text-muted">Join our library community</p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4" data-testid="register-error">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  disabled={loading}
                  data-testid="register-username"
                  className="form-control-lg"
                />
              </Form.Group>

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
                  data-testid="register-email"
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
                  placeholder="Create a password (min 6 characters)"
                  required
                  disabled={loading}
                  data-testid="register-password"
                  className="form-control-lg"
                />
                <Form.Text className="text-muted">
                  At least 6 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  data-testid="register-confirm-password"
                  className="form-control-lg"
                />
              </Form.Group>

              <Button 
                variant="success" 
                type="submit" 
                className="w-100 btn-lg fw-bold mb-3"
                disabled={loading}
                data-testid="register-button"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>
                    Register
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="fw-bold text-decoration-none" data-testid="login-link">
                    Sign in here
                  </Link>
                </p>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default Register;