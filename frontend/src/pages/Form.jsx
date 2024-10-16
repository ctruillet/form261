import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Form.css';

const Form = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({});
  const [formFields, setFormFields] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterFields, setParameterFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [formTitle, setFormTitle] = useState(''); // Ajout pour le titre
  const [formDescription, setFormDescription] = useState(''); // Ajout pour le titre

  useEffect(() => {
    // Récupérer le nom du formulaire à partir des paramètres de l'URL
    const queryParams = new URLSearchParams(location.search);
    const formName = queryParams.get('form');

    if (formName) {
      const fetchForm = async () => {
        try {
          const response = await axios.get(`/api/forms/${formName}`);
          setFormFields(response.data.fields || []);
          setFormTitle(response.data.title || ''); // Récupérer le titre à partir du champ name
          setFormDescription(response.data.description || '')
          
          // Remplir le formData initialement, si besoin
          const initialFormData = {};
          response.data.fields.forEach(field => {
            initialFormData[field.label] = '';
          });
          setFormData(initialFormData);
        } catch (error) {
          console.error('Erreur lors de la récupération du formulaire :', error);
        }
      };

      fetchForm();
    }
  }, [location.search]);

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await axios.get('/api/parameters'); 
        setParameters(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres :', error);
      }
    };

    fetchParameters();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: '',
    });
  };

  const handleParameterSelect = async (event) => {
    const param = event.target.value;
    setSelectedParameter(param);
    
    try {
      const response = await axios.get(`/api/parameters/${param}`);
      setParameterFields(response.data.fields || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des données du paramètre :', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    parameterFields.forEach(field => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = `${field.label} est requis`;
      }
    });

    formFields.forEach(field => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = `${field.label} est requis`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
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
      <div className="navbar">
        <select onChange={handleParameterSelect} value={selectedParameter || ''}>
          <option value="">-- Choisissez un fichier de paramètre --</option>
          {parameters.map((param, index) => (
            <option key={index} value={param.file}>
              {param.title}
            </option>
          ))}
        </select>

        <div className="parameter-fields">
          {selectedParameter && (
            <>
              {parameterFields.map((field, index) => (
                <div className="field-block" key={index}>
                  <label className="field-label">{field.label}</label>
                  
                  {field.type === 'range' ? (
                    <div>
                      <input
                        type="range"
                        className={`field-input ${errors[field.label] ? 'error' : ''}`} 
                        name={field.label}
                        value={formData[field.label]}
                        onChange={handleChange}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                      />
                      <span className="range-labels">
                        {field.min} <strong>{formData[field.label]}</strong> {field.max}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <input
                        type={field.type}
                        className={`field-input ${errors[field.label] ? 'error' : ''}`}
                        name={field.label}
                        value={formData[field.label]}
                        onChange={handleChange}
                        placeholder={errors[field.label] || ''} // Affiche l'erreur dans le placeholder
                        required={field.required}
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <h1>{formTitle}</h1> {/* Affiche le titre du formulaire */}
      <p> {formDescription}</p>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {formFields.map((field, index) => (
            <div className="field-block" key={index}>
              <label className="field-label">{field.label}</label>
              <span className="field-sublabel">{field.sublabel}</span>
              {field.type === 'range' ? (
                <div>
                  <input
                    type="range"
                    className={`field-input ${errors[field.label] ? 'error' : ''}`}
                    name={field.label}
                    value={formData[field.label]}
                    onChange={handleChange}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required={field.required}
                  />
                  <span className="range-labels">
                    <strong>{field.min}</strong> <strong>{formData[field.label]}</strong> <strong>{field.max}</strong>
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type={field.type}
                    className={`field-input ${errors[field.label] ? 'error' : ''}`}
                    name={field.label}
                    value={formData[field.label]}
                    onChange={handleChange}
                    placeholder={errors[field.label] || ''} // Affiche l'erreur dans le placeholder
                    required={field.required}
                  />
                </div>
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
