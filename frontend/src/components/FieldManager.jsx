import React from 'react';
import LikertScaleField from './fields/LikertScaleField';
import ChoiceField from './fields/ChoiceField';
import MultipleChoiceField from './fields/MultipleChoiceField';
import TextField from './fields/TextField';
import RangeField from './fields/RangeField';
import '../styles/FieldManager.css'; // Importation du style

const FieldManager = ({ fields, addField, removeField, updateField }) => {
  return (
    <div className="field-manager">
      {fields.map((field, index) => (
        <div key={index} className="field-item">
          <div className="field-header">
            <select
              value={field.type}
              onChange={(e) => {
                const newType = e.target.value;
                const updatedField = { ...field, type: newType }; // Mise à jour du type
                updateField(index, updatedField);
              }}
            >
              <option value="text">Champ de texte</option>
              <option value="choice">Choix unique</option>
              <option value="multiple">Choix multiple</option>
              <option value="likert">Échelle de Likert</option>
              <option value="range">Plage</option>
            </select>
            <button className="delete-button" onClick={() => removeField(index)}>🗑️</button>
          </div>

          {/* Affichage dynamique en fonction du type de champ */}
          {field.type === 'likert' && (
            <LikertScaleField {...field} onChange={(updatedField) => updateField(index, updatedField)} />
          )}
          {field.type === 'choice' && (
            <ChoiceField {...field} onChange={(updatedField) => updateField(index, updatedField)} />
          )}
          {field.type === 'multiple' && (
            <MultipleChoiceField {...field} onChange={(updatedField) => updateField(index, updatedField)} />
          )}
          {field.type === 'text' && (
            <TextField {...field} onChange={(updatedField) => updateField(index, updatedField)} />
          )}
          {field.type === 'range' && (
            <RangeField {...field} onChange={(updatedField) => updateField(index, updatedField)} />
          )}
        </div>
      ))}

      {/* Afficher le bouton Ajouter si aucun champ n'existe */}
      {fields.length === 0 && (
        <button className="add-button" onClick={addField}>+ Ajouter un champ</button>
      )}
      
      {/* Option d'ajout de nouveau champ lorsque des champs existent */}
      {fields.length > 0 && (
        <button className="add-button" onClick={addField}>+ Ajouter un champ</button>
      )}
    </div>
  );
};

export default FieldManager;
