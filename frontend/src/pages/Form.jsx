import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Form.css";
import RankingField from "../components/fields/RankingField";
import RangeField from "../components/fields/RangeField";
import TextField from "../components/fields/TextField";

const Form = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldsData, setFormData] = useState({});
  const [fieldsFields, setFormFields] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterFields, setParameterFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [fieldsTitle, setFormTitle] = useState("");
  const [fieldsDescription, setFormDescription] = useState("");

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
          setFormFields(response.data.fields || []);
          setFormTitle(response.data.title || "");
          setFormDescription(response.data.description || "");

          const initialFormData = {};
          response.data.fields.forEach((field) => {
            initialFormData[field.label] = urlValues[field.label] || "";
          });
          setFormData(initialFormData);
        } catch (error) {
          console.error("Erreur lors de la récupération du field :", error);
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
        initialFormData[field.label] = urlValues[field.label] || fieldsData[field.label] || "";
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
        setParameters(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des paramètres :", error);
      }
    };

    fetchParameters();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...fieldsData,
      [e.target.name]: e.target.value,
    });
    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleRankingChange = ({ label, rankings }) => {
    setFormData({
      ...fieldsData,
      [label]: rankings, // Classement sous fieldse de dictionnaire {option: ranking}
    });
    setErrors({
      ...errors,
      [label]: "",
    });
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
      if (field.required && !fieldsData[field.label]) {
        newErrors[field.label] = `${field.label} est requis`;
      }
    });

    fieldsFields.forEach((field) => {
      if (field.required && !fieldsData[field.label]) {
        newErrors[field.label] = `${field.label} est requis`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = queryParams.get("param");

    const completeFormData = {
      fields: fieldsName,
      param: param,
      parameters: {},
      fieldsFields: {},
    };

    console.log(completeFormData)

    fieldsFields.forEach((field) => {
      completeFormData.fieldsFields[field.label] = fieldsData[field.label];
    });

    parameterFields.forEach((field) => {
      completeFormData.parameters[field.label] = fieldsData[field.label];
    });

    if (!validateForm()) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }

    try {
      const response = await axios.post("/api/data/registerData", completeFormData);
      alert("Données envoyées avec succès");
    } catch (error) {
      console.error("Erreur lors de l'envoi des données :", error);
    }
  };

  const renderField = (field) => {
    const isParameterField = parameterFields.some((paramField) => paramField.label === field.label);
    const isDisabled = isParameterField && new URLSearchParams(location.search).has(field.label);

    return (
      <div className="field-block" key={field.label}>
        <label className="field-label">{field.label}</label>
        <span className="field-sublabel">{field.sublabel}</span>
        {field.type === "range" ? (
          <RangeField
            label={field.label}
            errors={errors}
            value={fieldsData[field.label] !== undefined ? fieldsData[field.label] : ""}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={handleChange}
            required={field.required}
            isDisabled={isDisabled}
          />
        ) : field.type === "ranking" ? (
          <RankingField
            label={field.label}
            options={field.options || []}
            onChange={handleRankingChange}
          />
        ) : field.type === "text" ? (
          <TextField
            label={field.label}
            errors={errors}
            value={fieldsData[field.label] !== undefined ? fieldsData[field.label] : ""}
            onChange={handleChange}
            placeholder={errors[field.label] || ""}
            required={field.required}
            isDisabled={isDisabled}
          />
        ) : (
          <div>
            <input
              type={field.type}
              className={`field-input ${errors[field.label] ? "error" : ""}`}
              name={field.label}
              value={fieldsData[field.label] !== undefined ? fieldsData[field.label] : ""}
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
      <h1>{fieldsTitle}</h1>
      <p>{fieldsDescription}</p>
      <div className="fields-container">
        <form onSubmit={handleSubmit}>
          {fieldsFields.map(renderField)}
          <button type="submit">Soumettre</button>
        </form>
      </div>
    </div>
  );
};

export default Form;
