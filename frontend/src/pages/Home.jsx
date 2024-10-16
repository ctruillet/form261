import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css'; // Importer le CSS
const Home = () => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get('/api/forms');
        setForms(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des formulaires :', error);
      }
    };

    fetchForms();
  }, []);

  const handleFormSelect = async (formName) => {
    try {
      const response = await axios.get(`/api/forms/${formName}`);
      navigate('/form', { state: { formDescription: response.data } });
    } catch (error) {
      console.error('Erreur lors de la récupération du formulaire :', error);
    }
  };

  return (
    <div>
      <h1>Sélectionnez un Formulaire</h1>
      <ul>
        {forms.map((form, index) => (
          <li key={index}>
            <button onClick={() => handleFormSelect(form.file)}>
              {form.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;