import React from 'react';

const MultipleChoiceField = ({ label, options = [], onChange }) => {
  const handleChange = (option) => {
    onChange((prev) => {
      const newValue = prev.value.includes(option)
        ? prev.value.filter((v) => v !== option) // Supprimer si déjà sélectionné
        : [...prev.value, option]; // Ajouter si non sélectionné
      return { ...prev, value: newValue };
    });
  };

  return (
    <div>
      <label>{label}</label>
      {options.length > 0 ? (
        options.map((option, index) => (
          <div key={index}>
            <input
              type="checkbox"
              value={option}
              onChange={() => handleChange(option)}
            />
            {option}
          </div>
        ))
      ) : (
        <p>Aucune option disponible</p>
      )}
    </div>
  );
};

export default MultipleChoiceField;
