import React, { useContext, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import SendIcon from '@mui/icons-material/Send';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

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
  const {
    participantData,
    activeFactors,
    currentTrialIndex,
    activeTrials,
    nextTrial,
  } = useContext(ParticipantContext);
  const location = useLocation();
  const navigate = useNavigate();
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
  const [postSubmitDialog, setPostSubmitDialog] = useState(false);

  const [formTiming, setFormTiming] = useState("trial");
  const [dataID, setDataID] = useState(undefined);
  const urlValuesRef = React.useRef({});

  const fetchParameterFields = useCallback(async (param, urlValues = {}) => {
    try {
      const response = await axios.get(`/api/parameters/${param}`);
      const fields = response.data.fields || [];
      setParameterFields(fields);

      const initialFormData = {};
      fields.forEach((field) => {
        const k = field.label;
        if (urlValues[k] !== undefined) {
          initialFormData[k] = urlValues[k];
        } else if (k === 'UserID') {
          initialFormData[k] = participantData?.UserID || "";
        } else if (k === 'Block') {
          initialFormData[k] = participantData?.Block || "";
        } else if (k === 'TrialOrder') {
          initialFormData[k] = currentTrialIndex || "";
        } else if (activeFactors && activeFactors[k] !== undefined) {
          initialFormData[k] = activeFactors[k];
        } else {
          initialFormData[k] = participantData?.[k] || "";
        }
      });
      setFormData((prevData) => ({
        ...initialFormData,
        ...prevData,
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des données du paramètre :", error);
    }
  }, [participantData, currentTrialIndex, activeFactors]);

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
    urlValuesRef.current = urlValues;

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
            setFormTiming(response.data.timing || 'trial');
          } else {
            const response = await axios.get(`/api/forms`);
            const matched = (response.data || []).find((f) => f.fields === fieldsName);
            if (matched) {
              setFormTitle(matched.name || "");
              setFormID(matched.id);
              setFormTiming(matched.timing || 'trial');
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

  // Synchronisation sélective UNIQUEMENT avec les paramètres autorisés du formulaire
  useEffect(() => {
    if (parameterFields.length === 0) return;
    const allowedKeys = parameterFields.map((f) => f.label);

    setFormData((prev) => {
      const updated = { ...prev };
      if (allowedKeys.includes('UserID') && participantData?.UserID && !urlValuesRef.current?.UserID) {
        updated.UserID = participantData.UserID;
      }
      if (allowedKeys.includes('Block') && participantData?.Block && !urlValuesRef.current?.Block) {
        updated.Block = participantData.Block;
      }
      if (allowedKeys.includes('TrialOrder') && currentTrialIndex && !urlValuesRef.current?.TrialOrder) {
        updated.TrialOrder = currentTrialIndex;
      }
      if (activeFactors) {
        Object.entries(activeFactors).forEach(([key, val]) => {
          if (allowedKeys.includes(key) && val !== undefined && !urlValuesRef.current?.[key]) {
            updated[key] = val;
          }
        });
      }
      return updated;
    });
  }, [participantData, activeFactors, currentTrialIndex, parameterFields]);

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

    completeFormData.parametersFields = {};
    parameterFields.forEach((field) => {
      const k = field.label;
      let val = formData[k];
      if (val === undefined || val === '') {
        if (urlValuesRef.current?.[k] !== undefined) val = urlValuesRef.current[k];
        else if (k === 'UserID' && participantData?.UserID) val = participantData.UserID;
        else if (k === 'Block' && participantData?.Block) val = participantData.Block;
        else if (k === 'TrialOrder' && currentTrialIndex) val = currentTrialIndex;
        else if (activeFactors?.[k] !== undefined) val = activeFactors[k];
        else if (participantData?.[k] !== undefined) val = participantData[k];
        else val = '';
      }
      completeFormData.parametersFields[k] = val;
    });

    try {
      if (dataID) {
        completeFormData.id = dataID;
        await axios.put(`/api/data/modifyData`, completeFormData);
        handlePopupOpen("Données modifiées avec succès", "success");
      } else {
        const response = await axios.post("/api/data/registerData", completeFormData);
        setDataID(response.data.id);
        handlePopupOpen("Données enregistrées avec succès !", "success");
        if (participantData?.UserID) {
          setPostSubmitDialog(true);
        }
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

  const hasTrialOrderInParam = parameterFields.some((f) => f.label === 'TrialOrder');
  const factorFieldsInParam = parameterFields.filter((f) => !['UserID', 'Block', 'TrialOrder'].includes(f.label));

  return (
    <div className="fields-page">
      {/* Barre des Variables Expérimentales */}
      <div className="navbar" style={{ padding: '12px 20px', minHeight: 'auto' }}>
        {participantData?.UserID ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {parameterFields.some((f) => f.label === 'UserID') && (
                <Chip
                  label={`Participant #${formData.UserID || participantData.UserID}`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 800, height: 26, fontSize: '0.78rem' }}
                />
              )}
              {parameterFields.some((f) => f.label === 'Block') && (
                <Chip
                  label={`Bloc : ${formData.Block || participantData.Block}`}
                  size="small"
                  sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', height: 26, fontSize: '0.78rem' }}
                />
              )}
              {hasTrialOrderInParam && activeTrials.length > 0 && (
                <Chip
                  label={`Essai ${formData.TrialOrder || currentTrialIndex} / ${activeTrials.length}`}
                  size="small"
                  color="secondary"
                  sx={{ fontWeight: 700, height: 26, fontSize: '0.78rem' }}
                />
              )}
              {factorFieldsInParam.map((f) => {
                const val = formData[f.label] || urlValuesRef.current?.[f.label] || activeFactors?.[f.label];
                if (val === undefined || val === '') return null;
                return (
                  <Chip
                    key={f.label}
                    label={`${f.label}: ${val}`}
                    size="small"
                    sx={{ fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8', height: 26, fontSize: '0.78rem' }}
                  />
                );
              })}

              {/* Jalon contextuel */}
              {formTiming === 'pre' && (
                <Chip
                  label="📋 Questionnaire initial (Pré-expérience)"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderColor: '#38bdf8', color: '#0284c7', height: 26, fontSize: '0.74rem' }}
                />
              )}
              {formTiming === 'post-modality' && (
                <Chip
                  label="🔬 Évaluation de modalité"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderColor: '#a78bfa', color: '#7c3aed', height: 26, fontSize: '0.74rem' }}
                />
              )}
              {formTiming === 'post' && (
                <Chip
                  label="🏆 Bilan final (Post-expérience)"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderColor: '#34d399', color: '#059669', height: 26, fontSize: '0.74rem' }}
                />
              )}
            </Box>

            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
              Variables expérimentales de ce questionnaire
            </Typography>
          </Box>
        ) : (
          <div className="parameter-fields">
            {selectedParameter && <>{parameterFields.map(renderField)}</>}
          </div>
        )}
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

      {/* Dialogue post-soumission contextuel */}
      <Dialog open={postSubmitDialog} onClose={() => setPostSubmitDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#059669', fontWeight: 700 }}>
          <CheckCircleOutlineIcon /> Réponses enregistrées !
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {formTiming === 'pre' ? (
              <>
                Le <strong>Questionnaire initial</strong> pour le <strong>Participant #{participantData?.UserID}</strong> a été validé avec succès.
                <br /><br />
                Vous pouvez maintenant passer au <strong>déroulement du protocole expérimental</strong>.
              </>
            ) : formTiming === 'post-modality' ? (
              <>
                L'évaluation de la modalité pour le <strong>Participant #{participantData?.UserID}</strong> a été enregistrée avec succès.
                <br /><br />
                Vous pouvez poursuivre les étapes du protocole expérimental.
              </>
            ) : formTiming === 'post' ? (
              <>
                🎉 Le questionnaire de bilan pour le <strong>Participant #{participantData?.UserID}</strong> a été enregistré avec succès !
                <br /><br />
                Toutes les étapes pour ce participant sont désormais complétées.
              </>
            ) : (
              <>
                Les réponses de l'<strong>Essai #{formData.TrialOrder || currentTrialIndex}</strong> pour le <strong>Participant #{participantData?.UserID}</strong> ont été enregistrées avec succès.
                {currentTrialIndex < (activeTrials.length || 0) ? (
                  <>
                    <br /><br />
                    Souhaitez-vous passer directement à l'<strong>Essai suivant ({currentTrialIndex + 1}/{activeTrials.length})</strong> du protocole ?
                  </>
                ) : (
                  <>
                    <br /><br />
                    🎉 C'était le dernier essai de la séquence de contrebalancement pour ce participant !
                  </>
                )}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPostSubmitDialog(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Rester sur ce formulaire
          </Button>
          <Button
            onClick={() => { setPostSubmitDialog(false); navigate('/participant'); }}
            variant={formTiming === 'trial' ? 'outlined' : 'contained'}
            color="primary"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {formTiming === 'pre' ? "Aller au protocole (Essai 1)" : "Retourner à la session"}
          </Button>
          {formTiming === 'trial' && currentTrialIndex < (activeTrials.length || 0) && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SkipNextIcon />}
              onClick={() => {
                nextTrial();
                setPostSubmitDialog(false);
                setDataID(undefined);
                setFormData({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Essai suivant ({currentTrialIndex + 1})
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
