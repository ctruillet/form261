// components/fields/TextField.jsx
import React from "react";
import TextField from "@mui/material/TextField";
import { Alert } from "@mui/material";
import { AlertTitle } from "@mui/material";

const InformationField = ({ label, sublabel}) => {

	return (
		<div>
            <Alert severity="info">
                <AlertTitle>{label}</AlertTitle>
                {sublabel}
            </Alert>
			{/* <TextField
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
			/> */}
		</div>
	);
};

export default InformationField;
