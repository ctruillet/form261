// components/fields/TextField.jsx
import React from "react";
import TextField from "@mui/material/TextField";

const TextInputField = ({ label, sublabel, errors, value, onChange, placeholder, required, isDisabled }) => {

	return (
		<div>
			<TextField
				required={required}
				label={label}
				name={label}
				value={value}
				disabled={isDisabled}
				error={errors[label] ? true : false}
				defaultValue={placeholder}
				onChange={onChange}
				helperText={sublabel || " "}
				variant="standard"
			/>
		</div>
	);
};

export default TextInputField;
