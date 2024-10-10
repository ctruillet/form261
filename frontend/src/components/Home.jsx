// Home.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css'; // Importer le CSS

const Home = () => {
  const [predefinedForms, setPredefinedForms] = useState([]);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();

  // Récupérer les formulaires prédéfinis lors du chargement du composant
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/forms');
        setPredefinedForms(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des formulaires :', error);
      }
    };

    fetchForms();
  }, []);

  // Gestion de la sélection d'un formulaire prédéfini
  const handleSelectPredefinedForm = async (formName) => {
    try {
      const response = await axios.get(`/api/form/${formName}`);
      navigate('/form', { state: { formDescription: response.data } });
    } catch (error) {
      console.error('Erreur lors de la récupération du formulaire sélectionné :', error);
    }
  };

  // Gestion du chargement d'un fichier JSON via le bouton d'import
  const handleUploadForm = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const formDescription = JSON.parse(e.target.result);
      navigate('/form', { state: { formDescription } });
    };
    reader.readAsText(file);
  };

  // Gestion du drag & drop
  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const formDescription = JSON.parse(e.target.result);
        navigate('/form', { state: { formDescription } });
      };
      reader.readAsText(file);
    }
  };

  // Gestion de l'entrée dans la zone de drag
  const handleDragOver = (event) => {
    event.preventDefault();
    if (!dragging) {
      setDragging(true);
    }
  };

  // Gestion de la sortie de la zone de drag
  const handleDragLeave = (event) => {
    // Assurez-vous que l'événement est bien pour le conteneur
    if (event.clientX === 0 && event.clientY === 0) {
      setDragging(false);
    }
  };

  return (
    <div 
      className={`drag-zone ${dragging ? 'dragging' : ''}`} 
      onDragOver={handleDragOver} 
      onDrop={handleDrop} 
      onDragLeave={handleDragLeave}
      style={{ height: '100vh', width: '100vw', position: 'relative' }} // Pour s'assurer que le div prend toute la page
    >
      <h1>Bienvenue sur Form261</h1>
      
      <div className="form-buttons">
        {predefinedForms.map((form, index) => (
          <button key={index} onClick={() => handleSelectPredefinedForm(form.file)}>
            {form.name}
          </button>
        ))}

        <label className="import-button">
          Import JSON
          <input type="file" accept=".json" onChange={handleUploadForm} hidden />
        </label>
      </div>

      {dragging && <div className="drag-overlay">Déposez votre fichier JSON ici</div>}
    </div>
  );
};

export default Home;