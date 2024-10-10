import React from 'react';

const MultipleChoiceField = ({ label, options = [], onChange }) => {
  const handleChange = (option) => {
    // Logic to handle multiple selections
    onChange((prev) => {
      const newValue = prev.value.includes(option)
        ? prev.value.filter((v) => v !== option) // Remove if already selected
        : [...prev.value, option]; // Add if not selected
      return { ...prev, value: newValue };
    });
  };

  return (
    <div>
      <label>{label}</label>
      {options.map((option, index) => (
        <div key={index}>
          <input
            type="checkbox"
            value={option}
            onChange={() => handleChange(option)}
          />
          {option}
        </div>
      ))}
    </div>
  );
};

export default MultipleChoiceField;
