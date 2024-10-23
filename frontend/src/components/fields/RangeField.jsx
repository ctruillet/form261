// components/fields/RangeField.jsx
import React from "react";

const RangeField = ({ label, errors, value, min, max, step, onChange, required, isDisabled }) => {
  return (
    <div>
      <input
        type="range"
        className={`field-input ${errors[label] ? "error" : ""}`}
        name={label}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        required={required}
        disabled={isDisabled}
      />
      <span className="range-labels">
        {min}
        <strong>{value}</strong>
        {max}
      </span>
    </div>
    
  );
};

export default RangeField;
