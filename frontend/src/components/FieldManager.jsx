import React from 'react';
import LikertScaleField from './fields/LikertScaleField';
import ChoiceField from './fields/ChoiceField';
import MultipleChoiceField from './fields/MultipleChoiceField';
import TextField from './fields/TextField';
import RangeField from './fields/RangeField';
import RankingField from './fields/RankingField';
import '../styles/FieldManager.css'; // Importation du style

const FieldManager = ({ fields, addField, removeField, updateField }) => {
  const handleTypeChange = (index, newType) => {
    const updatedField = { ...fields[index], type: newType };
    
    // Ajouter des options par défaut si le type change vers choix ou multiple
    if (newType === 'choice' || newType === 'multiple') {
      updatedField.options = updatedField.options || ['Option 1', 'Option 2']; // Par défaut
    }
    
    updateField(index, updatedField);
  };

  return (
    <div className="field-manager">
      {fields.map((field, index) => (
        <div key={index} className="field-item">
          <div className="field-header">
            <select
              value={field.type}
              onChange={(e) => handleTypeChange(index, e.target.value)}
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
            <LikertScaleField
            {...field}
            onChange={(updatedField) => updateField(index, { ...field, ...updatedField })} />
          )}
          {field.type === 'choice' && (
            <ChoiceField
              label={field.label}
              options={field.options || []} // Options par défaut
              onChange={(updatedField) => updateField(index, { ...field, ...updatedField })}
            />
          )}
          {field.type === 'multiple' && (
            <MultipleChoiceField
              label={field.label}
              options={field.options || []} // Options par défaut
              onChange={(updatedField) => updateField(index, { ...field, ...updatedField })}
            />
          )}
          {field.type === 'text' && (
            <TextField
            {...field}
            onChange={(updatedField) => updateField(index, { ...field, ...updatedField })}
          />
          
          )}
          {field.type === 'range' && (
            <RangeField
            {...field} 
            onChange={(updatedField) => updateField(index, { ...field, ...updatedField })} />
          )}
        </div>
      ))}

      {/* Ajouter un champ si aucun n'existe */}
      {fields.length === 0 && (
        <button className="add-button" onClick={addField}>+ Ajouter un champ</button>
      )}

      {/* Option d'ajout de nouveau champ */}
      {fields.length > 0 && (
        <button className="add-button" onClick={addField}>+ Ajouter un champ</button>
      )}
    </div>
  );
};

export default FieldManager;
