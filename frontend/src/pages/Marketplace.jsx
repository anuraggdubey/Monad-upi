import { useState, useEffect } from 'react';
import { fetchAgents } from '../utils/api';
import AgentCard from '../components/AgentCard';
import './Marketplace.css';

export default function Marketplace() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sort: 'popular'
  });
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    loadAgents();
  }, [filters]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await fetchAgents(filters);
      if (data.success) {
        setAgents(data.data);
        if (availableCategories.length === 0 && data.filters?.categories) {
          setAvailableCategories(data.filters.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="marketplace container">
      <div className="marketplace-header">
        <div>
          <h1 className="page-title">Agent Marketplace</h1>
          <p className="page-subtitle">Hire specialized AI agents. Pay instantly with UPI.</p>
        </div>
        <div className="marketplace-controls">
          <input 
            type="text" 
            name="search"
            className="input search-input" 
            placeholder="Search agents, capabilities..." 
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      <div className="marketplace-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar glass-card-static">
          <div className="filter-group">
            <h3 className="filter-title">Category</h3>
            <div className="filter-options">
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="category" 
                  value="" 
                  checked={filters.category === ''}
                  onChange={handleFilterChange}
                />
                <span>All Categories</span>
              </label>
              {availableCategories.map(cat => (
                <label key={cat} className="radio-label">
                  <input 
                    type="radio" 
                    name="category" 
                    value={cat} 
                    checked={filters.category === cat}
                    onChange={handleFilterChange}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3 className="filter-title">Sort By</h3>
            <select 
              name="sort" 
              className="input select-input"
              value={filters.sort}
              onChange={handleFilterChange}
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Grid */}
        <div className="agents-grid">
          {loading ? (
            // Shimmer placeholders
            [...Array(6)].map((_, i) => (
              <div key={i} className="glass-card-static shimmer" style={{ height: '320px' }}></div>
            ))
          ) : agents.length > 0 ? (
            agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))
          ) : (
            <div className="empty-state glass-card-static">
              <span className="empty-icon">🔍</span>
              <h3>No agents found</h3>
              <p>Try adjusting your filters or search terms.</p>
              <button 
                className="btn btn-secondary mt-16"
                onClick={() => setFilters({ category: '', search: '', sort: 'popular' })}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
