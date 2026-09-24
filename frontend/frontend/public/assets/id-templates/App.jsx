import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import Template1Page from './Template1Page';
import Template2Page from './Template2Page';
import Template3Page from './Template3Page';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/template1" className="nav-link">Template 1</Link>
          <Link to="/template2" className="nav-link">Template 2</Link>
          <Link to="/template3" className="nav-link">Template 3</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/template1" element={<Template1Page />} />
          <Route path="/template2" element={<Template2Page />} />
          <Route path="/template3" element={<Template3Page />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

