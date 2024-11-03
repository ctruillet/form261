// components/fields/RangeField.jsx
import React from "react";
import Slider from '@mui/material/Slider';
import FormLabel from '@mui/material/FormLabel';

const RangeField = ({ label, errors, value, min, max, labelMin, labelMax, step, onChange, required, isDisabled }) => {
  // Convertir min et max en nombres si possible, sinon utiliser une valeur par défaut
  // const min = isNaN(parseFloat(min)) ? 0 : parseFloat(min);
  // const max = isNaN(parseFloat(max)) ? 100 : parseFloat(max);

  return (
    <div className="range-field">
      <FormLabel component="legend" required={required}>
        {label}
      </FormLabel>
      <Slider
        aria-label={label}
        value={value || min} // Valeur par défaut au minimum si non définie
        valueLabelDisplay="auto"
        step={step || 1}
        marks
        min={min}
        max={max}
        disabled={isDisabled}
        required={required}
        color={errors[label] ? "error" : (required ? "primary" : "secondary")}
        onChange={(event, newValue) => onChange({ target: { name: label, value: newValue } })}
      />
      <span className="range-labels">
        <span>{labelMin}</span>
        <strong>{value}</strong>
        <span>{labelMax}</span>
      </span>
    </div>
  );
};

export default RangeField;
