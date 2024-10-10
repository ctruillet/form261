import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateForm.css'; // Un fichier CSS pour styliser le formulaire

const CreateForm = () => {
  const [formName, setFormName] = useState('');
  const [fields, setFields] = useState([]);
  const [fieldType, setFieldType] = useState('text');
  const navigate = useNavigate();

  // Ajouter un champ au formulaire
  const addField = () => {
    setFields([...fields, { type: fieldType, label: '' }]);
  };

  // Mettre à jour l'étiquette d'un champ
  const updateFieldLabel = (index, label) => {
    const updatedFields = [...fields];
    updatedFields[index].label = label;
    setFields(updatedFields);
  };

  // Soumettre le formulaire personnalisé au backend
  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = { name: formName, fields };

    try {
      // Envoyer le formulaire au backend pour le sauvegarder
      const response = await axios.post('/api/save-form', form);
      
      // Rediriger vers la page form avec le formulaire nouvellement créé
      navigate('/form', { state: { formDescription: response.data } });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du formulaire :', error);
    }
  };

  return (
    <div className="create-form-container">
      <h1>Créer un nouveau formulaire</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nom du formulaire:
          <input 
            type="text" 
            value={formName} 
            onChange={(e) => setFormName(e.target.value)} 
            required 
          />
        </label>

        <div className="form-fields">
          <h2>Champs du formulaire</h2>
          {fields.map((field, index) => (
            <div key={index} className="form-field">
              <label>
                Type de champ : {field.type}
              </label>
              <input 
                type="text" 
                placeholder="Label du champ"
                value={field.label} 
                onChange={(e) => updateFieldLabel(index, e.target.value)} 
                required
              />
            </div>
          ))}
        </div>

        <div className="add-field">
          <label>
            Type de champ:
            <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
              <option value="text">Texte</option>
              <option value="radio">Bouton radio</option>
              <option value="checkbox">Checkbox</option>
              <option value="textarea">Zone de texte</option>
            </select>
          </label>
          <button type="button" onClick={addField}>Ajouter un champ</button>
        </div>

        <button type="submit">Sauvegarder le formulaire</button>
      </form>
    </div>
  );
};

export default CreateForm;
