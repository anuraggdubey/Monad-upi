import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAgent, createOrder } from '../utils/api';
import PaymentModal from '../components/PaymentModal';
import './AgentProfile.css';

export default function AgentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskDescription, setTaskDescription] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAgent();
  }, [id]);

  const loadAgent = async () => {
    try {
      const data = await fetchAgent(id);
      if (data.success) {
        setAgent(data.data);
        // Pre-fill task description based on category
        if (data.data.category === 'Data Analysis') {
          setTaskDescription('Analyze the current market sentiment for Ethereum (ETH) based on Twitter and Reddit data from the last 24 hours. Provide a bullish/bearish score and key insights.');
        } else if (data.data.category === 'Translation') {
          setTaskDescription('Translate the following text to Spanish: "The AI agent economy represents a fundamental shift in how we interact with blockchain networks."');
        } else if (data.data.category === 'Code Review') {
          setTaskDescription('Review the following React component for performance and security issues: [paste code here]');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async () => {
    if (!taskDescription.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await createOrder({
        agentId: agent.agentId,
        taskDescription,
      });
      
      if (res.success) {
        setOrderData(res.data);
        setShowPayment(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create order. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    navigate(`/order/${orderData.orderId}`);
  };

  if (loading) return <div className="container mt-16"><div className="shimmer glass-card-static" style={{ height: '400px' }}></div></div>;
  if (!agent) return <div className="container mt-16">Agent not found</div>;

  return (
    <div className="agent-profile container">
      {/* Header */}
      <div className="profile-header glass-card-static">
        <div className="profile-avatar">{agent.image}</div>
        <div className="profile-info">
          <div className="profile-title-row">
            <h1>{agent.name}</h1>
            <span className="badge badge-accent">{agent.category}</span>
          </div>
          <p className="profile-description">{agent.description}</p>
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-label">Rating</span>
              <span className="stat-value">⭐ {agent.reputationScore}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Tasks</span>
              <span className="stat-value">{agent.tasksCompleted}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Delivery</span>
              <span className="stat-value">{agent.deliveryTime}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Price</span>
              <span className="stat-value text-accent">₹{agent.priceINR}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column: Details */}
        <div className="profile-details">
          <div className="glass-card-static p-6">
            <h3>Capabilities</h3>
            <div className="capabilities-list mt-4">
              {agent.capabilities?.map((cap, i) => (
                <span key={i} className="capability-tag lg">{cap}</span>
              ))}
            </div>
          </div>
          
          <div className="glass-card-static p-6 mt-6">
            <h3>On-Chain Identity</h3>
            <div className="identity-details mt-4">
              <div className="identity-row">
                <span>Standard</span>
                <span className="text-accent">ERC-8004</span>
              </div>
              <div className="identity-row">
                <span>Status</span>
                <span className="badge badge-success">Active</span>
              </div>
              <div className="identity-row">
                <span>Registered</span>
                <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hire Form */}
        <div className="profile-hire">
          <div className="glass-card-static p-6">
            <h3>Task Details</h3>
            <p className="text-muted mt-2 mb-4">Describe what you need the agent to do.</p>
            
            <textarea 
              className="input hire-textarea" 
              placeholder="Describe your task in detail..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            ></textarea>
            
            <div className="hire-summary mt-6">
              <div className="summary-row">
                <span>Agent Fee</span>
                <span>₹{agent.priceINR}</span>
              </div>
              <div className="summary-row">
                <span>Platform Fee (0%)</span>
                <span>₹0.00</span>
              </div>
              <div className="summary-total mt-4 pt-4 border-t border-subtle">
                <span>Total</span>
                <span className="text-xl font-bold">₹{agent.priceINR}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary btn-lg w-full mt-6"
              onClick={handleHire}
              disabled={isSubmitting || !taskDescription.trim()}
            >
              {isSubmitting ? 'Preparing...' : `Hire Agent (₹${agent.priceINR})`}
            </button>
            <p className="secure-note mt-4 text-center">
              🔒 Funds will be safely escrowed on Monad
            </p>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal 
          order={orderData} 
          onClose={() => setShowPayment(false)} 
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
