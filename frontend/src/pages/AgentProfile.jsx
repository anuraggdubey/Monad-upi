import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAgent } from '../utils/api';
import PaymentModal from '../components/PaymentModal';
import { IconRenderer, IconStar, IconLink, IconClock, IconBot } from '../components/Icons';
import './AgentProfile.css';

export default function AgentProfile() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const data = await fetchAgent(id);
        if (data.success) {
          setAgent(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAgent();
  }, [id]);

  if (loading) return <div className="container mt-16"><div className="shimmer glass-card-static" style={{ height: '400px' }}></div></div>;
  if (!agent) return <div className="container mt-16">Agent not found</div>;

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <IconStar key={index} size={16} fill={index < Math.floor(rating) ? "currentColor" : "none"} className={index >= Math.floor(rating) ? "empty" : ""} />
    ));
  };

  const isExecuting = parseInt(agent.agentId) % 3 === 0;

  return (
    <div className="agent-profile container">
      <div className="profile-grid">
        
        {/* Main Engine Data */}
        <div className="engine-container">
          <div className="engine-header">
            <div className="engine-avatar">
              <IconRenderer name={agent.image} size={40} />
            </div>
            <div className="engine-title">
              <h1>{agent.name}</h1>
              <div className="engine-badges">
                <span className="badge-cat">{agent.category}</span>
                <span className="badge-status">
                  <span className="ticker-dot"></span>
                  {isExecuting ? 'EXECUTING TASK' : 'IDLE / READY'}
                </span>
              </div>
            </div>
          </div>

          <div className="engine-desc">
            {agent.description}
          </div>

          <div className="tech-section">
            <h3>Capabilities</h3>
            <div className="cap-grid">
              {agent.capabilities?.map((cap, i) => (
                <span key={i} className="cap-tag">{cap}</span>
              ))}
            </div>
          </div>

          <div className="tech-section">
            <h3>On-Chain Metrics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <label>Reputation</label>
                <span className="stars">
                  {renderStars(agent.reputationScore)}
                  <span style={{color: 'var(--paper)', marginLeft: '8px'}}>{agent.reputationScore}</span>
                </span>
              </div>
              <div className="stat-box">
                <label>Tasks Completed</label>
                <span>{agent.tasksCompleted}</span>
              </div>
              <div className="stat-box">
                <label>Avg Delivery</label>
                <span>{agent.deliveryTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Sidebar */}
        <div className="terminal-card">
          <div className="terminal-header">
            <IconLink size={16} /> SMART CONTRACT ESCROW
          </div>

          <div className="pricing-block">
            <span className="price-inr">₹{agent.priceINR}</span>
            <span className="price-usdc">≈ {agent.priceUSDC} USDC</span>
          </div>

          <div className="exec-details">
            <div className="exec-row">
              <span className="label">Endpoint</span>
              <span className="val" style={{color: '#666'}}>api.agent/execute</span>
            </div>
            <div className="exec-row">
              <span className="label">Escrow</span>
              <span className="val">Monad Testnet</span>
            </div>
            <div className="exec-row">
              <span className="label">SLA</span>
              <span className="val"><IconClock size={12} style={{display:'inline', verticalAlign:'middle', marginRight:'4px'}}/>{agent.deliveryTime}</span>
            </div>
          </div>

          <button className="btn-terminal" onClick={() => setShowPayment(true)}>
            Execute Agent
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal 
          agent={agent}
          onClose={() => setShowPayment(false)} 
          onPaymentComplete={(data) => {
            setShowPayment(false);
            window.location.href = `/orders/${data.orderId}`;
          }}
        />
      )}
    </div>
  );
}
