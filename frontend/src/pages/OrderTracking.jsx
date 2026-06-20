import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOrder, createWebSocket, confirmOrder } from '../utils/api';
import { IconCheck, IconLink, IconBot, IconBox, IconCheckCircle } from '../components/Icons';
import './OrderTracking.css';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadOrder();
    const ws = createWebSocket(id);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'order.status_update' || data.type === 'subscribed') {
        loadOrder();
      }
    };
    return () => ws.close();
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

  const statuses = ['pending', 'paid', 'escrowed', 'in_progress', 'delivered', 'completed'];
  const currentIndex = statuses.indexOf(order.status);

  const getNodeStatus = (index) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="order-tracking container">
      <div className="tracking-header">
        <h1>Order Execution</h1>
        <span className="order-id-badge">ID: {order.id.split('-')[0]}</span>
      </div>

      <div className="tracking-grid">
        {/* Main Pipeline Engine */}
        <div className="pipeline-container">
          <div className="pipeline-header">
            <h2>Pipeline Engine</h2>
          </div>

          <div className="timeline">
            {/* Payment Node */}
            <div className={`timeline-node ${getNodeStatus(1)}`}>
              <div className="node-icon"><IconCheck size={24} /></div>
              <div className="node-content">
                <div className="node-title">Payment Verification</div>
                <div className="node-desc">
                  {currentIndex >= 1 ? 'UPI payment simulated and verified.' : 'Awaiting UPI payment...'}
                </div>
              </div>
            </div>

            {/* Escrow Node */}
            <div className={`timeline-node ${getNodeStatus(2)}`}>
              <div className="node-icon"><IconLink size={24} /></div>
              <div className="node-content">
                <div className="node-title">Monad Smart Escrow</div>
                <div className="node-desc">
                  {currentIndex >= 2 ? `Funds locked safely in Monad contract.` : 'Pending escrow lock...'}
                </div>
              </div>
            </div>

            {/* Agent Node */}
            <div className={`timeline-node ${getNodeStatus(3)}`}>
              <div className="node-icon"><IconBot size={24} /></div>
              <div className="node-content">
                <div className="node-title">Agent Processing</div>
                <div className="node-desc">
                  {currentIndex >= 3 ? `${order.agentName} has executed the task.` : 'Awaiting agent allocation...'}
                </div>
              </div>
            </div>

            {/* Delivery Node */}
            <div className={`timeline-node ${getNodeStatus(4)}`}>
              <div className="node-icon"><IconBox size={24} /></div>
              <div className="node-content">
                <div className="node-title">Result Delivery</div>
                <div className="node-desc">
                  {currentIndex >= 4 ? 'Results delivered successfully.' : 'Awaiting results from agent...'}
                </div>
                
                {/* Result Payload */}
                {order.status === 'delivered' && order.deliveryResult && (
                  <div className="result-box fade-in">
                    <h3>{order.deliveryResult.title}</h3>
                    <p>{order.deliveryResult.summary}</p>
                    
                    {order.deliveryResult.type === 'report' && (
                      <div className="data-grid">
                        <div className="data-row">
                          <span>Sentiment</span>
                          <strong>{order.deliveryResult.data.overallSentiment}</strong>
                        </div>
                        <div className="data-row">
                          <span>Confidence</span>
                          <strong>{order.deliveryResult.data.confidenceScore}%</strong>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="btn btn-primary mt-4" 
                      onClick={handleConfirm}
                      disabled={confirming}
                      style={{ width: '100%' }}
                    >
                      {confirming ? 'Releasing Funds...' : 'Release Payment to Agent'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Node */}
            <div className={`timeline-node ${getNodeStatus(5)}`}>
              <div className="node-icon"><IconCheckCircle size={24} /></div>
              <div className="node-content">
                <div className="node-title">Pipeline Complete</div>
                <div className="node-desc">
                  {currentIndex === 5 ? 'Funds released. Transaction closed.' : 'Awaiting delivery confirmation...'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="terminal-sidebar">
          {/* Terminal Output */}
          <div className="receipt-card">
            <div className="receipt-header">
              <IconLink size={14} /> ON-CHAIN RECEIPT
            </div>
            <div className="tx-log">
              {order.txHashes && order.txHashes.fundEscrow ? (
                <div className="tx-entry">
                  <span className="tx-label">fund_escrow()</span>
                  <a href={`https://testnet.monadexplorer.com/tx/${order.txHashes.fundEscrow}`} target="_blank" rel="noopener noreferrer" className="tx-hash">
                    {order.txHashes.fundEscrow}
                  </a>
                </div>
              ) : (
                <div className="tx-entry"><span className="tx-label">Awaiting lock_tx...</span></div>
              )}
              
              {order.txHashes && order.txHashes.delivery && (
                <div className="tx-entry">
                  <span className="tx-label">submit_delivery()</span>
                  <a href={`https://testnet.monadexplorer.com/tx/${order.txHashes.delivery}`} target="_blank" rel="noopener noreferrer" className="tx-hash">
                    {order.txHashes.delivery}
                  </a>
                </div>
              )}
              
              {order.txHashes && order.txHashes.releasePayment && (
                <div className="tx-entry">
                  <span className="tx-label">release_funds()</span>
                  <a href={`https://testnet.monadexplorer.com/tx/${order.txHashes.releasePayment}`} target="_blank" rel="noopener noreferrer" className="tx-hash">
                    {order.txHashes.releasePayment}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="info-card">
            <h3>Job Details</h3>
            <div className="info-grid">
              <div className="info-row">
                <span className="label">Agent</span>
                <span className="val">{order.agentName}</span>
              </div>
              <div className="info-row">
                <span className="label">Amount</span>
                <span className="val text-accent">₹{order.amountINR}</span>
              </div>
              <div className="info-row">
                <span className="label">Started</span>
                <span className="val">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
