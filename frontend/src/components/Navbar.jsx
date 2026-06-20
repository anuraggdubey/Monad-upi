import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="navbar-wrapper">
      <nav className="navbar container">
        <div className="navbar-inner glass-card">
          <Link to="/" className="navbar-brand">
            <span className="brand-text">
              Pay<span className="gradient-text">Agent</span>
            </span>
          </Link>

          <div className="navbar-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}>
              Marketplace
            </Link>
            <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
              Orders
            </Link>
            <span className="nav-link network-badge-small hide-mobile">
              <span className="network-dot"></span> Testnet
            </span>
          </div>

          <div className="navbar-actions">
            <button className="btn btn-secondary btn-sm login-btn">Login / Register</button>
          </div>
        </div>
      </nav>
    </div>
  );
}
