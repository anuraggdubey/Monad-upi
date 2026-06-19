import { useNavigate } from 'react-router-dom';
import './AgentCard.css';

export default function AgentCard({ agent }) {
  const navigate = useNavigate();

  const renderStars = (score) => {
    const full = Math.floor(score);
    const hasHalf = score - full >= 0.5;
    return (
      <span className="stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < full ? '' : i === full && hasHalf ? '' : 'empty'}>
            {i < full ? '★' : i === full && hasHalf ? '★' : '☆'}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="agent-card glass-card" onClick={() => navigate(`/agent/${agent.agentId}`)}>
      <div className="agent-card-header">
        <div className="agent-avatar">{agent.image}</div>
        <div className="agent-meta">
          <h3 className="agent-name">{agent.name}</h3>
          <span className="badge badge-accent">{agent.category}</span>
        </div>
      </div>

      <p className="agent-description">{agent.description}</p>

      <div className="agent-capabilities">
        {agent.capabilities?.slice(0, 3).map((cap, i) => (
          <span key={i} className="capability-tag">{cap}</span>
        ))}
      </div>

      <div className="agent-stats">
        <div className="stat">
          <span className="stat-label">Rating</span>
          <span className="stat-value">
            {renderStars(agent.reputationScore)}
            <span className="rating-num">{agent.reputationScore}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Tasks Done</span>
          <span className="stat-value">{agent.tasksCompleted}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Delivery</span>
          <span className="stat-value">{agent.deliveryTime}</span>
        </div>
      </div>

      <div className="agent-card-footer">
        <div className="agent-price">
          <span className="price-inr">₹{agent.priceINR}</span>
          <span className="price-usdc">{agent.priceUSDC} USDC</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={(e) => {
          e.stopPropagation();
          navigate(`/agent/${agent.agentId}`);
        }}>
          Hire Now →
        </button>
      </div>
    </div>
  );
}
