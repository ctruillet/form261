import React, { useState } from 'react';
import FieldManager from '../components/FieldManager';
import '../styles/CreateForm.css'; // Ajout d'un fichier CSS pour styliser le formulaire

const CreateForm = () => {
  const [fields, setFields] = useState([]);

  const addField = () => {
    const newField = { type: 'text', label: '', id: Date.now() }; // exemple de champ par défaut avec un id unique
    setFields((prevFields) => [...prevFields, newField]);
  };

  const removeField = (index) => {
    setFields((prevFields) => prevFields.filter((_, i) => i !== index));
  };

  const updateField = (index, updatedField) => {
    console.log("Updating field:", updatedField); // Debug
    setFields((prevFields) => 
      prevFields.map((field, i) => (i === index ? updatedField : field))
    );
  };
  

  return (
    <div>
      <h1>Créer un nouveau formulaire</h1>
      <FieldManager
        fields={fields}
        addField={addField}
        removeField={removeField}
        updateField={updateField}
      />
    </div>
  );
};

export default CreateForm;