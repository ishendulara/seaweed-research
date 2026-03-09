// frontend/src/components/Navbar.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LEFT: brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon">🌊</div>
          <div>
            <div className="navbar-logo-text">Seaweed System</div>
            <div className="navbar-logo-sub">
              Smart Seaweed Hub
            </div>
          </div>
        </Link>

        {/* RIGHT: menu */}
        <ul className="navbar-menu">
          {!isAuthenticated ? (
            <>
              <li className="navbar-item">
                <Link to="/login" className="navbar-link">
                  Login
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/register" className="navbar-auth-btn">
                  Register
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="navbar-item">
                <Link to="/dashboard" className="navbar-link">
                  Dashboard
                </Link>
              </li>

              {user?.role === 'farmer' && (
                <>
                  {/* <li className="navbar-item">
                    <Link to="/my-records" className="navbar-link">
                      My Records
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/add-record" className="navbar-link">
                      Add Record
                    </Link>
                  </li> */}
                  {/* <li className="navbar-item">
                    <Link to="/my-records" className="navbar-link">
                      Seaweed Identify
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/add-record" className="navbar-link">
                      IoT Monitoring
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/my-records" className="navbar-link">
                      Growth Harvest
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/add-record" className="navbar-link">
                      Prescription Engine
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link to="/my-records" className="navbar-link">
                      Food Recipes
                    </Link>
                  </li> */}
                </>
              )}

              {user?.role === 'admin' && (
                <li className="navbar-item">
                  <Link to="/admin/records" className="navbar-link">
                    All Records
                  </Link>
                </li>
              )}

              <li className="navbar-item">
                <Link to="/profile" className="navbar-link">👤 Profile</Link>
              </li>

              <li className="navbar-item">
                <button
                  onClick={handleLogout}
                  className="navbar-logout"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
