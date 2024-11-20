import React, { useState, useEffect } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';

const ChoiceField = ({
  label,
  value,
  onChange,
  options,
  otherChoice,
  placeholder,
  required,
  isDisabled,
}) => {
  

  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  useEffect(() => {
    if (!options.includes(value) && value !== "") {
      setIsOtherSelected(true);
      setOtherValue(value);
    } else {
      setIsOtherSelected(false);
    }
  }, [value, options]);

  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === "other") {
      setIsOtherSelected(true);
      onChange({ target: { name: label, value: "" } });
      setOtherValue("");
    } else {
      setIsOtherSelected(false);
      onChange({ target: { name: label, value: selectedValue } });
      setOtherValue("");
    }
  };

  const handleOtherChange = (event) => {
    const newValue = event.target.value;
    setOtherValue(newValue);
    onChange({ target: { name: label, value: newValue } });
  };

  const handleOnClickOnOther = () => {
    setIsOtherSelected(true);
  }


    return (
    <div>
      <FormLabel component="legend" required={required}>
        {label}
      </FormLabel>
      
      <RadioGroup
        aria-label={label}
        name={label}
        value={isOtherSelected ? "other" : value}
        onChange={handleOptionChange}
      >
        {options.map((opt, index) => (
          <FormControlLabel
            key={index}
            value={opt}
            control={<Radio />}
            label={opt}
            disabled={isDisabled}
          />
        ))}

        {otherChoice && (
          <div style={{ display: 'flex', alignItems: 'left' }}>
            <FormControlLabel
              value="other"
              control={<Radio />}
              disabled={isDisabled}
            />
            <TextField
              placeholder={placeholder || "Autre"}
              value={otherValue}
              onClick={handleOnClickOnOther}
              onChange={handleOtherChange}
              required={required && otherValue !== ""}
              disabled={isDisabled}
              variant="standard"
            />
          </div>
        )}
      </RadioGroup>
    </div>
  );
};

export default ChoiceField;
