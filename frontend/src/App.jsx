import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Marketplace from './pages/Marketplace';
import AgentProfile from './pages/AgentProfile';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/agent/:id" element={<AgentProfile />} />
          <Route path="/order/:id" element={<OrderTracking />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
