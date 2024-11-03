import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import "../styles/Form.css";
import RankingField from "../components/fields/RankingField";
import RangeField from "../components/fields/RangeField";
import TextInputField from "../components/fields/TextInputField";
import ChoiceField from "../components/fields/ChoiceField";
import MultipleChoiceField from "../components/fields/MultipleChoiceField";

const Form = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [fieldsFields, setFieldsFields] = useState([]);
  const [paramFields, setParametersFields] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterFields, setParameterFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [formTitle, setFormTitle] = useState("");
  const [formID, setFormID] = useState();
  const [fieldsDescription, setFormDescription] = useState("");
  const [popup, setPopup] = React.useState({
    message: "",
    severity: "",
    open: false,
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = queryParams.get("param");

    const urlValues = {};
    queryParams.forEach((value, key) => {
      if (key !== "fields" && key !== "param") {
        urlValues[key] = value;
      }
    });

    if (fieldsName) {
      const fetchForm = async () => {
        try {
          const response = await axios.get(`/api/fields/${fieldsName}`);
          setFieldsFields(response.data.fields || []);
          setFormDescription(response.data.description || "");

          const initialFormData = {};
          response.data.fields.forEach((field) => {
            initialFormData[field.label] = urlValues[field.label] || "";
          });
          setFormData(initialFormData);
        } catch (error) {
          console.error("Erreur lors de la récupération du field :", error);
        }

        try {
          const response = await axios.get(`/api/forms/fields=${fieldsName}&param=${param}`);
          console.log(response.data)
          console.log(response.data.id)
          setFormTitle(response.data.name || "");
          setFormID(response.data.id);
        } catch (error) {
          console.error("Erreur lors de la récupération du form :", error);
        }
      };

      fetchForm();
    }

    if (param) {
      setSelectedParameter(param);
      fetchParameterFields(param, urlValues);
    }
  }, [location.search]);

  const fetchParameterFields = async (param, urlValues) => {
    try {
      const response = await axios.get(`/api/parameters/${param}`);
      setParameterFields(response.data.fields || []);

      const initialFormData = {};
      response.data.fields.forEach((field) => {
        initialFormData[field.label] = urlValues[field.label] || formData[field.label] || "";
      });
      setFormData((prevData) => ({
        ...prevData,
        ...initialFormData,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des données du paramètre :", error);
    }
  };

  useEffect(() => {
    const fetchParameters = async () => {
      try {
        const response = await axios.get("/api/parameters");
        setParametersFields(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des paramètres :", error);
      }
    };

    fetchParameters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((formData) => ({
      ...formData,
      [name]: value,
    }));

    setErrors((errors) => ({
      ...errors,
      [name]: value !== "" ? "" : `${name} est requis`,
    }));
  };

  const handleRankingChange = ({ label, rankings }) => {
    setFormData({
      ...formData,
      [label]: rankings, // Classement sous forme de dictionnaire {option: ranking}
    });
    // setErrors({
    //   ...errors,
    //   [label]: "",
    // });
  };

  const handleParameterSelect = (event) => {
    const param = event.target.value;
    setSelectedParameter(param);
    navigate(`?fields=${new URLSearchParams(location.search).get("fields")}&param=${param}`);

    if (param) {
      fetchParameterFields(param);
    } else {
      setParameterFields([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    parameterFields.forEach((field) => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = `${field.label} est requis`;
      }
    });

    fieldsFields.forEach((field) => {
      if (field.required && !formData[field.label]) {
        newErrors[field.label] = `${field.label} est requis`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePopupOpen = (message, severity) => {
    setPopup({ 
      message, 
      severity, 
      open: true 
    });
  };

  const handlePopupClose = () => {
    setPopup((prev) => ({ 
      ...prev, 
      open: false 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = queryParams.get("param");

    const completeFormData = {
      name: formTitle,
      formID: formID,
      fieldsFile: fieldsName,
      paramFile: param,
      parametersFields: {},
      fieldsFields: {},
    };

    fieldsFields.forEach((field) => {
      completeFormData.fieldsFields[field.label] = formData[field.label];
    });

    parameterFields.forEach((field) => {
      completeFormData.parametersFields[field.label] = formData[field.label];
    });

    console.log(completeFormData)

    if (!validateForm()) {
      handlePopupOpen("Veuillez remplir tous les champs requis", "error");
      // <Alert severity="error">Veuillez remplir tous les champs requis</Alert>
      // alert("Veuillez remplir tous les champs requis.");
      return;
    }

    try {
      const response = await axios.post("/api/data/registerData", completeFormData);
      handlePopupOpen("Données envoyées avec succès", "success");
      // <Alert severity="success">Données envoyées avec succès</Alert>
      // alert("Données envoyées avec succès");
    } catch (error) {
      handlePopupOpen("Erreur lors de l'envoi des données", "error");
      // <Alert severity="error">Erreur lors de l'envoi des données : ${error}</Alert>
      // console.error("Erreur lors de l'envoi des données :", error);
    }
  };

  const renderField = (field) => {
    const isParameterField = parameterFields.some((paramField) => paramField.label === field.label);
    const isDisabled = isParameterField && new URLSearchParams(location.search).has(field.label);

    return (
      <div className={`field-block ${errors[field.label] ? "error" : ""}`} key={field.label}>
        {/* Étiquette et sous-étiquette */}
        {/* <label className={`field-label ${errors[field.label] ? "error" : ""}`}>{field.label}</label> */}
        {/* {field.sublabel && <span className="field-sublabel">{field.sublabel}</span>} */}

        {/* Affichage conditionnel selon le type de champ */}
        {field.type === "range" && (
          <RangeField
            label={field.label}
            errors={errors}
            value={formData[field.label] || ""}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={handleChange}
            required={field.required}
            isDisabled={isDisabled}
          />
        )}

        {field.type === "ranking" && (
          <RankingField
            label={field.label}
            options={field.options || []}
            onChange={handleRankingChange}
          />
        )}

        {field.type === "text" && (
          <TextInputField
            label={field.label}
            sublabel={field.sublabel}
            errors={errors}
            onChange={handleChange}
            placeholder={errors[field.label] || ""}
            required={field.required}
            isDisabled={isDisabled}
          />
        )}

        {field.type === "choice" && (
          <ChoiceField
            label={field.label}
            value={formData[field.label] || ""}
            onChange={handleChange}
            option={field.options || []}
            otherChoice={field.otherChoice}
            placeholder={errors[field.label] || ""}
            required={field.required}
            isDisabled={isDisabled}
          />
        )}

        {field.type === "drop-down" && (
          <MultipleChoiceField
            label={field.label}
            sublabel={field.sublabel}
            value={formData[field.label] || ""}
            onChange={handleChange}
            placeholder={field.placeholder || ""}
            options={field.options || []}
            required={field.required}
            isDisabled={isDisabled}
          />
        )}


        {/* Champ générique pour les autres types */}
        {!["range", "ranking", "text", "choice", "drop-down"].includes(field.type) && (
          <div>
            <input
              type={field.type}
              className={`field-input ${errors[field.label] ? "error" : ""}`}
              name={field.label}
              value={formData[field.label] || ""}
              onChange={handleChange}
              placeholder={errors[field.label] || ""}
              required={field.required}
              disabled={isDisabled}
            />
          </div>
        )}
      </div>
    );

  };

  return (
    <div className="fields-page">
      <div className="navbar">
        {/* <select onChange={handleParameterSelect} value={selectedParameter || ""}>
          <option value="">-- Choisissez un fichier de paramètre --</option>
          {parameters.map((param, index) => (
            <option key={index} value={param.file}>
              {param.title}
            </option>
          ))}
        </select> */}

        <div className="parameter-fields">
          {selectedParameter && <>{parameterFields.map(renderField)}</>}
        </div>
      </div>
      <h1>{formTitle}</h1>
      <p>{fieldsDescription}</p>
      <div className="fields-container">
        <form onSubmit={handleSubmit}>
          {fieldsFields.map(renderField)}
          <button type="submit">Soumettre</button>
        </form>
      </div>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={popup.open}
        autoHideDuration={6000}
        onClose={handlePopupClose}
      >
        <Alert onClose={handlePopupClose} severity={popup.severity} sx={{ width: '100%' }}>
          {popup.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Form;
