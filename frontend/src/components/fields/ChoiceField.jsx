import React from 'react';

const ChoiceField = ({
  label,
  value,
  onChange,
  option,
  otherChoice,
  placeholder,
  required,
  isDisabled,
}) => {
  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === "other") {
      // Si "Autre" est sélectionné, effacer la sélection des autres options
      onChange({ target: { name: label, value: selectedValue } });
    } else {
      // Si une option standard est sélectionnée, effacer la valeur d'"Autre"
      onChange({ target: { name: label, value: selectedValue } });
    }
  };

  return (
    <div>
      {/* Afficher les boutons radio pour chaque option */}
      {option.map((opt, index) => (
        <div key={index}>
          <input
            type="radio"
            id={opt}
            name={label}
            value={opt}
            checked={value === opt}
            onChange={handleOptionChange}
            disabled={isDisabled}
          />
          <label htmlFor={opt}>{opt}</label>
        </div>
      ))}

      {/* Champ texte pour "Autre" */}
      {otherChoice && (
        <div>
          <input
            type="radio"
            id="other"
            name={label}
            value="other"
            checked={value === "other"}
            onChange={handleOptionChange}
            disabled={isDisabled}
          />
          {/* <label htmlFor="other">Autre</label> */}
          <input
            type="text"
            name="otherInput"
            placeholder={placeholder || "Autre"}
            required={required && value === "other"}
            disabled={isDisabled || value !== "other"}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
};

export default ChoiceField;
