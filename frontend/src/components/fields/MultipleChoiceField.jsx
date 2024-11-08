import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const MultipleChoiceField = ({ label, sublabel, errors, value, onChange, placeholder, options, required, isDisabled }) => {
  const handleSelectChange = (event, newValue) => {
    console.log('newValue:', newValue);
    if(newValue === null) {
      newValue = '';
    }
    onChange({ target: { name: label, value: newValue } });
  };

  return (
    <div>
      <Autocomplete
        options={options}
        value={value || null}
        onChange={handleSelectChange}
        disabled={isDisabled}
        autoWidth
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
            
          />
        )}
      />
    </div>
  );
};

export default MultipleChoiceField;
