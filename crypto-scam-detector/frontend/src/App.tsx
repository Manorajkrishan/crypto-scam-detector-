import Home from './pages/Home';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="shield">🛡</span>
          <span>CryptoRisk</span>
        </div>
        <span className="nav-tag">MVP</span>
      </nav>
      <main>
        <Home />
      </main>
      <footer className="footer">
        <p>Not financial advice. Risk analysis only — always verify independently.</p>
      </footer>
    </div>
  );
}
