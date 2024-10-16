import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Form.css";

const Form = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [formData, setFormData] = useState({});
	const [formFields, setFormFields] = useState([]);
	const [parameters, setParameters] = useState([]);
	const [selectedParameter, setSelectedParameter] = useState(null);
	const [parameterFields, setParameterFields] = useState([]);
	const [errors, setErrors] = useState({});
	const [formTitle, setFormTitle] = useState(""); // Ajout pour le titre
	const [formDescription, setFormDescription] = useState(""); // Ajout pour la description

	useEffect(() => {
		// Récupérer le nom du formulaire à partir des paramètres de l'URL
		const queryParams = new URLSearchParams(location.search);
		const formName = queryParams.get("form");
		const param = queryParams.get("param");

		if (formName) {
			const fetchForm = async () => {
				try {
					const response = await axios.get(`/api/forms/${formName}`);
					setFormFields(response.data.fields || []);
					setFormTitle(response.data.title || ""); // Récupérer le titre à partir du champ name
					setFormDescription(response.data.description || "");

					// Remplir le formData initialement, si besoin
					const initialFormData = {};
					response.data.fields.forEach((field) => {
						initialFormData[field.label] = ""; // Initialisation avec une chaîne vide
					});
					setFormData(initialFormData);
				} catch (error) {
					console.error(
						"Erreur lors de la récupération du formulaire :",
						error
					);
				}
			};

			fetchForm();
		}

		if (param) {
			setSelectedParameter(param);
			fetchParameterFields(param); // Charger les champs de paramètres sélectionnés
		}
	}, [location.search]);

	const fetchParameterFields = async (param) => {
		try {
			const response = await axios.get(`/api/parameters/${param}`);
			setParameterFields(response.data.fields || []);

			// Conserver les valeurs existantes du formulaire
			const initialFormData = {};
			response.data.fields.forEach((field) => {
				initialFormData[field.label] = formData[field.label] || ""; // Conservez les valeurs existantes
			});
			setFormData((prevData) => ({
				...prevData,
				...initialFormData,
			}));
		} catch (error) {
			console.error(
				"Erreur lors de la récupération des données du paramètre :",
				error
			);
		}
	};

	useEffect(() => {
		const fetchParameters = async () => {
			try {
				const response = await axios.get("/api/parameters");
				setParameters(response.data);
			} catch (error) {
				console.error("Erreur lors de la récupération des paramètres :", error);
			}
		};

		fetchParameters();
	}, []);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		setErrors({
			...errors,
			[e.target.name]: "",
		});
	};

	const handleParameterSelect = (event) => {
		const param = event.target.value;
		setSelectedParameter(param);

		// Mettez à jour l'URL avec le nouveau paramètre
		navigate(
			`?form=${new URLSearchParams(location.search).get("form")}&param=${param}`
		);

		// Si un paramètre est sélectionné, récupérez ses champs
		if (param) {
			fetchParameterFields(param);
		} else {
			setParameterFields([]); // Réinitialiser les champs si aucun paramètre n'est sélectionné
		}
	};

	const validateForm = () => {
		const newErrors = {};
		parameterFields.forEach((field) => {
			if (field.required && !formData[field.label]) {
				newErrors[field.label] = `${field.label} est requis`;
			}
		});

		formFields.forEach((field) => {
			if (field.required && !formData[field.label]) {
				newErrors[field.label] = `${field.label} est requis`;
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) {
			alert("Veuillez remplir tous les champs requis.");
			return;
		}
		try {
			const response = await axios.post("/api/registerData", formData);
			alert("Données envoyées avec succès");
		} catch (error) {
			console.error("Erreur lors de l'envoi des données :", error);
		}
	};

	const renderField = (field) => (
		<div className="field-block" key={field.label}>
			<label className="field-label">{field.label}</label>
			<span className="field-sublabel">{field.sublabel}</span>
			{field.type === "range" ? (
				<div>
					<input
						type="range"
						className={`field-input ${errors[field.label] ? "error" : ""}`}
						name={field.label}
						value={
							formData[field.label] !== undefined ? formData[field.label] : ""
						}
						onChange={handleChange}
						min={field.min}
						max={field.max}
						step={field.step}
						required={field.required}
					/>
					<span className="range-labels">
						<strong>{field.min}</strong>{" "}
						<strong>
							{formData[field.label] !== undefined ? formData[field.label] : ""}
						</strong>{" "}
						<strong>{field.max}</strong>
					</span>
				</div>
			) : (
				<div>
					<input
						type={field.type}
						className={`field-input ${errors[field.label] ? "error" : ""}`}
						name={field.label}
						value={
							formData[field.label] !== undefined ? formData[field.label] : ""
						} // Utilisation d'une chaîne vide comme valeur par défaut
						onChange={handleChange}
						placeholder={errors[field.label] || ""} // Affiche l'erreur dans le placeholder
						required={field.required}
					/>
				</div>
			)}
		</div>
	);

	return (
		<div className="form-page">
			<div className="navbar">
				<select
					onChange={handleParameterSelect}
					value={selectedParameter || ""}>
					<option value="">-- Choisissez un fichier de paramètre --</option>
					{parameters.map((param, index) => (
						<option key={index} value={param.file}>
							{param.title}
						</option>
					))}
				</select>

				<div className="parameter-fields">
					{selectedParameter && <>{parameterFields.map(renderField)}</>}
				</div>
			</div>
			<h1>{formTitle}</h1> {/* Affiche le titre du formulaire */}
			<p>{formDescription}</p>
			<div className="form-container">
				<form onSubmit={handleSubmit}>
					{formFields.map(renderField)}
					<button type="submit">Soumettre</button>
				</form>
			</div>
		</div>
	);
};

export default Form;
