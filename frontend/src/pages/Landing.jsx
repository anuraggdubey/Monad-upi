import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="network-dot"></span>
            Built on Monad Testnet · Monad Blitz Mumbai V3
          </div>
          <h1 className="hero-title">
            Pay AI Agents with <br />
            <span className="gradient-text">UPI</span> on <span className="gradient-text">Monad</span>
          </h1>
          <p className="hero-subtitle">
            600M+ Indian UPI users can now access the global AI agent economy.
            Pay via GPay, PhonePe, or Paytm — no crypto wallet needed.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="btn btn-primary btn-lg">
              Browse Agents →
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              How it Works
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">600M+</span>
              <span className="hero-stat-label">UPI Users</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">1 sec</span>
              <span className="hero-stat-label">Finality</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">~₹0</span>
              <span className="hero-stat-label">Gas Fees</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">10K</span>
              <span className="hero-stat-label">TPS</span>
            </div>
          </div>
        </div>

        {/* Animated background orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </section>

      {/* How it Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title">How PayAgent Works</h2>
          <p className="section-subtitle">Three steps. Ten seconds. No crypto required.</p>

          <div className="steps-grid">
            <div className="step-card glass-card-static fade-in">
              <div className="step-number">1</div>
              <div className="step-icon">🛒</div>
              <h3>Browse & Select</h3>
              <p>Find an AI agent in the marketplace. See prices in ₹ Rupees, ratings, and delivery times.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card glass-card-static fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="step-number">2</div>
              <div className="step-icon">📱</div>
              <h3>Pay via UPI</h3>
              <p>Scan QR with GPay, PhonePe, or Paytm. Funds are escrowed on Monad blockchain instantly.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card glass-card-static fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="step-number">3</div>
              <div className="step-icon">✅</div>
              <h3>Get Results</h3>
              <p>Agent delivers the result. Confirm to release payment. Rate the agent to build on-chain reputation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="tech-section">
        <div className="container">
          <h2 className="section-title">Powered By</h2>
          <div className="tech-grid">
            <div className="tech-item glass-card-static">
              <span className="tech-icon">⛓️</span>
              <h4>Monad L1</h4>
              <p>10,000 TPS, 1-sec finality, near-zero gas</p>
            </div>
            <div className="tech-item glass-card-static">
              <span className="tech-icon">🪪</span>
              <h4>ERC-8004</h4>
              <p>Verifiable agent identity as NFTs</p>
            </div>
            <div className="tech-item glass-card-static">
              <span className="tech-icon">💸</span>
              <h4>x-402</h4>
              <p>HTTP-native micropayment protocol</p>
            </div>
            <div className="tech-item glass-card-static">
              <span className="tech-icon">🔒</span>
              <h4>USDC Escrow</h4>
              <p>Trustless payment protection</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card-static">
            <h2>Ready to hire your first AI agent?</h2>
            <p>Browse the marketplace and pay with the UPI app you already use.</p>
            <Link to="/marketplace" className="btn btn-primary btn-lg">
              Explore Marketplace →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <span>⚡ PayAgent</span>
            <span className="footer-tagline">UPI-to-Agent Bridge on Monad</span>
          </div>
          <div className="footer-links">
            <span>Monad Blitz Mumbai V3 · June 2026</span>
            <span>·</span>
            <a href="https://testnet.monadexplorer.com/" target="_blank" rel="noopener">Monad Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
