// Form.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Form.css'; // Importer le CSS

const Form = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [errorFields, setErrorFields] = useState([]); // Tableau pour suivre les champs d'erreur

  useEffect(() => {
    // Vérification de la présence de formDescription dans location.state
    if (location.state && location.state.formDescription) {
      const fields = location.state.formDescription.fields || [];

      // Séparer les champs en paramètres et champs spécifiques au formulaire
      const formSpecificFields = fields.filter(field => field.category === 'form');
      const formParameters = fields.filter(field => field.category === 'parameter');

      setFormFields(formSpecificFields);
      setParameters(formParameters);

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

    // Si le champ est rempli, enlever l'erreur
    if (errorFields.includes(e.target.name)) {
      setErrorFields(errorFields.filter(name => name !== e.target.name));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérification des champs requis
    const requiredErrors = formFields.filter(field => 
      field.required && !formData[field.label]
    );

    if (requiredErrors.length > 0) {
      // Mettre à jour les champs d'erreur
      setErrorFields(requiredErrors.map(field => field.label));
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    try {
      const response = await axios.post('/api/registerData', formData);
      alert('Données envoyées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des données :', error);
    }
  };

  return (
    <div className="form-page">
      {/* Barre de navigation pour les paramètres */}
      <div className="navbar">
        {parameters.map((param, index) => (
          <div className="parameter-block" key={index}>
            <label className="field-label">{param.label}</label>
            <input
              type={param.type}
              className={`field-input ${errorFields.includes(param.label) ? 'error' : ''}`} // Ajout de la classe d'erreur
              placeholder={param.placeholder}
              name={param.label}
              value={formData[param.label]}
              onChange={handleChange}
              required={param.required}
            />
          </div>
        ))}
      </div>

      <h1>{location.state.formDescription.title}</h1>
      <p>{location.state.formDescription.description}</p>

      <div className="form-container">
        {/* Champs spécifiques au formulaire */}
        <form onSubmit={handleSubmit}>
          {formFields.map((field, index) => (
            <div className="field-block" key={index}>
              <label className="field-label">{field.label}</label>
              <span className="field-sublabel">{field.sublabel}</span>
              {field.type === 'range' ? (
                <div>
                  <input
                    type="range"
                    className={`field-input ${errorFields.includes(field.label) ? 'error' : ''}`} // Ajout de la classe d'erreur
                    name={field.label}
                    value={formData[field.label]}
                    onChange={handleChange}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required={field.required}
                  />
                  <span className="range-labels">
                    <span>{field.min}</span> <strong>{formData[field.label]}</strong> <span>{field.max}</span>
                  </span>
                </div>
              ) : (
                <input
                  type={field.type}
                  className={`field-input ${errorFields.includes(field.label) ? 'error' : ''}`} // Ajout de la classe d'erreur
                  placeholder={field.placeholder}
                  name={field.label}
                  value={formData[field.label]}
                  onChange={handleChange}
                  required={field.required}
                />
              )}
            </div>
          ))}
          <button type="submit">Envoyer</button>
        </form>
      </div>
    </div>
  );
};

export default Form;
