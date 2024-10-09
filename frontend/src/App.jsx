// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Admin from './components/Admin'; // Assure-toi que ce chemin est correct
import Form from './components/Form'; // Assure-toi que ce chemin est correct
import Home from './components/Home'; // Assure-toi que ce chemin est correct

function App() {
  return (
    <Router>
      <div>
        {/* Tu peux ajouter une barre de navigation ici si nécessaire */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/form" element={<Form />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
