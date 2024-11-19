// App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Answers from './pages/Answers';
import Form from './pages/Form';
import Home from './pages/Home';
import Data from './pages/Data';
import './App.css'; // Import du fichier CSS

function App() {
  // Fonction pour télécharger le fichier des réponses
  const downloadResponses = () => {
    fetch('/api/data/responses/exportResponsesToExcel', {
      method: 'GET',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du fichier');
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
  
        // Récupérer la date et l'heure actuelles
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Mois de 0 à 11, donc +1
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
  
        // Construire le nom du fichier
        const fileName = `exported_responses_${year}_${month}_${day}_${hours}_${minutes}.xlsx`;
  
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((error) => {
        console.error(error);
        alert('Une erreur est survenue lors du téléchargement.');
      });
  };

  return (
    <Router>
      <div className="app-container">
        <nav className="sidebar">
          <ul>
            <li>
              <Link to="/">Formulaires</Link>
            </li>
            <li>
              <Link to="/answers">Réponses</Link>
            </li>
            <li>
              <Link onClick={downloadResponses}>Télécharger les réponses</Link>
            </li>
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
