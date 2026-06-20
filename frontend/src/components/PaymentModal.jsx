import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createOrder, simulatePayment, verifyPayment, fetchConfig, openRazorpayCheckout } from '../utils/api';
import { IconX, IconCheckCircle, IconLink, IconCard, IconPhone, IconCoins, IconBank, IconFlask, IconClock, IconCheck, IconLock, IconBot } from './Icons';
import './PaymentModal.css';

export default function PaymentModal({ agent, onClose, onPaymentComplete }) {
  const [step, setStep] = useState('loading'); // loading | task_input | pending | processing | confirmed | error
  const [config, setConfig] = useState(null);
  const [order, setOrder] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [error, setError] = useState(null);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig().then((cfg) => {
      setConfig(cfg);
      setStep('task_input');
    }).catch(() => {
      setConfig({ razorpayConfigured: false, paymentMode: 'simulate' });
      setStep('task_input');
    });
  }, []);

  const isRazorpay = config?.razorpayConfigured;

  // Create order and either open Razorpay or show simulate UI
  const handleCreateOrder = async () => {
    if (!taskDescription.trim()) {
      setError('Please describe your task');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const result = await createOrder({
        agentId: agent.agentId,
        taskDescription: taskDescription.trim(),
      });

      if (!result.success) {
        setError(result.error || 'Failed to create order');
        setStep('task_input');
        return;
      }

      setOrder(result.data);

      if (result.data.mode === 'razorpay') {
        // Open Razorpay Checkout
        try {
          const paymentResult = await openRazorpayCheckout({
            razorpayKeyId: result.data.razorpayKeyId,
            razorpayOrderId: result.data.razorpayOrderId,
            amountINR: result.data.amountINR,
            agentName: agent.name,
            description: `Pay ${agent.name} for: ${taskDescription.substring(0, 50)}`,
          });

          // Verify payment on backend
          setStep('processing');
          const verifyResult = await verifyPayment(result.data.orderId, paymentResult);

          if (verifyResult.success) {
            setStep('confirmed');
            setTimeout(() => {
              onPaymentComplete(verifyResult.data);
            }, 1500);
          } else {
            setError(verifyResult.error || 'Payment verification failed');
            setStep('task_input');
          }
        } catch (rzpError) {
          if (rzpError.message === 'Payment cancelled by user') {
            setStep('task_input');
            setError(null);
          } else {
            setError(rzpError.message);
            setStep('task_input');
          }
        }
      } else {
        // Simulate mode — show QR + simulate button
        setStep('pending');
      }
    } catch (err) {
      setError('Failed to create order. Is the backend running?');
      setStep('task_input');
    }
  };

  // Handle simulate payment (fallback mode)
  const handleSimulatePayment = async () => {
    setStep('processing');
    setError(null);
    try {
      const result = await simulatePayment(order.orderId);
      if (result.success) {
        setStep('confirmed');
        setTimeout(() => {
          onPaymentComplete(result.data);
        }, 1500);
      } else {
        setError(result.error);
        setStep('pending');
      }
    } catch (err) {
      setError('Payment simulation failed. Is the backend running?');
      setStep('pending');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-header">
          <h2>{isRazorpay ? 'Pay via Razorpay' : 'Pay via UPI'}</h2>
          <button className="modal-close" onClick={onClose}><IconX size={16} /></button>
        </div>

        {step === 'loading' && (
          <div className="payment-loading">
            <div className="spin"><IconClock size={32} /></div>
            <p>Initializing payment...</p>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="payment-confirmed">
            <div className="confirmed-icon"><IconCheckCircle size={48} className="text-success" /></div>
            <h3>Payment Confirmed!</h3>
            <p>Initializing Monad Smart Contract Escrow...</p>
            <div className="spin text-muted" style={{ marginTop: '12px' }}><IconLink size={32} /></div>
          </div>
        )}

        {(step === 'task_input' || step === 'pending' || step === 'processing') && (
          <>
            {/* Agent info + Amount */}
            <div className="payment-agent-info">
              <div className="payment-agent-avatar">
                <IconBot size={24} />
              </div>
              <div className="payment-agent-details">
                <span className="payment-agent-name">{agent.name}</span>
                <span className="payment-agent-category">{agent.category}</span>
              </div>
            </div>

            <div className="payment-amount">
              <span className="amount-label">Amount to pay</span>
              <span className="amount-inr">₹{agent.priceINR}</span>
              <span className="amount-usdc">≈ {agent.priceUSDC} USDC</span>
            </div>

            {/* Task Input (only shown before order is created) */}
            {step === 'task_input' && (
              <div className="task-input-section">
                <label className="task-label" htmlFor="task-desc">Describe your task</label>
                <textarea
                  id="task-desc"
                  className="task-textarea"
                  placeholder={`e.g., "Analyze Bitcoin sentiment for the last 24 hours"...`}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Razorpay mode — Pay button */}
            {step === 'task_input' && isRazorpay && (
              <div className="payment-actions">
                <div className="razorpay-badge-row">
                  <span className="razorpay-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    SECURED BY RAZORPAY
                  </span>
                </div>
                <button
                  className="btn btn-razorpay btn-lg payment-btn"
                  onClick={handleCreateOrder}
                  disabled={!taskDescription.trim()}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconLock size={16} /> Pay ₹{agent.priceINR} via UPI / Card
                  </span>
                </button>
              </div>
            )}

            {/* Simulate mode — Task input → Create Order button */}
            {step === 'task_input' && !isRazorpay && (
              <div className="payment-actions">
                <div className="mvp-notice">
                  <span className="mvp-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconFlask size={12} /> MVP MODE</span>
                  <span>No real money will be charged</span>
                </div>
                <button
                  className="btn btn-success btn-lg payment-btn"
                  onClick={handleCreateOrder}
                  disabled={!taskDescription.trim()}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconCheck size={16} /> Create Order & Pay
                  </span>
                </button>
              </div>
            )}

            {/* Simulate mode — Show QR and simulate button after order is created */}
            {step === 'pending' && order && (
              <>
                <div className="qr-section">
                  <div className="qr-wrapper">
                    <QRCodeSVG
                      value={order.payment?.qrData || 'upi://pay'}
                      size={200}
                      bgColor="#1a1a2e"
                      fgColor="#f0f0f5"
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <p className="qr-hint">Scan with any UPI app</p>
                </div>

                <div className="upi-apps">
                  {order.payment?.supportedApps?.map((app) => (
                    <div key={app.name} className="upi-app">
                      <div className="upi-app-icon">
                        {app.name === 'Google Pay' && <IconCard size={24} />}
                        {app.name === 'PhonePe' && <IconPhone size={24} />}
                        {app.name === 'Paytm' && <IconCoins size={24} />}
                        {app.name === 'BHIM' && <IconBank size={24} />}
                      </div>
                      <span className="upi-app-name">{app.name}</span>
                    </div>
                  ))}
                </div>

                <div className="upi-vpa">
                  <span className="vpa-label">UPI ID</span>
                  <span className="vpa-value">{order.payment?.merchantVPA}</span>
                </div>

                <div className="payment-actions">
                  <div className="mvp-notice">
                    <span className="mvp-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconFlask size={12} /> MVP MODE</span>
                    <span>No real money will be charged</span>
                  </div>
                  <button
                    className="btn btn-success btn-lg payment-btn"
                    onClick={handleSimulatePayment}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconCheck size={16} /> Simulate UPI Payment
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* Processing state */}
            {step === 'processing' && (
              <div className="payment-loading">
                <div className="spin"><IconClock size={32} /></div>
                <p>{isRazorpay ? 'Processing payment...' : 'Initializing payment...'}</p>
              </div>
            )}

            {error && (
              <div className="payment-error">
                <span style={{ display: 'flex', alignItems: 'center' }}><IconX size={16} /></span> {error}
              </div>
            )}

            {/* Info */}
            <div className="payment-info">
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconLock size={14} /> Funds will be escrowed on Monad blockchain</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconClock size={14} /> Agent will begin work within seconds</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IconBank size={14} /> Payment released only after you confirm delivery</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
