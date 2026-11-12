import React, { useState, useEffect } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';

const ChoiceField = ({
  label,
  value,
  onChange,
  options = [],
  otherChoice,
  placeholder,
  required,
  isDisabled,
}) => {
  

  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  // Synchronise l'état « Autre » avec la valeur reçue (chargement d'une réponse existante, remise à zéro...).
  // Une valeur vide ne désélectionne pas « Autre » : l'utilisateur vient peut-être de cocher la case
  // et n'a pas encore saisi son texte.
  useEffect(() => {
    const hasValue = value !== undefined && value !== null && value !== "";
    if (hasValue && !options.includes(value)) {
      setIsOtherSelected(true);
      setOtherValue(String(value));
    } else if (hasValue) {
      setIsOtherSelected(false);
      setOtherValue("");
    } else if (value === undefined || value === null) {
      setIsOtherSelected(false);
      setOtherValue("");
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
    if (isDisabled || isOtherSelected) return;
    setIsOtherSelected(true);
    // Une option prédéfinie était peut-être cochée : la réponse devient le texte libre
    onChange({ target: { name: label, value: otherValue } });
  }


    return (
    <div>
      <FormLabel component="legend" required={required}>
        {label}
      </FormLabel>
      
      <RadioGroup
        aria-label={label}
        name={label}
        value={isOtherSelected ? "other" : (value ?? "")}
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
