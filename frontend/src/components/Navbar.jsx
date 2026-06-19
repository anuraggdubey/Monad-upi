import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">
            Pay<span className="gradient-text">Agent</span>
          </span>
        </Link>

        <div className="navbar-links">
          <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}>
            Marketplace
          </Link>
          <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>
            My Orders
          </Link>
        </div>

        <div className="navbar-actions">
          <div className="network-badge">
            <span className="network-dot"></span>
            Monad Testnet
          </div>
        </div>
      </div>
    </nav>
  );
}
