import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOrder, createWebSocket, confirmOrder } from '../utils/api';
import './OrderTracking.css';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadOrder();

    // Set up WebSocket for real-time updates
    const ws = createWebSocket(id);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'order.status_update' || data.type === 'subscribed') {
        loadOrder(); // Reload full order on status change
      }
    };

    return () => {
      ws.close();
    };
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await fetchOrder(id);
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmOrder(id);
      await loadOrder();
    } catch (err) {
      console.error(err);
      alert('Failed to confirm order');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="container mt-16"><div className="shimmer glass-card-static" style={{ height: '400px' }}></div></div>;
  if (!order) return <div className="container mt-16">Order not found</div>;

  // Calculate progress
  const getProgressWidth = () => {
    switch(order.status) {
      case 'pending': return '10%';
      case 'paid': return '30%';
      case 'escrowed': return '50%';
      case 'in_progress': return '75%';
      case 'delivered': return '90%';
      case 'completed': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="order-tracking container">
      <div className="tracking-header">
        <h1>Order Tracking</h1>
        <span className="order-id">ID: {order.id.split('-')[0]}</span>
      </div>

      <div className="tracking-grid">
        {/* Main Status Area */}
        <div className="status-main">
          <div className="glass-card-static p-8 text-center">
            {order.status === 'pending' && <div className="status-icon pulse">⏳</div>}
            {order.status === 'paid' && <div className="status-icon">💸</div>}
            {order.status === 'escrowed' && <div className="status-icon spin">⛓️</div>}
            {order.status === 'in_progress' && <div className="status-icon pulse">🤖</div>}
            {order.status === 'delivered' && <div className="status-icon bounce">📦</div>}
            {order.status === 'completed' && <div className="status-icon">✅</div>}

            <h2 className="mt-4 status-title">
              {order.status === 'pending' && 'Awaiting Payment'}
              {order.status === 'paid' && 'Payment Received'}
              {order.status === 'escrowed' && 'Funds Escrowed on Monad'}
              {order.status === 'in_progress' && 'Agent is Working'}
              {order.status === 'delivered' && 'Results Delivered!'}
              {order.status === 'completed' && 'Order Completed'}
            </h2>

            <p className="status-desc mt-2">
              {order.status === 'pending' && 'Please complete the UPI payment.'}
              {order.status === 'paid' && 'Payment simulated. Preparing escrow...'}
              {order.status === 'escrowed' && 'Funds are locked safely. Agent is being notified.'}
              {order.status === 'in_progress' && `${order.agentName} is processing your task.`}
              {order.status === 'delivered' && 'The agent has completed the task. Please review the results.'}
              {order.status === 'completed' && 'Payment has been released to the agent. Thank you!'}
            </p>

            {/* Progress Bar */}
            <div className="progress-container mt-8">
              <div className="progress-bar" style={{ width: getProgressWidth() }}></div>
            </div>
            
            <div className="progress-labels mt-2">
              <span className={['pending', 'paid'].includes(order.status) ? 'active' : 'passed'}>Payment</span>
              <span className={['escrowed'].includes(order.status) ? 'active' : ['in_progress', 'delivered', 'completed'].includes(order.status) ? 'passed' : ''}>Escrow</span>
              <span className={['in_progress'].includes(order.status) ? 'active' : ['delivered', 'completed'].includes(order.status) ? 'passed' : ''}>Working</span>
              <span className={['delivered'].includes(order.status) ? 'active' : ['completed'].includes(order.status) ? 'passed' : ''}>Review</span>
            </div>

            {/* Actions */}
            {order.status === 'delivered' && (
              <div className="delivery-actions mt-8">
                <button 
                  className="btn btn-success btn-lg" 
                  onClick={handleConfirm}
                  disabled={confirming}
                >
                  {confirming ? 'Releasing Funds...' : 'Confirm & Release Payment'}
                </button>
              </div>
            )}
          </div>

          {/* Delivery Results */}
          {order.deliveryResult && (
            <div className="glass-card-static p-6 mt-6 fade-in">
              <h3>Delivery Results</h3>
              <div className="delivery-result mt-4">
                <h4 className="result-title">{order.deliveryResult.title}</h4>
                <p className="result-summary">{order.deliveryResult.summary}</p>
                
                {order.deliveryResult.type === 'report' && (
                  <div className="result-data mt-4">
                    <div className="data-row">
                      <span>Sentiment:</span>
                      <strong className="text-success">{order.deliveryResult.data.overallSentiment}</strong>
                    </div>
                    <div className="data-row">
                      <span>Confidence:</span>
                      <strong>{order.deliveryResult.data.confidenceScore}%</strong>
                    </div>
                    <div className="data-box mt-2">
                      {order.deliveryResult.data.keyInsights.map((i, idx) => <li key={idx}>{i}</li>)}
                    </div>
                  </div>
                )}
                
                {order.deliveryResult.type === 'translation' && (
                  <div className="result-data mt-4">
                    <div className="data-box translated-text">
                      {order.deliveryResult.data.translatedText}
                    </div>
                  </div>
                )}
                
                {order.deliveryResult.type === 'image' && (
                  <div className="result-data mt-4">
                    <img src={order.deliveryResult.data.imageUrl} alt="Generated" className="result-image" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="status-sidebar">
          <div className="glass-card-static p-6">
            <h3>Order Details</h3>
            <div className="details-list mt-4">
              <div className="detail-item">
                <span className="detail-label">Agent</span>
                <span className="detail-value">{order.agentName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Amount</span>
                <span className="detail-value">₹{order.amountINR}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {order.txHashes && Object.keys(order.txHashes).length > 0 && (
            <div className="glass-card-static p-6 mt-6">
              <h3>On-Chain Receipts</h3>
              <p className="text-muted text-sm mb-4">Monad Testnet Transactions</p>
              <div className="tx-list">
                {order.txHashes.fundEscrow && (
                  <div className="tx-item">
                    <span className="tx-label">Escrow Lock</span>
                    <a href={`https://testnet.monadexplorer.com/tx/${order.txHashes.fundEscrow}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                      {order.txHashes.fundEscrow.substring(0, 10)}...
                    </a>
                  </div>
                )}
                {order.txHashes.delivery && (
                  <div className="tx-item">
                    <span className="tx-label">Delivery Proof</span>
                    <a href={`https://testnet.monadexplorer.com/tx/${order.txHashes.delivery}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                      {order.txHashes.delivery.substring(0, 10)}...
                    </a>
                  </div>
                )}
                {order.txHashes.releasePayment && (
                  <div className="tx-item">
                    <span className="tx-label">Payment Release</span>
                    <a href={`https://testnet.monadexplorer.com/tx/${order.txHashes.releasePayment}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                      {order.txHashes.releasePayment.substring(0, 10)}...
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
