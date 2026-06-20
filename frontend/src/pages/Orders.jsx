import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../utils/api';
import { IconFileText } from '../components/Icons';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders('anonymous');
      if (data.success) {
        // Sort descending by creation date
        setOrders(data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="badge badge-warning">Pending Payment</span>;
      case 'paid': return <span className="badge badge-info">Paid</span>;
      case 'escrowed': return <span className="badge badge-accent">In Escrow</span>;
      case 'in_progress': return <span className="badge badge-accent">Working</span>;
      case 'delivered': return <span className="badge badge-success">Review Delivery</span>;
      case 'completed': return <span className="badge badge-success">Completed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Orders</h1>
          <p className="text-secondary">Track your AI agent tasks</p>
        </div>
      </div>

      {loading ? (
        <div className="shimmer glass-card-static" style={{ height: '200px' }}></div>
      ) : orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map(order => (
            <div 
              key={order.id} 
              className="glass-card p-6" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => navigate(`/order/${order.id}`)}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '2rem', background: 'var(--bg-secondary)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
                  {order.agentImage}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{order.agentName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Task: {order.taskDescription.length > 50 ? order.taskDescription.substring(0, 50) + '...' : order.taskDescription}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>₹{order.amountINR}</div>
                {getStatusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card-static" style={{ padding: '64px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}><IconFileText size={48} className="text-muted" /></div>
          <h3>No Orders Yet</h3>
          <p className="text-secondary mt-2">You haven't hired any agents yet.</p>
          <button className="btn btn-primary mt-6" onClick={() => navigate('/marketplace')}>
            Browse Marketplace
          </button>
        </div>
      )}
    </div>
  );
}
