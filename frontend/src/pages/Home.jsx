import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css'; // Importer le CSS

const Home = () => {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/forms');
        setForms(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des forms :', error);
      }
    };

    fetchForms();
  }, []);

  const handleFormSelect = (fields, param) => {
    // Naviguer vers la page de formulaire avec le nom du fichier de formulaire dans l'URL
    navigate(`/form?fields=${fields}&param=${param}`);
  };

  return (
    <div>
      <h1>Sélectionnez un Formulaire</h1>
      <ul>
        {forms.map((form, index) => (
          <li key={index}>
            <button onClick={() => handleFormSelect(form.fields, form.param)}>
              {form.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
