// Home.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [predefinedForms, setPredefinedForms] = useState([]);
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

  // Gestion du chargement d'un fichier JSON
  const handleUploadForm = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const formDescription = JSON.parse(e.target.result);
      navigate('/form', { state: { formDescription } });
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h1>Bienvenue sur la page d'accueil</h1>
      <h2>Formulaires prédéfinis</h2>
      <ul>
        {predefinedForms.map((form, index) => (
          <li key={index}>
            <button onClick={() => handleSelectPredefinedForm(form.file)}>
              {form.name}
            </button>
          </li>
        ))}
      </ul>

      <h2>Ou importer un fichier JSON</h2>
      <input type="file" accept=".json" onChange={handleUploadForm} />
    </div>
  );
};

export default Home;
