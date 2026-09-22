import React from "react";
import TextField from "@mui/material/TextField";
import Box from '@mui/material/Box';

const TextAutosizeField = ({
  label,
  sublabel,
  minRows = 3,
  errors = {},
  value = "",
  onChange,
  placeholder,
  required,
  isDisabled,
}) => {
  return (
    <div>
      <Box sx={{ width: '100%' }}>
        <TextField
          fullWidth
          multiline
          rows={minRows}
          placeholder={placeholder || ""}
          required={required}
          label={label}
          name={label}
          value={value ?? ""}
          disabled={isDisabled}
          error={Boolean(errors?.[label])}
          onChange={onChange}
          helperText={sublabel || " "}
        />
      </Box>
    </div>
  );
};

export default TextAutosizeField;
