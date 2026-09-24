import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Identity Card Generator</h1>
        <p>Choose a template to view or customize</p>
        
        <div className="template-grid">
          <Link to="/template1" className="template-card">
            <div className="template-preview template1-preview"></div>
            <h2>Template 1</h2>
            <p>Classic design with student details</p>
          </Link>
          
          <Link to="/template2" className="template-card">
            <div className="template-preview template2-preview"></div>
            <h2>Template 2</h2>
            <p>Modern layout with emergency contact</p>
          </Link>
          
          <Link to="/template3" className="template-card">
            <div className="template-preview template3-preview"></div>
            <h2>Template 3</h2>
            <p>Vertical card with red header</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

