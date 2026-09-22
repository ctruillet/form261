import React, { useState, useEffect, useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const MultipleChoiceField = ({
  label,
  sublabel,
  errors = {},
  value,
  onChange,
  placeholder,
  options = [],
  required,
  isDisabled,
}) => {
  const [inputWidth, setInputWidth] = useState("auto");
  const longestOptionRef = useRef(null);

  const handleSelectChange = (_event, newValue) => {
    const nextVal = newValue === null ? '' : newValue;
    if (onChange) {
      onChange({ target: { name: label, value: nextVal } });
    }
  };

  useEffect(() => {
    // Calcul de la largeur du choix le plus long
    if (longestOptionRef.current) {
      setInputWidth(longestOptionRef.current.offsetWidth + 32); // 16px pour les marges intérieures
    }
  }, [options]);

  const longestText = (options || []).reduce(
    (longest, option) =>
      option && String(option).length > String(longest).length ? String(option) : longest,
    ''
  );

  return (
    <div>
      {/* Div invisible pour mesurer la largeur du choix le plus long */}
      <div
        style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap' }}
        ref={longestOptionRef}
      >
        {longestText}
      </div>

      <Autocomplete
        options={options || []}
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
            error={Boolean(errors?.[label])}
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
