// Form.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const Form = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({});
  const [formFields, setFormFields] = useState([]);

  useEffect(() => {
    // Vérification de la présence de formDescription dans location.state
    if (location.state && location.state.formDescription) {
      const fields = location.state.formDescription.fields || [];
      setFormFields(fields);

      // Initialiser les champs du formulaire avec des valeurs vides
      const initialFormData = {};
      fields.forEach(field => {
        initialFormData[field.label] = ''; // Utiliser label au lieu de name si name n'est pas défini
      });
      setFormData(initialFormData);
    } else {
      console.error('Aucune description de formulaire reçue.');
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

      {/* Affichage d'un message si formFields est vide */}
      {formFields.length === 0 ? (
        <p>Le formulaire est vide ou non disponible.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {formFields.map((field, index) => (
            <div key={index}>
              <label>{field.label} :</label>
              <input
                type={field.type}
                name={field.label} // Utilise label comme clé pour le champ
                value={formData[field.label]}
                onChange={handleChange}
                required={field.required}
              />
            </div>
          ))}
          <button type="submit">Envoyer</button>
        </form>
      )}
    </div>
  );
};

export default Form;
