import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { simulatePayment } from '../utils/api';
import './PaymentModal.css';

export default function PaymentModal({ order, onClose, onPaymentComplete }) {
  const [status, setStatus] = useState('pending'); // pending | processing | confirmed
  const [error, setError] = useState(null);

  const payment = order?.payment;

  const handleSimulatePayment = async () => {
    setStatus('processing');
    setError(null);
    try {
      const result = await simulatePayment(order.orderId);
      if (result.success) {
        setStatus('confirmed');
        setTimeout(() => {
          onPaymentComplete(result.data);
        }, 1500);
      } else {
        setError(result.error);
        setStatus('pending');
      }
    } catch (err) {
      setError('Payment simulation failed. Is the backend running?');
      setStatus('pending');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-header">
          <h2>Pay via UPI</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {status === 'confirmed' ? (
          <div className="payment-confirmed">
            <div className="confirmed-icon">✅</div>
            <h3>Payment Confirmed!</h3>
            <p>Funds are being escrowed on Monad...</p>
            <div className="spin" style={{ fontSize: '1.5rem', marginTop: '12px' }}>⛓️</div>
          </div>
        ) : (
          <>
            {/* Amount */}
            <div className="payment-amount">
              <span className="amount-label">Amount to pay</span>
              <span className="amount-inr">₹{order?.amountINR}</span>
              <span className="amount-usdc">≈ {order?.amountUSDC} USDC</span>
              <span className="amount-rate">@ ₹{payment?.conversionRate}/USDC</span>
            </div>

            {/* QR Code */}
            <div className="qr-section">
              <div className="qr-wrapper">
                <QRCodeSVG
                  value={payment?.qrData || 'upi://pay'}
                  size={200}
                  bgColor="#1a1a2e"
                  fgColor="#f0f0f5"
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="qr-hint">Scan with any UPI app</p>
            </div>

            {/* UPI Apps */}
            <div className="upi-apps">
              {payment?.supportedApps?.map((app) => (
                <div key={app.name} className="upi-app">
                  <span className="upi-app-icon">
                    {app.name === 'Google Pay' && '💳'}
                    {app.name === 'PhonePe' && '📱'}
                    {app.name === 'Paytm' && '💰'}
                    {app.name === 'BHIM' && '🏦'}
                  </span>
                  <span className="upi-app-name">{app.name}</span>
                </div>
              ))}
            </div>

            {/* VPA */}
            <div className="upi-vpa">
              <span className="vpa-label">UPI ID</span>
              <span className="vpa-value">{payment?.merchantVPA}</span>
            </div>

            {/* Simulate Button (MVP) */}
            <div className="payment-actions">
              <div className="mvp-notice">
                <span className="mvp-badge">🧪 MVP MODE</span>
                <span>No real money will be charged</span>
              </div>
              <button
                className={`btn btn-success btn-lg payment-btn ${status === 'processing' ? 'processing' : ''}`}
                onClick={handleSimulatePayment}
                disabled={status === 'processing'}
              >
                {status === 'processing' ? (
                  <>
                    <span className="spin">⏳</span>
                    Processing Payment...
                  </>
                ) : (
                  <>✅ Simulate UPI Payment</>
                )}
              </button>
            </div>

            {error && (
              <div className="payment-error">
                <span>❌</span> {error}
              </div>
            )}

            {/* Info */}
            <div className="payment-info">
              <p>🔒 Funds will be escrowed on Monad blockchain</p>
              <p>⏱️ Agent will begin work within seconds</p>
              <p>💸 Payment released only after you confirm delivery</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
