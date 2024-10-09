// Form.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const Form = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({});
  const [formFields, setFormFields] = useState([]);

  useEffect(() => {
    if (location.state && location.state.formDescription) {
      setFormFields(location.state.formDescription);
      const initialFormData = {};
      location.state.formDescription.forEach(field => {
        initialFormData[field.name] = '';
      });
      setFormData(initialFormData);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/registerData', formData);
      alert('Données envoyées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des données :', error);
    }
  };

  return (
    <div>
      <h1>Formulaire Dynamique</h1>
      <form onSubmit={handleSubmit}>
        {formFields.map((field, index) => (
          <div key={index}>
            <label>{field.label} :</label>
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              required={field.required}
            />
          </div>
        ))}
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
};

export default Form;
