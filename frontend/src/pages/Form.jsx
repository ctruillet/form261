import React, { useContext, useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
import { buildSessionSteps, buildStepUrl, findCurrentStep } from '../utils/sessionSteps';

import "../styles/Form.css";

// Clés d'URL réservées à la navigation (toutes les autres sont des valeurs pré-remplies)
const RESERVED_QUERY_KEYS = ["fields", "param", "id"];

// Un paramètre absent peut arriver sous forme de chaîne ("undefined", "none"...) dans l'URL
const normalizeParam = (param) =>
  !param || ["undefined", "null", "none"].includes(param) ? null : param;

const Form = () => {
  const {
    participantData,
    activeFactors,
    currentTrialIndex,
    activeTrials,
    nextTrial,
    protocol,
    loadingProtocol,
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
  // Écran de fin affiché après l'envoi : { next, remaining } (next = questionnaire suivant de la même étape)
  const [completion, setCompletion] = useState(null);
  // Position du questionnaire dans son étape : { key, group, position, total }
  const [stepInfo, setStepInfo] = useState(null);
  const sessionStepsRef = useRef([]);

  const [formTiming, setFormTiming] = useState("trial");
  const [dataID, setDataID] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // true quand on modifie une réponse existante ouverte via ?id=... : ses paramètres
  // (UserID, Block, facteurs) ne doivent alors jamais être remplacés par ceux du participant actif.
  const [editingExisting, setEditingExisting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const urlValuesRef = useRef({});

  // Contexte participant lu au moment du chargement, sans relancer le chargement à chaque changement
  const contextRef = useRef({});
  contextRef.current = { participantData, activeFactors, currentTrialIndex, activeTrials, protocol };

  // Chargement du formulaire, de ses paramètres et (en modification) de la réponse existante
  useEffect(() => {
    // Attendre le protocole : il détermine les conditions de l'essai et l'enchaînement des questionnaires
    if (loadingProtocol) return undefined;
    let cancelled = false;
    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = normalizeParam(queryParams.get("param"));
    const id = queryParams.get("id");

    const urlValues = {};
    queryParams.forEach((value, key) => {
      if (!RESERVED_QUERY_KEYS.includes(key)) {
        urlValues[key] = value;
      }
    });
    urlValuesRef.current = urlValues;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      setErrors({});

      if (!fieldsName) {
        setLoadError("Aucun formulaire n'a été sélectionné.");
        setLoading(false);
        return;
      }

      let fields = [];
      let description = "";
      try {
        const response = await axios.get(`/api/fields/${encodeURIComponent(fieldsName)}`);
        fields = response.data.fields || [];
        description = response.data.description || "";
      } catch (error) {
        console.error("Erreur lors de la récupération du field :", error);
        if (!cancelled) {
          setLoadError(`Impossible de charger le formulaire « ${fieldsName} ».`);
          setLoading(false);
        }
        return;
      }

      let paramFields = [];
      if (param) {
        try {
          const response = await axios.get(`/api/parameters/${encodeURIComponent(param)}`);
          paramFields = response.data.fields || [];
        } catch (error) {
          console.error("Erreur lors de la récupération des données du paramètre :", error);
        }
      }

      let formMeta = null;
      let allForms = [];
      try {
        const response = await axios.get(`/api/forms`);
        allForms = response.data || [];
        formMeta =
          allForms.find((f) => f.fields === fieldsName && (f.param || "") === (param || "")) ||
          allForms.find((f) => f.fields === fieldsName) ||
          null;
      } catch (error) {
        console.error("Erreur lors de la récupération du form :", error);
      }

      let existing = null;
      if (id) {
        try {
          const response = await axios.get(`/api/data/responses/id=${encodeURIComponent(id)}`);
          existing = response.data;
        } catch (error) {
          console.error("Erreur lors de la récupération des données existantes :", error);
          if (!cancelled) {
            setLoadError("La réponse à modifier est introuvable (elle a peut-être été supprimée).");
            setLoading(false);
          }
          return;
        }
      }

      // En session : réponses déjà données, pour situer ce questionnaire dans le déroulé
      let sessionResponses = null;
      if (contextRef.current.participantData?.UserID) {
        try {
          const response = await axios.get('/api/data/responses');
          sessionResponses = response.data || [];
        } catch (error) {
          console.error("Erreur lors de la récupération du déroulé de la session :", error);
        }
      }

      if (cancelled) return;

      const { participantData: pData, activeFactors: factors, currentTrialIndex: trialIndex } = contextRef.current;

      // Valeurs initiales des paramètres expérimentaux
      const initialFormData = {};
      paramFields.forEach((field) => {
        const k = field.label;
        if (urlValues[k] !== undefined) {
          initialFormData[k] = urlValues[k];
        } else if (k === 'UserID') {
          initialFormData[k] = pData?.UserID || "";
        } else if (k === 'Block') {
          initialFormData[k] = pData?.Block || "";
        } else if (k === 'TrialOrder') {
          initialFormData[k] = trialIndex || "";
        } else if (factors && factors[k] !== undefined) {
          initialFormData[k] = factors[k];
        } else {
          initialFormData[k] = pData?.[k] || "";
        }
      });

      // Valeurs initiales des questions
      fields.forEach((field) => {
        if (field.type === "range") {
          const defaultRange = Math.round(((field.min ?? 0) + (field.max ?? 100)) / 2);
          initialFormData[field.label] = urlValues[field.label] !== undefined
            ? Number(urlValues[field.label])
            : defaultRange;
        } else if (field.type !== "information" && field.type !== "image") {
          initialFormData[field.label] =
            urlValues[field.label] ||
            pData?.[field.label] ||
            "";
        }
      });

      // En modification : les valeurs enregistrées priment sur tout le reste
      if (existing) {
        Object.assign(initialFormData, existing.fieldsFields || {}, existing.parametersFields || {});
      }

      // Situer le questionnaire dans son étape (« Questionnaire 2 sur 5 ») et préparer l'enchaînement
      let currentStepInfo = null;
      sessionStepsRef.current = [];
      if (sessionResponses && pData?.UserID) {
        const { steps } = buildSessionSteps({
          forms: allForms,
          trials: contextRef.current.activeTrials,
          blockedFactorName: contextRef.current.protocol?.blockedFactorName,
          responses: sessionResponses,
          userId: pData.UserID,
        });
        sessionStepsRef.current = steps;
        const current = findCurrentStep(steps, fieldsName, initialFormData);
        if (current) {
          const groupSteps = steps.filter((s) => s.group === current.group);
          currentStepInfo = {
            key: current.key,
            group: current.group,
            position: groupSteps.indexOf(current) + 1,
            total: groupSteps.length,
          };
        }
      }

      setStepInfo(currentStepInfo);
      setCompletion(null);
      setFieldsFields(fields);
      setFormDescription(description);
      setSelectedParameter(param);
      setParameterFields(paramFields);
      setFormTitle(formMeta?.name || existing?.name || "");
      setFormID(existing?.formID ?? formMeta?.id);
      setFormTiming(formMeta?.timing || 'trial');
      setDataID(existing ? existing.id : undefined);
      setEditingExisting(Boolean(existing));
      setFormData(initialFormData);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [location.search, reloadKey, loadingProtocol]);

  // Après un envoi réussi : afficher l'écran de fin, avec le questionnaire suivant de la même étape s'il y en a un
  const showCompletion = (savedId) => {
    let next = null;
    let remaining = 0;
    if (stepInfo) {
      const steps = sessionStepsRef.current;
      const current = steps.find((s) => s.key === stepInfo.key);
      if (current) {
        current.done = true;
        current.responseId = savedId;
      }
      const pending = steps.filter((s) => s.group === stepInfo.group && !s.done);
      next = pending[0] || null;
      remaining = pending.length;
    }
    setCompletion({ next, remaining });
    window.scrollTo({ top: 0 });
  };

  // Synchronisation sélective UNIQUEMENT avec les paramètres autorisés du formulaire
  useEffect(() => {
    if (parameterFields.length === 0 || editingExisting) return;
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
  }, [participantData, activeFactors, currentTrialIndex, parameterFields, editingExisting]);

  // Libellés des champs obligatoires (questions + paramètres)
  const requiredLabels = useMemo(
    () => new Set([...parameterFields, ...fieldsFields].filter((f) => f.required).map((f) => f.label)),
    [parameterFields, fieldsFields]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Seuls les champs obligatoires peuvent être en erreur lorsqu'ils sont vides
    const isEmpty = value === "" || value === null || value === undefined;
    setErrors((prev) => ({
      ...prev,
      [name]: isEmpty && requiredLabels.has(name) ? `${name} est requis` : "",
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
    if (submitting) return; // évite les doublons en cas de double-clic

    const queryParams = new URLSearchParams(location.search);
    const fieldsName = queryParams.get("fields");
    const param = normalizeParam(queryParams.get("param"));

    if (!validateForm()) {
      handlePopupOpen("Veuillez remplir tous les champs requis", "error");
      return;
    }

    // Sans identifiant de formulaire, les réponses seraient rangées dans le fichier d'un autre questionnaire
    if (formID === undefined || formID === null) {
      handlePopupOpen("Ce formulaire n'est pas enregistré dans la liste des formulaires : envoi impossible.", "error");
      return;
    }

    const completeFormData = {
      name: formTitle,
      formID,
      fieldsFile: fieldsName,
      paramFile: param || "",
      parametersFields: {},
      fieldsFields: {},
    };

    fieldsFields.forEach((field) => {
      if (field.type === "information" || field.type === "image") return; // champs d'affichage, sans réponse
      completeFormData.fieldsFields[field.label] = formData[field.label];
    });

    parameterFields.forEach((field) => {
      const k = field.label;
      let val = formData[k];
      if ((val === undefined || val === '') && !editingExisting) {
        if (urlValuesRef.current?.[k] !== undefined) val = urlValuesRef.current[k];
        else if (k === 'UserID' && participantData?.UserID) val = participantData.UserID;
        else if (k === 'Block' && participantData?.Block) val = participantData.Block;
        else if (k === 'TrialOrder' && currentTrialIndex) val = currentTrialIndex;
        else if (activeFactors?.[k] !== undefined) val = activeFactors[k];
        else if (participantData?.[k] !== undefined) val = participantData[k];
        else val = '';
      }
      completeFormData.parametersFields[k] = val ?? '';
    });

    setSubmitting(true);
    try {
      if (dataID) {
        completeFormData.id = dataID;
        await axios.put(`/api/data/modifyData`, completeFormData);
        showCompletion(dataID);
      } else {
        const response = await axios.post("/api/data/registerData", completeFormData);
        setDataID(response.data.id);
        showCompletion(response.data.id);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement :", error);
      handlePopupOpen(error.response?.data?.message || "Erreur lors de l'envoi des données", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Passer à l'essai suivant : nouvelle saisie vierge, avec les conditions du nouvel essai
  const goToNextTrial = () => {
    const upcoming = activeTrials.find((t) => t.trialOrder === currentTrialIndex + 1);
    const query = new URLSearchParams(location.search);
    query.delete("id");

    // Si l'essai et ses facteurs figuraient dans l'URL, ils doivent suivre le nouvel essai
    // (sinon la réponse suivante serait enregistrée avec les conditions de l'essai précédent).
    if (upcoming) {
      Object.entries(upcoming).forEach(([key, value]) => {
        if (key === "trialOrder") {
          if (query.has("TrialOrder")) query.set("TrialOrder", String(value));
        } else if (key !== "macroBlock" && key !== "subTrial" && query.has(key)) {
          query.set(key, String(value));
        }
      });
    }

    nextTrial();
    setCompletion(null);
    setReloadKey((k) => k + 1);
    navigate(`/form?${query.toString()}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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


  const hasActiveParticipant = Boolean(participantData?.UserID);

  // Rappel discret du contexte (utile à l'expérimentateur, sans encombrer le participant)
  const contextSummary = [];
  if (hasActiveParticipant) {
    if (parameterFields.some((f) => f.label === 'UserID')) {
      contextSummary.push(`Participant ${formData.UserID || participantData.UserID}`);
    }
    factorFieldsInParam.forEach((f) => {
      const val = formData[f.label] || urlValuesRef.current?.[f.label] || activeFactors?.[f.label];
      if (val !== undefined && val !== '') contextSummary.push(String(val));
    });
    if (hasTrialOrderInParam && activeTrials.length > 0) {
      contextSummary.push(`Essai ${formData.TrialOrder || currentTrialIndex}/${activeTrials.length}`);
    }
  }

  const handleBack = () => {
    if (hasActiveParticipant) navigate('/session');
    else if (window.history.length > 1) navigate(-1);
    else navigate('/session');
  };

  // Saisir une nouvelle réponse au même questionnaire (hors session de passation)
  const startNewResponse = () => {
    const query = new URLSearchParams(location.search);
    query.delete("id");
    setReloadKey((k) => k + 1);
    navigate(`/form?${query.toString()}`, { replace: true });
  };

  return (
    <div className="fields-page">
      {/* Barre minimale : retour + rappel du contexte */}
      <div className="form-topbar">
        <Button
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={handleBack}
          sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
        >
          {hasActiveParticipant ? 'Session' : 'Retour'}
        </Button>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {contextSummary.join(' · ')}
        </Typography>
      </div>

      {completion ? (
        /* Écran de fin : une seule action proposée */
        <Paper
          elevation={0}
          sx={{
            mt: 6,
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#10b981' }} />
          <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ mt: 1 }}>
            Merci, vos réponses sont enregistrées.
          </Typography>

          {completion.next ? (
            <>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {completion.remaining > 1
                  ? `Il reste ${completion.remaining} questionnaires pour cette étape.`
                  : 'Il reste un dernier questionnaire pour cette étape.'}
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(buildStepUrl(completion.next, participantData))}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4, py: 1.4 }}
              >
                Questionnaire suivant
              </Button>
            </>
          ) : hasActiveParticipant ? (
            <>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Cette étape est terminée. Vous pouvez prévenir l&apos;expérimentateur.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/session')}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4, py: 1.4 }}
                >
                  Retour à la session
                </Button>
                {formTiming === 'trial' && currentTrialIndex < activeTrials.length && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<SkipNextIcon />}
                    onClick={goToNextTrial}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
                  >
                    Essai suivant ({currentTrialIndex + 1})
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                onClick={startNewResponse}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4 }}
              >
                Nouvelle réponse
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleBack}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
              >
                Retour
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              size="small"
              color="inherit"
              onClick={() => setCompletion(null)}
              sx={{ textTransform: 'none', color: '#94a3b8' }}
            >
              Modifier mes réponses
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* Sans session active, les paramètres (UserID, bloc...) se saisissent à la main */}
          {!hasActiveParticipant && selectedParameter && parameterFields.length > 0 && (
            <div className="parameter-fields form-parameter-fields">
              {parameterFields.map(renderField)}
            </div>
          )}

          <div className="form-heading">
            {stepInfo && stepInfo.total > 1 && (
              <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 800, letterSpacing: '1px' }}>
                Questionnaire {stepInfo.position} sur {stepInfo.total}
              </Typography>
            )}
            <h1 style={{ margin: 0 }}>{formTitle}</h1>
            {fieldsDescription && <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>{fieldsDescription}</p>}
          </div>

          <div className="fields-container">
            {loadError ? (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={handleBack}>
                    Retour
                  </Button>
                }
              >
                {loadError}
              </Alert>
            ) : loading && fieldsFields.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {fieldsFields.map(renderField)}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<SendIcon />}
                  type="submit"
                  disabled={submitting || loading}
                  sx={{ mt: 2, py: 1.4, textTransform: 'none', fontWeight: 700, fontSize: '1rem', borderRadius: '10px' }}
                >
                  {submitting
                    ? "Envoi..."
                    : dataID === undefined
                    ? "Valider mes réponses"
                    : "Enregistrer les modifications"}
                </Button>
              </form>
            )}
          </div>
        </>
      )}

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
