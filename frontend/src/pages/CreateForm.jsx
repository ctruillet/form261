import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import FieldManager from '../components/FieldManager';

// Import des composants de champs pour la prévisualisation en direct
import RangeField from '../components/fields/RangeField';
import ChoiceField from '../components/fields/ChoiceField';
import MultipleChoiceField from '../components/fields/MultipleChoiceField';
import TextInputField from '../components/fields/TextInputField';
import TextAutosizeField from '../components/fields/TextAutosizeField';
import RankingField from '../components/fields/RankingField';
import InformationField from '../components/fields/InformationField';

import '../styles/CreateForm.css';

const slugify = (text) => {
  return String(text || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
};

const TIMING_OPTIONS = [
  {
    value: 'pre',
    label: 'Au tout début (Pré-expérience)',
    subtitle: 'Profil, consentement, données initiales ou démographiques',
    paramFile: 'UserID_Block.json',
  },
  {
    value: 'post-modality',
    label: 'À la fin de chaque modalité',
    subtitle: 'Évaluation par modalité/condition (NASA-TLX, SUS, Agency...)',
    paramFile: 'UserID_TI_Block.json',
  },
  {
    value: 'trial',
    label: 'Au fil des essais (Par essai)',
    subtitle: 'Évaluation répétée à chaque essai individuel du protocole',
    paramFile: 'Active_Protocol.json',
  },
  {
    value: 'post',
    label: 'À la fin de l\'expérience (Clôture)',
    subtitle: 'Classement global, debriefing, commentaires finaux',
    paramFile: 'UserID_Block.json',
  },
  {
    value: 'free',
    label: 'Formulaire libre / Autonome',
    subtitle: 'Administrable à tout moment ou hors protocole expérimental',
    paramFile: 'none',
  },
];

const TIMING_LABELS = {
  pre: 'Pré-expérience',
  'post-modality': 'Fin de modalité',
  trial: 'Par essai',
  post: 'Bilan final',
  free: 'Libre / Autonome',
};

const getRecommendedParamFile = (timing) => {
  if (timing === 'pre' || timing === 'post') return 'UserID_Block.json';
  if (timing === 'post-modality') return 'UserID_TI_Block.json';
  if (timing === 'trial') return 'Active_Protocol.json';
  if (timing === 'free') return 'none';
  return 'UserID_TI_Block.json';
};

const CreateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id !== undefined && id !== null && id !== '');

  // Métadonnées du formulaire
  const [formName, setFormName] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTiming, setFormTiming] = useState('post-modality');
  const [fileName, setFileName] = useState('');
  const [isFileNameManuallyEdited, setIsFileNameManuallyEdited] = useState(false);
  const [selectedParamFile, setSelectedParamFile] = useState('UserID_TI_Block.json');
  const [availableParamFiles, setAvailableParamFiles] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Liste des champs du formulaire
  const [fields, setFields] = useState([
    {
      id: 1,
      type: 'range',
      label: 'Exemple : Facilité d\'utilisation',
      sublabel: 'Dans quelle mesure avez-vous trouvé l\'interface intuitive ?',
      required: true,
      min: 1,
      max: 7,
      step: 1,
      labelMin: 'Très difficile',
      labelMax: 'Très facile',
    },
    {
      id: 2,
      type: 'choice',
      label: 'Exemple : Recommanderiez-vous cette technique ?',
      sublabel: '',
      required: true,
      options: ['Oui, absolument', 'Neutre', 'Non, pas du tout'],
      otherChoice: true,
    },
    {
      id: 3,
      type: 'textAutosize',
      label: 'Commentaires généraux',
      sublabel: 'Partagez vos impressions ou remarques additionnelles.',
      required: false,
      minRows: 3,
    },
  ]);

  // État de l'onglet actif : 0 = Édition, 1 = Prévisualisation
  const [activeTab, setActiveTab] = useState(0);

  // Valeurs de test pour la prévisualisation
  const [previewValues, setPreviewValues] = useState({});

  // Notifications
  const [popup, setPopup] = useState({ open: false, message: '', severity: 'info' });
  const [createdFormInfo, setCreatedFormInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Paramètre actuellement sélectionné et variables correspondantes
  const selectedParamConfig = useMemo(() => {
    if (!selectedParamFile || selectedParamFile === 'none' || formTiming === 'free') return null;
    return availableParamFiles.find((p) => p.file === selectedParamFile);
  }, [selectedParamFile, availableParamFiles, formTiming]);

  const paramVariables = useMemo(() => {
    if (formTiming === 'free' || selectedParamFile === 'none') return [];
    if (selectedParamConfig?.fields && selectedParamConfig.fields.length > 0) {
      return selectedParamConfig.fields.map((f) => f.label);
    }
    // Secours dynamique pendant le chargement
    if (formTiming === 'pre' || formTiming === 'post') return ['UserID', 'Block'];
    if (formTiming === 'post-modality') return ['UserID', 'Modalité (active)', 'Block'];
    if (formTiming === 'trial') return ['UserID', 'TrialOrder', 'Facteurs', 'Block'];
    return [];
  }, [selectedParamConfig, formTiming, selectedParamFile]);

  const handleTimingChange = (newTiming) => {
    setFormTiming(newTiming);
    setSelectedParamFile(getRecommendedParamFile(newTiming));
  };

  // Charger la liste des fichiers de paramètres disponibles
  useEffect(() => {
    const fetchParams = async () => {
      try {
        const response = await axios.get('/api/parameters');
        const list = response.data || [];
        setAvailableParamFiles(list);
      } catch (error) {
        console.error('Erreur de chargement des paramètres :', error);
      }
    };
    fetchParams();
  }, []);

  // Si mode édition : charger les données du formulaire existant
  useEffect(() => {
    if (!isEditMode) return;

    const loadFormToEdit = async () => {
      setIsLoadingData(true);
      try {
        const formRes = await axios.get(`/api/forms/id=${id}`);
        const formData = formRes.data;
        if (!formData) return;

        setFormName(formData.name || '');
        setFormTag(formData.tag || '');
        setFormDescription(formData.description || '');
        const timingVal = formData.timing || (formData.param === 'UserID_Block.json' ? 'pre' : 'post-modality');
        setFormTiming(timingVal);
        setFileName(formData.fields || '');
        setIsFileNameManuallyEdited(true);
        if (formData.param) {
          setSelectedParamFile(formData.param);
        } else {
          setSelectedParamFile(getRecommendedParamFile(timingVal));
        }

        // Charger les questions depuis le fichier de champs
        const fieldsNameClean = (formData.fields || '').replace(/\.json$/i, '');
        const fieldsRes = await axios.get(`/api/fields/${fieldsNameClean}`);
        const fieldsData = fieldsRes.data;

        if (fieldsData) {
          if (!formData.description && fieldsData.description) {
            setFormDescription(fieldsData.description);
          }
          if (Array.isArray(fieldsData.fields) && fieldsData.fields.length > 0) {
            setFields(
              fieldsData.fields.map((f, idx) => ({
                id: Date.now() + idx,
                ...f,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement du formulaire :', err);
        setPopup({
          open: true,
          message: 'Impossible de charger les données du formulaire à modifier.',
          severity: 'error',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFormToEdit();
  }, [id, isEditMode]);

  // Mettre à jour le nom de fichier suggéré automatiquement si non modifié manuellement
  const handleNameChange = (val) => {
    setFormName(val);
    if (!isFileNameManuallyEdited) {
      const slug = slugify(val);
      setFileName(slug ? `${slug}.json` : '');
    }
  };

  const handleFileNameChange = (val) => {
    setIsFileNameManuallyEdited(true);
    setFileName(val);
  };

  // Gestion des champs
  const handleAddField = (presetType = 'text') => {
    const newId = Date.now();
    let newField = {
      id: newId,
      type: presetType,
      label: '',
      sublabel: '',
      required: false,
    };

    if (presetType === 'range') {
      newField = {
        ...newField,
        min: 1,
        max: 7,
        step: 1,
        labelMin: "Pas du tout d'accord",
        labelMax: "Tout à fait d'accord",
      };
    } else if (presetType === 'choice' || presetType === 'drop-down' || presetType === 'ranking') {
      newField = {
        ...newField,
        options: ['Option 1', 'Option 2', 'Option 3'],
        otherChoice: presetType === 'choice',
      };
    } else if (presetType === 'textAutosize') {
      newField = {
        ...newField,
        minRows: 3,
      };
    }

    setFields((prev) => [...prev, newField]);
  };

  const handleRemoveField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index, updatedField) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = updatedField;
      return copy;
    });
  };

  const handleMoveField = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= fields.length) return;
    setFields((prev) => {
      const copy = [...prev];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return copy;
    });
  };

  const handleDuplicateField = (index) => {
    const target = fields[index];
    const duplicated = {
      ...target,
      id: Date.now(),
      label: `${target.label || 'Question'} (Copie)`,
    };
    setFields((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
  };

  // Validation et sauvegarde
  const handleSaveForm = async () => {
    if (!formName.trim()) {
      setPopup({ open: true, message: 'Veuillez saisir un nom pour le formulaire.', severity: 'error' });
      return;
    }

    if (fields.length === 0) {
      setPopup({ open: true, message: 'Veuillez ajouter au moins une question au formulaire.', severity: 'error' });
      return;
    }

    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label || !fields[i].label.trim()) {
        setPopup({
          open: true,
          message: `La question #${i + 1} n'a pas d'intitulé (label). Veuillez renseigner un titre.`,
          severity: 'error',
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        const payload = {
          name: formName.trim(),
          tag: formTag.trim(),
          description: formDescription.trim(),
          paramFile: selectedParamFile,
          timing: formTiming,
          fields: fields,
        };

        const response = await axios.put(`/api/forms/${id}`, payload);

        setCreatedFormInfo(response.data.form);
        setPopup({
          open: true,
          message: 'Formulaire mis à jour avec succès !',
          severity: 'success',
        });
      } else {
        const payload = {
          name: formName.trim(),
          tag: formTag.trim(),
          description: formDescription.trim(),
          fileName: fileName.trim() || `${slugify(formName)}.json`,
          paramFile: selectedParamFile,
          timing: formTiming,
          fields: fields,
        };

        const response = await axios.post('/api/forms/create', payload);

        setCreatedFormInfo(response.data.form);
        setPopup({
          open: true,
          message: 'Formulaire créé et enregistré avec succès !',
          severity: 'success',
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde :', error);
      const msg = error.response?.data?.message || 'Erreur lors de la sauvegarde du formulaire.';
      setPopup({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1000px', margin: '0 auto', p: 3 }}>
      {/* Barre d'action d'en-tête (Sticky pour rester directement accessible au défilement) */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 16,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
            <Typography variant="h5" fontWeight={700} color="#0f172a">
              {isEditMode ? `Modifier : ${formName || `Formulaire #${id}`}` : 'Créateur de Formulaire'}
            </Typography>
            {isEditMode && <Chip label={`#${id}`} size="small" color="primary" variant="outlined" />}
            {formTag && <Chip label={formTag} size="small" sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }} />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {fields.length} question{fields.length > 1 ? 's' : ''} • Jalon : {TIMING_LABELS[formTiming] || formTiming}
            {paramVariables.length > 0 && ` (${paramVariables.join(', ')})`}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="medium"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manage-forms')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Gestion des formulaires
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            disabled={isSaving}
            onClick={handleSaveForm}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              px: 3,
              backgroundColor: '#2563eb',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              '&:hover': { backgroundColor: '#1d4ed8' },
            }}
          >
            {isSaving
              ? 'Enregistrement...'
              : isEditMode
              ? 'Enregistrer les modifications'
              : 'Sauvegarder le questionnaire'}
          </Button>
        </Stack>
      </Paper>


      {/* Alerte de succès avec actions rapides */}
      {createdFormInfo && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() =>
                  navigate(`/form?fields=${createdFormInfo.fields}&param=${createdFormInfo.param}`)
                }
              >
                Tester ce formulaire
              </Button>
              <Button
                color="inherit"
                size="small"
                startIcon={<FormatListBulletedIcon />}
                onClick={() => navigate('/manage-forms')}
              >
                Gestion
              </Button>
              <Button
                color="inherit"
                size="small"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
              >
                Accueil
              </Button>
            </Stack>
          }
        >
          Le formulaire <strong>&quot;{createdFormInfo.name}&quot;</strong> a été {isEditMode ? 'mis à jour' : 'enregistré'} dans le fichier{' '}
          <code>{createdFormInfo.fields}</code> avec succès !
        </Alert>
      )}

      {/* Carte des Métadonnées & Contexte Expérimental */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom color="primary">
          1. Configuration générale et contexte expérimental
        </Typography>

        <Stack spacing={2.5} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            required
            label="Nom du formulaire"
            value={formName}
            placeholder="Ex: French Sense of Agency Scale (F-SOAS)"
            onChange={(e) => handleNameChange(e.target.value)}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Catégorie ou Tag (optionnel)"
              value={formTag}
              placeholder="Ex: Charge mentale, Utilisabilité, Immersion, Profil..."
              helperText="Affiché sur la carte du formulaire et dans le cockpit."
              onChange={(e) => setFormTag(e.target.value)}
            />

            <TextField
              fullWidth
              label="Nom du fichier JSON de stockage"
              value={fileName}
              placeholder="Ex: MonQuestionnaire.json"
              disabled={isEditMode}
              onChange={(e) => handleFileNameChange(e.target.value)}
              helperText={
                isEditMode
                  ? 'Fichier associé dans backend/fields/ (non modifiable)'
                  : 'Enregistré automatiquement dans backend/fields/'
              }
            />
          </Stack>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Consigne ou description pour le participant"
            value={formDescription}
            placeholder="Ex: Évaluez votre perception de contrôle sur vos actions à l'aide des affirmations ci-dessous."
            onChange={(e) => setFormDescription(e.target.value)}
          />

          <Divider sx={{ my: 1 }} />

          {/* Section Jalon & Variables sauvegardées */}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#0f172a" sx={{ mb: 0.5 }}>
              Jalon et Variables sauvegardées
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Indiquez à quel moment ce questionnaire s&apos;insère dans l&apos;expérimentation. Les variables contextuelles (participant, modalité, essai, bloc) sont configurées automatiquement selon le jalon sélectionné.
            </Typography>

            <TextField
              select
              fullWidth
              label="Moment de passation (Jalon expérimental)"
              value={formTiming}
              onChange={(e) => handleTimingChange(e.target.value)}
              helperText="Définit à quelle étape de la session le formulaire est administré"
            >
              {TIMING_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <strong>{opt.label}</strong> — {opt.subtitle}
                </MenuItem>
              ))}
            </TextField>

            {/* Récapitulatif visuel direct des variables capturées */}
            {paramVariables.length > 0 ? (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography variant="caption" fontWeight={800} color="#166534" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                  📌 Facteurs & Variables enregistrés automatiquement avec chaque réponse ({paramVariables.length}) :
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                  {paramVariables.map((v, i) => (
                    <Chip
                      key={i}
                      label={v}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #86efac',
                        py: 0.5,
                      }}
                    />
                  ))}
                </Stack>
                {selectedParamConfig?.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {selectedParamConfig.description}
                  </Typography>
                )}
              </Box>
            ) : formTiming === 'free' || selectedParamFile === 'none' ? (
              <Alert severity="info" sx={{ mt: 2, py: 0.5, borderRadius: 2 }}>
                <strong>Formulaire autonome :</strong> aucune variable expérimentale ne sera exigée lors de la passation.
              </Alert>
            ) : null}
          </Box>
        </Stack>
      </Paper>

      {/* Onglets Édition / Prévisualisation */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#f8fafc', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab icon={<EditIcon fontSize="small" />} iconPosition="start" label={`Conception (${fields.length} questions)`} />
            <Tab icon={<VisibilityIcon fontSize="small" />} iconPosition="start" label="Aperçu en direct" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* ONGLET 0 : ÉDITION */}
          {activeTab === 0 && (
            <FieldManager
              fields={fields}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
              onUpdateField={handleUpdateField}
              onMoveField={handleMoveField}
              onDuplicateField={handleDuplicateField}
            />
          )}

          {/* ONGLET 1 : PRÉVISUALISATION */}
          {activeTab === 1 && (
            <Box className="preview-container">
              <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #eee' }}>
                <Typography variant="h5" fontWeight={600}>
                  {formName || 'Titre du formulaire'}
                </Typography>
                {formDescription && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formDescription}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Facteurs enregistrés :
                  </Typography>
                  {paramVariables.length > 0 ? (
                    paramVariables.map((v, i) => (
                      <Chip
                        key={i}
                        label={v}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#dcfce7', color: '#166534', fontWeight: 700, border: '1px solid #bbf7d0' }}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      <em>Aucun (formulaire autonome)</em>
                    </Typography>
                  )}
                </Box>
              </Box>

              {fields.length === 0 ? (
                <Typography color="text.secondary">
                  Aucun champ à afficher. Ajoutez des champs dans l&apos;onglet Conception.
                </Typography>
              ) : (
                <Stack spacing={3}>
                  {fields.map((field, idx) => (
                    <Box key={idx} sx={{ p: 2, border: '1px solid #eef2f6', borderRadius: 1.5 }}>
                      {field.type === 'range' && (
                        <RangeField
                          label={field.label || `Question ${idx + 1}`}
                          sublabel={field.sublabel}
                          value={previewValues[field.label]}
                          min={field.min ?? 1}
                          max={field.max ?? 7}
                          step={field.step ?? 1}
                          labelMin={field.labelMin}
                          labelMax={field.labelMax}
                          required={field.required}
                          onChange={(e) =>
                            setPreviewValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                        />
                      )}

                      {field.type === 'choice' && (
                        <ChoiceField
                          label={field.label || `Question ${idx + 1}`}
                          value={previewValues[field.label] || ''}
                          options={field.options || []}
                          otherChoice={field.otherChoice}
                          required={field.required}
                          onChange={(e) =>
                            setPreviewValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                        />
                      )}

                      {field.type === 'drop-down' && (
                        <MultipleChoiceField
                          label={field.label || `Question ${idx + 1}`}
                          sublabel={field.sublabel}
                          value={previewValues[field.label] || ''}
                          options={field.options || []}
                          placeholder={field.placeholder}
                          required={field.required}
                          onChange={(e) =>
                            setPreviewValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                        />
                      )}

                      {field.type === 'text' && (
                        <TextInputField
                          label={field.label || `Question ${idx + 1}`}
                          sublabel={field.sublabel}
                          value={previewValues[field.label] || ''}
                          placeholder={field.placeholder}
                          required={field.required}
                          onChange={(e) =>
                            setPreviewValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                        />
                      )}

                      {field.type === 'textAutosize' && (
                        <TextAutosizeField
                          label={field.label || `Question ${idx + 1}`}
                          sublabel={field.sublabel}
                          value={previewValues[field.label] || ''}
                          minRows={field.minRows || 3}
                          placeholder={field.placeholder}
                          required={field.required}
                          onChange={(e) =>
                            setPreviewValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                          }
                        />
                      )}

                      {field.type === 'ranking' && (
                        <RankingField
                          label={field.label || `Question ${idx + 1}`}
                          options={field.options || []}
                          value={previewValues[field.label]}
                          required={field.required}
                          onChange={({ label, rankings }) =>
                            setPreviewValues((prev) => ({ ...prev, [label]: rankings }))
                          }
                        />
                      )}

                      {field.type === 'information' && (
                        <InformationField
                          label={field.label || 'Information'}
                          sublabel={field.sublabel}
                        />
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Bouton de sauvegarde */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={isSaving}
              onClick={handleSaveForm}
            >
              {isSaving
                ? 'Enregistrement...'
                : isEditMode
                ? 'Enregistrer les modifications'
                : 'Sauvegarder le questionnaire'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Notifications */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={popup.open}
        autoHideDuration={5000}
        onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
          severity={popup.severity}
          sx={{ width: '100%' }}
        >
          {popup.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateForm;