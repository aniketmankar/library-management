import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import BooksList from './components/books/BooksList';
import MembersList from './components/members/MembersList';
import AdminPage from './components/admin/AdminPage';
import LibrarianPage from './components/librarian/LibrarianPage';
import Navbar from './components/layout/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Route protection based on roles
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      return <Navigate to="/dashboard" />;
    }
    
    return children;
  };

  // Check if user has permission (for librarians)
  const hasPermission = (permission) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'librarian') {
      return user?.permissions?.includes(permission);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" /> : 
                <Register onRegister={handleLogin} />
            } 
          />

          {/* Protected Routes - All authenticated users */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard user={user} />
              </ProtectedRoute>
            } 
          />

          {/* Admin Only Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage user={user} />
              </ProtectedRoute>
            } 
          />

          {/* Librarian Only Routes */}
          <Route 
            path="/librarian" 
            element={
              <ProtectedRoute allowedRoles={['librarian']}>
                <LibrarianPage user={user} />
              </ProtectedRoute>
            } 
          />

          {/* Books Management - Admin or Librarian with manage_books permission */}
          <Route 
            path="/books" 
            element={
              <ProtectedRoute>
                {(user?.role === 'admin' || hasPermission('manage_books')) ? (
                  <BooksList user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </ProtectedRoute>
            } 
          />

          {/* Members Management - Admin or Librarian with manage_members permission */}
          <Route 
            path="/members" 
            element={
              <ProtectedRoute>
                {(user?.role === 'admin' || hasPermission('manage_members')) ? (
                  <MembersList user={user} />
                ) : (
                  <Navigate to="/dashboard" />
                )}
              </ProtectedRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;