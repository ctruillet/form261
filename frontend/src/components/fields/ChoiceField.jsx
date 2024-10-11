import React from 'react';

const ChoiceField = ({ label, options = [], onChange }) => {
  return (
    <div>
      <label>{label}</label>
      <select onChange={(e) => onChange({ label, value: e.target.value })}>
        {options.length > 0 ? (
          options.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))
        ) : (
          <option value="">Aucune option disponible</option>
        )}
      </select>
    </div>
  );
};

export default ChoiceField;
