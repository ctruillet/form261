// components/fields/TextField.jsx
import React from "react";

const TextField = ({ label, errors, value, onChange, placeholder, required, isDisabled}) => {
	return (
		<div>
			<input
				type="text"
				className={`field-input ${errors[label] ? "error" : ""}`}
				name={label}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required={required}
				disabled={isDisabled}
			/>
		</div>
	);
};

export default TextField;
