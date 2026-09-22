import React, { useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';

import RankingField from "../components/fields/RankingField";
import RangeField from "../components/fields/RangeField";
import TextInputField from "../components/fields/TextInputField";
import ChoiceField from "../components/fields/ChoiceField";
import MultipleChoiceField from "../components/fields/MultipleChoiceField";
import InformationField from "../components/fields/InformationField";
import ImageField from "../components/fields/ImageField";
import TextAutosizeField from "../components/fields/TextAutosizeField";
import { ParticipantContext } from '../context/ParticipantContext';

import "../styles/Form.css";

const Form = () => {
  const { participantData } = useContext(ParticipantContext);
  const location = useLocation();
  const [formData, setFormData] = useState({});
  const [fieldsFields, setFieldsFields] = useState([]);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [parameterFields, setParameterFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [formTitle, setFormTitle] = useState("");
  const [formID, setFormID] = useState();
  const [fieldsDescription, setFormDescription] = useState("");
  const [popup, setPopup] = useState({
    message: "",
    severity: "info",
    open: false,
  });

  const [dataID, setDataID] = useState(undefined);

  const fetchParameterFields = useCallback(async (param, urlValues = {}) => {
    try {
      const response = await axios.get(`/api/parameters/${param}`);
      const fields = response.data.fields || [];
      setParameterFields(fields);

      const initialFormData = {};
      fields.forEach((field) => {
        initialFormData[field.label] =
          urlValues[field.label] ||
          participantData?.[field.label] ||
          "";
      });
      setFormData((prevData) => ({
        ...initialFormData,
        ...prevData,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des données du paramètre :", error);
    }
  }, [participantData]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = queryParams.get("param");
    const id = queryParams.get("id");

    const urlValues = {};
    queryParams.forEach((value, key) => {
      if (key !== "fields" && key !== "param" && key !== "id") {
        urlValues[key] = value;
      }
    });

    if (fieldsName) {
      const fetchForm = async () => {
        try {
          const response = await axios.get(`/api/fields/${fieldsName}`);
          const fields = response.data.fields || [];
          setFieldsFields(fields);
          setFormDescription(response.data.description || "");

          const initialFormData = {};
          fields.forEach((field) => {
            if (field.type === "range") {
              const defaultRange = Math.round(((field.min ?? 0) + (field.max ?? 100)) / 2);
              initialFormData[field.label] = urlValues[field.label] !== undefined
                ? Number(urlValues[field.label])
                : defaultRange;
            } else {
              initialFormData[field.label] =
                urlValues[field.label] ||
                participantData?.[field.label] ||
                "";
            }
          });
          setFormData((prev) => ({
            ...initialFormData,
            ...prev,
          }));
        } catch (error) {
          console.error("Erreur lors de la récupération du field :", error);
        }

        try {
          if (param) {
            const response = await axios.get(`/api/forms/fields=${fieldsName}&param=${param}`);
            setFormTitle(response.data.name || "");
            setFormID(response.data.id);
          } else {
            const response = await axios.get(`/api/forms`);
            const matched = (response.data || []).find((f) => f.fields === fieldsName);
            if (matched) {
              setFormTitle(matched.name || "");
              setFormID(matched.id);
            }
          }
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

    if (id) {
      const fetchExistingData = async () => {
        try {
          const response = await axios.get(`/api/data/responses/id=${id}`);
          const data = response.data;
          setDataID(data.id);
          setFormID(data.formID);

          let initialFormData = { ...(data.fieldsFields || {}) };
          initialFormData = { ...initialFormData, ...(data.parametersFields || {}) };

          setFormData(initialFormData);
        } catch (error) {
          console.error("Erreur lors de la récupération des données existantes :", error);
        }
      };
      fetchExistingData();
    }
  }, [location.search, fetchParameterFields, participantData]);

  // Synchronisation avec les données du participant context
  useEffect(() => {
    if (participantData && Object.keys(participantData).length > 0) {
      setFormData((prev) => {
        const updated = { ...prev };
        Object.entries(participantData).forEach(([key, val]) => {
          if (val && (updated[key] === undefined || updated[key] === "")) {
            updated[key] = val;
          }
        });
        return updated;
      });
    }
  }, [participantData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: value !== "" ? "" : `${name} est requis`,
    }));
  };

  const handleRankingChange = ({ label, rankings }) => {
    setFormData((prev) => ({
      ...prev,
      [label]: rankings,
    }));
    setErrors((prev) => ({
      ...prev,
      [label]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    const validateFields = (fields) => {
      fields.forEach((field) => {
        if (!field.required) return;

        const val = formData[field.label];
        if (field.type === "range") {
          if (val === undefined || val === null || val === "") {
            newErrors[field.label] = `${field.label} est requis`;
          }
        } else if (field.type === "ranking") {
          if (!Array.isArray(val) || val.length === 0) {
            newErrors[field.label] = `${field.label} est requis`;
          }
        } else if (field.type !== "information" && field.type !== "image") {
          if (val === undefined || val === null || String(val).trim() === "") {
            newErrors[field.label] = `${field.label} est requis`;
          }
        }
      });
    };

    validateFields(parameterFields);
    validateFields(fieldsFields);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePopupOpen = (message, severity) => {
    setPopup({
      message,
      severity,
      open: true,
    });
  };

  const handlePopupClose = () => {
    setPopup((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = queryParams.get("param");

    if (!validateForm()) {
      handlePopupOpen("Veuillez remplir tous les champs requis", "error");
      return;
    }

    const completeFormData = {
      name: formTitle,
      formID: formID !== undefined ? formID : 0,
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

    try {
      if (dataID) {
        completeFormData.id = dataID;
        await axios.put(`/api/data/modifyData`, completeFormData);
        handlePopupOpen("Données modifiées avec succès", "success");
      } else {
        const response = await axios.post("/api/data/registerData", completeFormData);
        setDataID(response.data.id);
        handlePopupOpen("Données envoyées avec succès", "success");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      handlePopupOpen("Erreur lors de l'envoi des données", "error");
    }
  };

  const renderField = (field) => {
    return (
      <div className={`field-block ${errors[field.label] ? "error" : ""}`} key={field.label}>
        {field.type === "range" && (
          <RangeField
            label={field.label}
            sublabel={field.sublabel}
            errors={errors}
            value={formData[field.label]}
            min={field.min}
            max={field.max}
            labelMin={field.labelMin}
            labelMax={field.labelMax}
            step={field.step}
            onChange={handleChange}
            required={field.required}
            isDisabled={field.disabled}
          />
        )}

        {field.type === "ranking" && (
          <RankingField
            label={field.label}
            value={formData[field.label]}
            options={field.options || []}
            onChange={handleRankingChange}
            required={field.required}
          />
        )}

        {field.type === "text" && (
          <TextInputField
            label={field.label}
            sublabel={field.sublabel}
            value={formData[field.label]}
            errors={errors}
            onChange={handleChange}
            placeholder={field.placeholder || ""}
            required={field.required}
            isDisabled={field.disabled}
          />
        )}

        {field.type === "choice" && (
          <ChoiceField
            label={field.label}
            value={formData[field.label]}
            onChange={handleChange}
            options={field.options || []}
            otherChoice={field.otherChoice}
            placeholder={field.placeholder || ""}
            required={field.required}
            isDisabled={field.disabled}
          />
        )}

        {field.type === "drop-down" && (
          <MultipleChoiceField
            label={field.label}
            sublabel={field.sublabel}
            value={formData[field.label]}
            errors={errors}
            onChange={handleChange}
            placeholder={field.placeholder || ""}
            options={field.options || []}
            required={field.required}
            isDisabled={field.disabled}
          />
        )}

        {field.type === "information" && (
          <InformationField
            label={field.label}
            sublabel={field.sublabel}
          />
        )}

        {field.type === "image" && (
          <ImageField
            label={field.label}
            sublabel={field.sublabel}
            src={field.src}
            size={field.size}
            align={field.align}
          />
        )}

        {field.type === "textAutosize" && (
          <TextAutosizeField
            label={field.label}
            sublabel={field.sublabel}
            value={formData[field.label]}
            errors={errors}
            minRows={field.minRows}
            onChange={handleChange}
            placeholder={field.placeholder || ""}
            required={field.required}
            isDisabled={field.disabled}
          />
        )}

        {!["range", "ranking", "text", "choice", "drop-down", "information", "image", "textAutosize"].includes(field.type) && (
          <div>
            <input
              type={field.type}
              className={`field-input ${errors[field.label] ? "error" : ""}`}
              name={field.label}
              value={formData[field.label] || ""}
              onChange={handleChange}
              placeholder={field.placeholder || ""}
              required={field.required}
              disabled={field.disabled}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fields-page">
      <div className="navbar">
        <div className="parameter-fields">
          {selectedParameter && <>{parameterFields.map(renderField)}</>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0 }}>{formTitle}</h1>
          {fieldsDescription && <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>{fieldsDescription}</p>}
        </div>
        {dataID !== undefined && (
          <Button
            variant="contained"
            color="secondary"
            endIcon={<SendIcon />}
            onClick={handleSubmit}
            sx={{ height: '42px', fontWeight: 700, textTransform: 'none', borderRadius: '8px' }}
          >
            Enregistrer les modifications
          </Button>
        )}
      </div>
      <div className="fields-container">
        <form onSubmit={handleSubmit}>
          {fieldsFields.map(renderField)}
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            type="submit"
            color={dataID === undefined ? "primary" : "secondary"}
          >
            {dataID === undefined ? "Soumettre" : "Modifier"}
          </Button>
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
