// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Admin from './pages/Admin';
import Form from './pages/Form'; 
import Home from './pages/Home'; 
import CreateForm from './pages/CreateForm';

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
              <Link to="/admin">Admin</Link>
            </li>
            <li>
              <Link to="/create">Créer un formulaire</Link> {/* Lien vers la nouvelle page */}
            </li>
          </ul>
        </nav>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/form" element={<Form />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/create" element={<CreateForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
