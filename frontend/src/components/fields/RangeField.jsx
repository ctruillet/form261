import React, { useState, useEffect } from "react";
import Slider from '@mui/material/Slider';
import FormLabel from '@mui/material/FormLabel';

const RangeField = ({ label, sublabel, errors, value, min, max, labelMin, labelMax, step, onChange, required, isDisabled }) => {
  const [isRangeModified, setIsRangeModified] = useState(false);

  
  const defaultCenterValue = Math.round((min + max) / 2);

  if (!isRangeModified && value === undefined) {
    value = Math.round((min + max) / 2);
  }

  return (
    <div className="range-field">
      <FormLabel component="legend" required={required}>
        <strong>{label}</strong>
      </FormLabel>
      <FormLabel component="legend">
        {sublabel}
      </FormLabel>
      <Slider
        aria-label={label}
        value={value} // Utilise la valeur au centre par défaut si aucune valeur n'est définie
        defaultValue={defaultCenterValue}
        valueLabelDisplay="auto"
        step={step || 1}
        marks
        min={min}
        max={max}
        disabled={isDisabled}
        color={errors[label] ? "error" : (required ? "primary" : "secondary")}
        onChange={(event, newValue) => { setIsRangeModified(true); onChange({ target: { name: label, value: newValue } }); }}
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
