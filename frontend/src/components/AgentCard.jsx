import { useNavigate } from 'react-router-dom';
import { IconStar, IconRenderer } from './Icons';
import './AgentCard.css';

export default function AgentCard({ agent }) {
  const navigate = useNavigate();

  const renderStars = (score) => {
    const full = Math.floor(score);
    const hasHalf = score - full >= 0.5;
    return (
      <span className="stars">
        {[...Array(5)].map((_, i) => {
          const isFilled = i < full || (i === full && hasHalf);
          return (
            <span key={i} className={isFilled ? '' : 'empty'}>
              <IconStar size={12} fill={isFilled ? "currentColor" : "none"} />
            </span>
          );
        })}
      </span>
    );
  };

  // Simulate a live status based on agent ID or just randomly for effect, but keeping it tied to state.
  // In a real app this would be driven by websocket. Let's make ~30% of them "executing".
  const isExecuting = parseInt(agent.agentId) % 3 === 0;

  return (
    <div className="agent-card" onClick={() => navigate(`/agent/${agent.agentId}`)}>
      {/* Identity Half */}
      <div className="agent-card-identity">
        <div className="agent-card-header">
          <div className="agent-avatar"><IconRenderer name={agent.image} size={28} /></div>
          <div className="agent-meta">
            <h3 className="agent-name">{agent.name}</h3>
            <span className="agent-category-badge">{agent.category}</span>
          </div>
        </div>

        <p className="agent-description">{agent.description}</p>

        <div className="agent-capabilities">
          {agent.capabilities?.slice(0, 3).map((cap, i) => (
            <span key={i} className="capability-tag">{cap}</span>
          ))}
        </div>
      </div>

      {/* Perforation */}
      <div className="agent-card-perforation"></div>

      {/* Ledger Half */}
      <div className="agent-card-ledger">
        <div className="ledger-stats">
          <div className="ledger-stat">
            <span className="ledger-label">Reputation</span>
            <span className="ledger-value">
              {renderStars(agent.reputationScore)}
              <span style={{marginLeft: '4px'}}>{agent.reputationScore}</span>
            </span>
          </div>
          <div className="ledger-stat">
            <span className="ledger-label">Tasks</span>
            <span className="ledger-value">{agent.tasksCompleted}</span>
          </div>
          <div className="ledger-stat">
            <span className="ledger-label">Response</span>
            <span className="ledger-value">{agent.deliveryTime}</span>
          </div>
        </div>

        <div className="ledger-footer">
          <div className="ledger-price">
            <span className="inr">₹{agent.priceINR}</span>
            <span className="usdc">{agent.priceUSDC} USDC</span>
          </div>
          
          <div className="live-status">
            {isExecuting ? (
              <>
                <span className="status-dot executing"></span>
                executing
              </>
            ) : (
              <>
                <span className="status-dot idle"></span>
                idle
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
