// components/fields/TextField.jsx
import React from "react";
import TextField from "@mui/material/TextField";

const Text = ({ label, sublabel, errors, value, onChange, placeholder, required, isDisabled }) => {

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
				helperText={sublabel}
				variant="standard"
			/>
			{/* <input
				type="text"
				className={`field-input ${errors[label] ? "error" : ""}`}
				name={label}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				disabled={isDisabled}
			/> */}

			<p></p>
		</div>
	);
};

export default Text;
