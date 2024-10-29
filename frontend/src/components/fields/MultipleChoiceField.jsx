import React, { useState } from 'react';

const MultipleChoiceField = ({
  label,
  value,
  onChange,
  placeholder,
  options,
  required,
  isDisabled,
}) => {
  const handleSelectChange = (event) => {
    const selectedValue = event.target.value;

    onChange({ target: { name: label, value: selectedValue } });
  };

  placeholder = placeholder || "Choisir une option";


  return (
    <div>
      <select
        id={label}
        name={label}
        value={value}
        onChange={handleSelectChange}
        disabled={isDisabled}
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options}
        {options.map((opt, index) => (
          <option key={index} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MultipleChoiceField;
