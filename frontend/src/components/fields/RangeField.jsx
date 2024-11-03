// components/fields/RangeField.jsx
import React from "react";
import Slider from '@mui/material/Slider';

const RangeField = ({ label, errors, value, min, max, step, onChange, required, isDisabled }) => {
  // Convertir min et max en nombres si possible, sinon utiliser une valeur par défaut
  const minValue = isNaN(parseFloat(min)) ? 0 : parseFloat(min);
  const maxValue = isNaN(parseFloat(max)) ? 100 : parseFloat(max);

  return (
    <div className="range-field">
      <label className="range-label">{label}</label>
      <Slider
        aria-label={label}
        value={value || (minValue+maxValue)/2} // Valeur par défaut au minimum si non définie
        valueLabelDisplay="auto"
        step={step || 1}
        marks
        min={minValue}
        max={maxValue}
        disabled={isDisabled}
        required={required}
        color={errors[label] ? "error" : (required ? "primary" : "secondary")}
        onChange={(event, newValue) => onChange({ target: { name: label, value: newValue } })}
      />
      <span className="range-labels">
        <span>{min}</span>
        <strong>{value}</strong>
        <span>{max}</span>
      </span>
    </div>
  );
};

export default RangeField;
