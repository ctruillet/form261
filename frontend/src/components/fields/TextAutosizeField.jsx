// components/fields/TextField.jsx
import React from "react";
// import { TextareaAutosize } from '@mui/base/TextareaAutosize';
import FormLabel from '@mui/material/FormLabel';
import TextField from "@mui/material/TextField";
import Box from '@mui/material/Box';

const TextAutosizeField = ({ label, sublabel, minRows, errors, value, onChange, placeholder, required, isDisabled }) => {

	return (
		<div>
			<Box
				component="form"
				noValidate
				autoComplete="on"
			>
				<TextField
					multiline
					rows={minRows}
					placeholder={placeholder}
					required={required}
					label={label}
					name={label}
					value={value}
					disabled={isDisabled}
					error={errors[label] ? true : false}
					defaultValue={placeholder}
					onChange={onChange}
					helperText={sublabel || " "}
					// variant="standard"
				/>
			</Box>
		</div>
	);
};

export default TextAutosizeField;
