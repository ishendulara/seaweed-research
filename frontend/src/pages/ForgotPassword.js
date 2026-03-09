// frontend/src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        toast.success('Password reset email sent! Please check your inbox.');
      } else {
        toast.error(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-message">
            <h2 className="auth-title">📧 Email Sent!</h2>
            <p className="auth-subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            
            <div className="email-instructions">
              <p>Please check your email and click the reset link to continue.</p>
              <p className="note">
                💡 <strong>Note:</strong> The link will expire in 1 hour.
              </p>
              <p className="note">
                If you don't see the email, check your spam folder.
              </p>
            </div>

            <div className="action-buttons">
              <button 
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="auth-button secondary"
              >
                Try Another Email
              </button>
              <Link to="/login" className="auth-button">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Forgot Password?</h2>
        <p className="auth-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;