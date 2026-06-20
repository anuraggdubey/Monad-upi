import { useState, useEffect } from 'react';
import { fetchAgents } from '../utils/api';
import AgentCard from '../components/AgentCard';
import { IconSearch } from '../components/Icons';
import './Marketplace.css';

export default function Marketplace() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('trusted');

  const categories = ['All', 'Development', 'Design', 'Data', 'Writing'];

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await fetchAgents();
        if (data.success) {
          setAgents(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, []);

  const filteredAgents = agents
    .filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           agent.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' || agent.category === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'trusted') return b.reputationScore - a.reputationScore;
      if (sortBy === 'price_asc') return a.priceINR - b.priceINR;
      if (sortBy === 'price_desc') return b.priceINR - a.priceINR;
      return 0;
    });

  // Simulated live events for the ticker
  const liveEvents = [
    "CodeReviewer AI completed a ₹100 audit · 12s ago",
    "DataSage analyzed 50k rows for ₹250 · 45s ago",
    "SmartContractSec found 2 vulnerabilities · 1m ago",
    "CopyNinja generated landing page copy · 2m ago",
    "LogoCrafter delivered 3 concepts · 3m ago"
  ];
  const tickerEvents = [...liveEvents, ...liveEvents]; // Duplicate for seamless scroll

  return (
    <div className="marketplace container">
      {/* Live Activity Strip */}
      <div className="live-ticker-strip">
        <div className="ticker-content">
          {tickerEvents.map((event, i) => (
            <div key={i} className="ticker-item">
              <span className="ticker-dot"></span>
              <span>{event}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="marketplace-header">
        <h1 className="page-title">AGENT REGISTRY</h1>
        <p className="page-subtitle">VERIFIED, LIVE ON MONAD.</p>
      </div>

      {/* Ledger Lookup */}
      <div className="ledger-lookup-container">
        <input 
          type="text" 
          placeholder="search the registry..." 
          className="ledger-lookup-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="search-icon-mono"><IconSearch size={20} /></div>
      </div>

      {/* Folder Tabs & Sort */}
      <div className="registry-controls">
        <div className="folder-tabs">
          {categories.map(cat => (
            <label key={cat} className="folder-tab-label">
              <input 
                type="radio" 
                name="category" 
                value={cat}
                checked={filter === cat}
                onChange={(e) => setFilter(e.target.value)}
              />
              <span className="folder-tab-text">{cat}</span>
            </label>
          ))}
        </div>

        <div className="ledger-sort">
          <select 
            className="sort-select-mono"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="trusted">Most Trusted</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="marketplace-layout">
        {loading ? (
          <div className="agents-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer" style={{ height: '280px', borderRadius: '12px' }}></div>
            ))}
          </div>
        ) : (
          <div className="agents-grid">
            {filteredAgents.length > 0 ? (
              filteredAgents.map(agent => (
                <AgentCard key={agent.agentId} agent={agent} />
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon"><IconSearch size={48} /></span>
                <h3>No agents found</h3>
                <p>Try adjusting your search terms or filters.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('All');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
