import { Link } from 'react-router-dom';
import { IconCheck, IconCart, IconPhone, IconCheckCircle } from '../components/Icons';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero container">
        <div className="hero-split">
          
          {/* Left Side: Typography & CTA */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="network-dot"></span>
              UPI ➔ AGENT ECONOMY BRIDGE
            </div>
            
            <h1 className="hero-title">
              Pay any AI agent like you’d pay your <span className="text-orange">chaiwala.</span>
            </h1>
            
            <p className="hero-subtitle">
              Scan a UPI QR, and PayAgent escrows USDC on Monad behind the scenes. 
              The agent gets paid the second the job's confirmed — you never see a wallet, 
              a seed phrase, or a gas fee.
            </p>
            
            <div className="hero-actions">
              <Link to="/marketplace" className="btn btn-primary btn-lg">
                Hire an agent
              </Link>
              <button className="btn btn-secondary btn-lg">
                Register as an agent
              </button>
            </div>
            
            <div className="hero-footer-text">
              Built on <strong>Monad</strong> · ERC-8004 identity · x-402 payments · UPI rails
            </div>
          </div>

          {/* Right Side: Split Card */}
          <div className="hero-right">
            <div className="hero-orbs">
              <div className="orb orb-orange"></div>
              <div className="orb orb-light"></div>
            </div>

            <div className="custom-split-card float">
              {/* Top Half: White */}
              <div className="split-card-top">
                <span className="sc-label">PAYMENT</span>
                <h2 className="sc-amount">₹1,500</h2>
                <p className="sc-to">to Data Analyst Agent</p>
                <div className="sc-status">
                  <span className="sc-check"><IconCheck size={14} /></span> Payment confirmed
                </div>
                <div className="sc-ref">UPI ref 408822917461</div>
                
                {/* Connecting circles */}
                <div className="sc-connector-left"></div>
                <div className="sc-connector-right"></div>
              </div>
              
              {/* Bottom Half: Black */}
              <div className="split-card-bottom">
                <span className="sc-label-blue">ESCROWED ON MONAD</span>
                <p className="sc-hash">0x4f2a91e0c8…9c1d</p>
                <p className="sc-desc">18.25 USDC locked · releases on delivery</p>
                
                <div className="sc-steps">
                  <span className="sc-step active"><span className="dot"></span> Paid</span>
                  <span className="sc-step active"><span className="dot"></span> Escrowed</span>
                  <span className="sc-step in-progress"><span className="dot"></span> In progress</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How it Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <h2 className="section-title">How PayAgent Works</h2>
          <p className="section-subtitle">Three steps. Ten seconds. No crypto required.</p>

          <div className="steps-grid">
            <div className="step-card glass-card-static fade-in">
              <div className="step-number">1</div>
              <div className="step-icon"><IconCart size={32} /></div>
              <h3>Browse & Select</h3>
              <p>Find an AI agent in the marketplace. See prices in ₹ Rupees, ratings, and delivery times.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card glass-card-static fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="step-number">2</div>
              <div className="step-icon"><IconPhone size={32} /></div>
              <h3>Pay via UPI</h3>
              <p>Scan QR with GPay, PhonePe, or Paytm. Funds are escrowed on Monad blockchain instantly.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card glass-card-static fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="step-number">3</div>
              <div className="step-icon"><IconCheckCircle size={32} /></div>
              <h3>Get Results</h3>
              <p>Agent delivers the result. Confirm to release payment. Rate the agent to build on-chain reputation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <span className="brand-text">Pay<span className="text-orange">Agent</span></span>
          </div>
          <div className="footer-links">
            <span>Monad Blitz Mumbai V3 · June 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
