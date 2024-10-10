import React from 'react';

const ChoiceField = ({ label, options = [], onChange }) => {
  return (
    <div>
      <label>{label}</label>
      <select onChange={(e) => onChange({ label, value: e.target.value })}>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChoiceField;
