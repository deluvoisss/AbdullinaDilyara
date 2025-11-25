import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdsList from './components/AdsList.tsx';
import AdDetail from './components/AdDetail.tsx';
import Stats from './components/Stats.tsx';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-container">
            <h1 className="navbar-title">Модерация Объявлений Авито</h1>
            <div className="navbar-links">
              <Link to="/list" className="nav-link">Список объявлений</Link>
              <Link to="/stats" className="nav-link">Статистика</Link>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<AdsList />} />
          <Route path="/list" element={<AdsList />} />
          <Route path="/item/:id" element={<AdDetail />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
