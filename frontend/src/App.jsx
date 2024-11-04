// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Answers from './pages/Answers';
import Form from './pages/Form'; 
import Home from './pages/Home'; 
import Data from './pages/Data';

import './App.css'; // Import du fichier CSS

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="sidebar">
          <ul>
            <li>
              <Link to="/">Formulaire</Link>
            </li>
            <li>
              <Link to="/answers">Réponses</Link>
            </li>
            <li>
              {/* <Link to="/data">Data</Link> */}
            </li>
            {/* <li>
              <Link to="/create">Créer un formulaire</Link>
            </li> */}
          </ul>
        </nav>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<Form />} />
            <Route path="/answers" element={<Answers />} />
            <Route path="/data" element={<Data />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
