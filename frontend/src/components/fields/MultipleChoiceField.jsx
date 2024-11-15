import React, { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const MultipleChoiceField = ({ label, sublabel, errors, value, onChange, placeholder, options, required, isDisabled }) => {
  const [inputWidth, setInputWidth] = useState("auto");
  const longestOptionRef = useRef(null);

  const handleSelectChange = (event, newValue) => {
    if (newValue === null) {
      newValue = '';
    }
    onChange({ target: { name: label, value: newValue } });
  };

  useEffect(() => {
    // Calcul de la largeur du choix le plus long
    if (longestOptionRef.current) {
      setInputWidth(longestOptionRef.current.offsetWidth + 32); // 16px pour les marges intérieures
    }
  }, [options]);

  return (
    <div>
      {/* Div invisible pour mesurer la largeur du choix le plus long */}
      <div style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap' }} ref={longestOptionRef}>
        {options.reduce((longest, option) => option.length > longest.length ? option : longest, '')}
      </div>
      
      <Autocomplete
        options={options}
        value={value || null}
        onChange={handleSelectChange}
        disabled={isDisabled}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label={label} 
            placeholder={placeholder || "Choisir une option"} 
            disabled={isDisabled}
            required={required}
            error={!!errors[label]}
            helperText={sublabel || " "}
            variant="standard"
            style={{ minWidth: inputWidth }}
          />
        )}
      />
    </div>
  );
};

export default MultipleChoiceField;
