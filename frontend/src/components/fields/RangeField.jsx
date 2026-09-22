import React, { useState, useEffect } from "react";
import Slider from "@mui/material/Slider";
import FormLabel from "@mui/material/FormLabel";

const RangeField = ({
  label,
  sublabel,
  errors = {},
  value,
  min = 0,
  max = 100,
  labelMin,
  labelMax,
  step = 1,
  onChange,
  required = false,
  isDisabled = false,
}) => {
  const defaultCenterValue = Math.round((min + max) / 2);
  const initialValue =
    value !== undefined && value !== null && value !== ""
      ? Number(value)
      : defaultCenterValue;

  const [currentValue, setCurrentValue] = useState(initialValue);

  useEffect(() => {
    if (value !== undefined && value !== null && value !== "") {
      setCurrentValue(Number(value));
    }
  }, [value]);

  const handleSliderChange = (_event, newValue) => {
    setCurrentValue(newValue);
    if (onChange) {
      onChange({ target: { name: label, value: newValue } });
    }
  };

  return (
    <div className="range-field">
      <FormLabel component="legend" required={required}>
        <strong>{label}</strong>
      </FormLabel>
      {sublabel && <FormLabel component="legend">{sublabel}</FormLabel>}
      <Slider
        aria-label={label}
        value={currentValue}
        valueLabelDisplay="auto"
        step={step}
        marks
        min={min}
        max={max}
        disabled={isDisabled}
        color={errors?.[label] ? "error" : required ? "primary" : "secondary"}
        onChange={handleSliderChange}
      />
      <span className="range-labels">
        <span>{labelMin}</span>
        <strong>{currentValue}</strong>
        <span>{labelMax}</span>
      </span>
    </div>
  );
};

export default RangeField;
