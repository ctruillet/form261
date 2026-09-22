import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SyncIcon from '@mui/icons-material/Sync';

import { ParticipantContext } from '../context/ParticipantContext';

// Import des composants de champs existants
import TextInputField from '../components/fields/TextInputField';
import MultipleChoiceField from '../components/fields/MultipleChoiceField';
import ChoiceField from '../components/fields/ChoiceField';
import RangeField from '../components/fields/RangeField';

import '../styles/Form.css';
import '../styles/Participant.css';

// Helper pour incrémenter un ID de participant (ex: 1 -> 2, P01 -> P02)
const getNextUserId = (currentId) => {
  if (!currentId) return '1';
  const str = String(currentId).trim();
  const match = str.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10) + 1;
    const padded = String(num).padStart(match[2].length, '0');
    return `${prefix}${padded}`;
  }
  return `${str}_2`;
};

// Helper pour calculer le prochain ID disponible basé sur la liste des participants
const getNextAvailableId = (list) => {
  let maxNum = 0;
  (list || []).forEach((p) => {
    const uid = p.UserID || p.id;
    const match = String(uid).match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return String(maxNum + 1);
};

function Participant() {
  const { participantData, updateParticipant, clearParticipant } = useContext(ParticipantContext);
  const navigate = useNavigate();

  const [parameterFields, setParameterFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedParamFile, setSelectedParamFile] = useState('UserID_Block.json');
  const [paramFilesList, setParamFilesList] = useState([]);
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [backendReady, setBackendReady] = useState(true);
  const [popup, setPopup] = useState({ open: false, message: '', severity: 'info' });

  // Mode Édition : null si mode création, ou objet participant si mode modification
  const [editMode, setEditMode] = useState(null);

  // Dialogue de confirmation de suppression
  const [deleteDialog, setDeleteDialog] = useState({ open: false, participant: null });

  // 1. Charger la liste des fichiers de paramètres disponibles
  useEffect(() => {
    const fetchParametersList = async () => {
      try {
        const response = await axios.get('/api/parameters');
        setParamFilesList(response.data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres :', error);
      }
    };
    fetchParametersList();
  }, []);

  // 2. Charger les participants depuis /api/participants (stockage backend/participants.json)
  const fetchParticipants = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await axios.get('/api/participants');
      setParticipantsList(response.data || []);
      setBackendReady(true);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setBackendReady(false);
        // Fallback temporaire : extraire depuis les réponses enregistrées si le serveur n'a pas encore redémarré
        try {
          const resp = await axios.get('/api/data/responses');
          const map = {};
          (resp.data || []).forEach((file) => {
            if (Array.isArray(file.content)) {
              file.content.forEach((r) => {
                const uid = r.parametersFields?.UserID;
                if (!uid) return;
                const uidStr = String(uid);
                if (!map[uidStr]) {
                  map[uidStr] = {
                    id: uidStr,
                    UserID: uidStr,
                    Block: r.parametersFields?.Block || 'A',
                    formCount: 0,
                    forms: [],
                    blocks: [],
                    ...r.parametersFields,
                  };
                }
                map[uidStr].formCount += 1;
              });
            }
          });
          setParticipantsList(Object.values(map));
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error('Erreur lors du chargement des participants :', error);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // 3. Charger la structure du fichier de paramètres sélectionné
  useEffect(() => {
    const fetchParameterFields = async () => {
      if (!selectedParamFile) return;
      try {
        const response = await axios.get(`/api/parameters/${selectedParamFile}`);
        const fields = response.data.fields || [];
        setParameterFields(fields);

        setFormData((prev) => {
          const initial = { ...prev };
          fields.forEach((field) => {
            if (initial[field.label] === undefined) {
              initial[field.label] = field.options && field.options.length > 0 ? field.options[0] : '';
            }
          });
          return initial;
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des champs de paramètre :', error);
      }
    };
    fetchParameterFields();
  }, [selectedParamFile]);

  // 4. Initialisation au chargement : suggérer le prochain UserID disponible
  useEffect(() => {
    if (!editMode && (!formData.UserID || formData.UserID === '')) {
      const nextId = getNextAvailableId(participantsList);
      setFormData((prev) => ({
        ...prev,
        UserID: nextId,
        Block: prev.Block || 'A',
      }));
    }
  }, [participantsList, editMode]);

  // Filtrage des participants par recherche
  const filteredParticipants = useMemo(() => {
    if (!historySearch.trim()) return participantsList;
    const q = historySearch.toLowerCase().trim();
    return participantsList.filter((p) => String(p.UserID || p.id).toLowerCase().includes(q));
  }, [participantsList, historySearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: value !== '' ? '' : `${name} est requis`,
    }));
  };

  // Passer en mode Modification pour un participant de la liste
  const handleStartEdit = (p) => {
    setEditMode(p);
    setFormData({
      ...p,
      UserID: String(p.UserID || p.id),
      Block: p.Block || 'A',
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Annuler le mode Édition et revenir au mode Création
  const handleCancelEdit = () => {
    setEditMode(null);
    const nextId = getNextAvailableId(participantsList);
    setFormData({
      UserID: nextId,
      Block: 'A',
    });
    setErrors({});
  };

  // Enregistrer (Création OU Modification)
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const userId = String(formData.UserID || '').trim();
    if (!userId) {
      setErrors((prev) => ({ ...prev, UserID: 'UserID est requis' }));
      setPopup({ open: true, message: 'Le champ UserID est obligatoire.', severity: 'error' });
      return;
    }

    // Validation des champs requis du paramFile
    let isValid = true;
    const newErrors = {};
    parameterFields.forEach((field) => {
      if (field.required && (!formData[field.label] || String(formData[field.label]).trim() === '')) {
        newErrors[field.label] = `${field.label} est requis`;
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      setPopup({ open: true, message: 'Veuillez remplir tous les paramètres obligatoires.', severity: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      if (editMode) {
        // --- MODE MODIFICATION ---
        const targetId = String(editMode.UserID || editMode.id);
        const payload = {
          ...formData,
          UserID: userId,
        };

        if (backendReady) {
          await axios.put(`/api/participants/${targetId}`, payload);
        }

        // Si ce participant est celui actif dans la session, mettre à jour le contexte
        if (String(participantData?.UserID) === targetId) {
          updateParticipant(payload);
        }

        setPopup({
          open: true,
          message: `Participant #${userId} modifié avec succès !`,
          severity: 'success',
        });
        setEditMode(null);
      } else {
        // --- MODE CRÉATION ---
        const exists = participantsList.some((p) => String(p.UserID || p.id) === userId);
        if (exists) {
          setPopup({
            open: true,
            message: `Le participant #${userId} existe déjà. Cliquez sur l'icône Modifier dans la liste pour changer ses données.`,
            severity: 'warning',
          });
          setSubmitting(false);
          return;
        }

        const payload = {
          ...formData,
          id: userId,
          UserID: userId,
        };

        if (backendReady) {
          await axios.post('/api/participants', payload);
        }

        // Activation immédiate dans la session active
        updateParticipant(payload);

        setPopup({
          open: true,
          message: `Participant #${userId} créé et activé pour la session !`,
          severity: 'success',
        });

        // Préparer l'identifiant suivant
        const nextId = getNextUserId(userId);
        setFormData({
          UserID: nextId,
          Block: formData.Block || 'A',
        });
      }

      await fetchParticipants();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du participant :', err);
      const msg = err.response?.data?.message || "Erreur lors de l'enregistrement du participant sur le serveur.";
      setPopup({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Suppression d'un participant
  const handleConfirmDelete = async () => {
    const target = deleteDialog.participant;
    if (!target) return;

    const targetId = String(target.UserID || target.id);
    setDeleting(true);
    try {
      if (backendReady) {
        await axios.delete(`/api/participants/${targetId}`);
      }

      // Si le participant supprimé était actif dans la session
      if (String(participantData?.UserID) === targetId) {
        clearParticipant();
      }

      // Si on était en train de modifier ce participant
      if (editMode && String(editMode.UserID || editMode.id) === targetId) {
        handleCancelEdit();
      }

      setPopup({
        open: true,
        message: `Participant #${targetId} supprimé avec succès.`,
        severity: 'info',
      });

      setDeleteDialog({ open: false, participant: null });
      await fetchParticipants();
    } catch (err) {
      console.error('Erreur lors de la suppression :', err);
      setPopup({ open: true, message: 'Erreur lors de la suppression du participant.', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Réinitialiser la session active
  const handleClearSession = () => {
    clearParticipant();
    setPopup({
      open: true,
      message: 'Session active réinitialisée.',
      severity: 'info',
    });
  };

  // Passer directement au participant suivant (+1)
  const handleNextParticipant = () => {
    const currentId = participantData?.UserID || formData.UserID || '0';
    const nextId = getNextUserId(currentId);
    const updated = { ...formData, ...participantData, UserID: nextId };
    setFormData(updated);
    updateParticipant(updated);
    setPopup({
      open: true,
      message: `Passage au participant suivant : #${nextId}`,
      severity: 'success',
    });
  };

  // Activer un participant sélectionné dans l'historique
  const handleSelectFromHistory = (p) => {
    const uid = String(p.UserID || p.id);
    const newSessionData = {
      ...formData,
      ...p,
      UserID: uid,
    };
    setFormData(newSessionData);
    updateParticipant(newSessionData);
    setPopup({
      open: true,
      message: `Participant #${uid} activé pour la session.`,
      severity: 'info',
    });
  };

  const isCurrentActive = (uid) => String(participantData?.UserID) === String(uid);

  const renderField = (field) => {
    const isUserField = field.label.toLowerCase().includes('user');

    return (
      <Box key={field.label} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            {field.type === 'text' && (
              <TextInputField
                label={field.label}
                sublabel={field.sublabel}
                value={formData[field.label] || ''}
                errors={errors}
                onChange={handleChange}
                required={field.required}
              />
            )}

            {field.type === 'drop-down' && (
              <MultipleChoiceField
                label={field.label}
                sublabel={field.sublabel}
                value={formData[field.label] || ''}
                errors={errors}
                onChange={handleChange}
                options={field.options || []}
                required={field.required}
              />
            )}

            {field.type === 'choice' && (
              <ChoiceField
                label={field.label}
                value={formData[field.label] || ''}
                onChange={handleChange}
                options={field.options || []}
                required={field.required}
              />
            )}

            {field.type === 'range' && (
              <RangeField
                label={field.label}
                sublabel={field.sublabel}
                value={formData[field.label] || ''}
                errors={errors}
                min={field.min}
                max={field.max}
                labelMin={field.labelMin}
                labelMax={field.labelMax}
                onChange={handleChange}
                required={field.required}
              />
            )}
          </Box>

          {isUserField && !editMode && (
            <Tooltip title="Incrémenter l'identifiant (+1)">
              <IconButton
                color="primary"
                onClick={() => {
                  const nextId = getNextUserId(formData[field.label]);
                  setFormData((prev) => ({ ...prev, [field.label]: nextId }));
                }}
                sx={{
                  mt: 3.5,
                  backgroundColor: 'rgba(37, 99, 235, 0.08)',
                  '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.18)' },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <div className="participant-container">
      {/* En-tête */}
      <div className="participant-header">
        <div className="participant-title-group">
          <h1 className="participant-title">Gestion des Participants</h1>
        </div>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Lancer un formulaire
          </Button>
          {participantData?.UserID && (
            <Button
              variant="contained"
              size="small"
              startIcon={<FactCheckIcon />}
              onClick={() => navigate('/participant-answers')}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', boxShadow: 'none' }}
            >
              Voir ses réponses
            </Button>
          )}
        </Stack>
      </div>

      {/* Alerte si le backend doit être rechargé pour la route /api/participants */}
      {!backendReady && (
        <Alert
          severity="info"
          icon={<SyncIcon />}
          sx={{ mb: 3, borderRadius: '10px' }}
        >
          Les fichiers backend sont configurés dans <code>backend/participants.json</code>. Si vous venez de démarrer l'application, pensez à redémarrer le terminal (<code>npm run dev</code>) pour activer la nouvelle route d'API dédiée.
        </Alert>
      )}

      {/* Carte Statut Session Active */}
      <div className="participant-active-card">
        <div className="participant-active-info">
          <span
            className={`participant-active-dot ${participantData?.UserID ? '' : 'inactive'}`}
            style={{
              backgroundColor: participantData?.UserID ? '#10b981' : '#94a3b8',
              boxShadow: participantData?.UserID ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
            }}
          />
          <div>
            <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
              {participantData?.UserID ? (
                <>Session active : Participant #{participantData.UserID}</>
              ) : (
                <>Aucun participant actif</>
              )}
            </Typography>
            <Typography variant="caption" color="#64748b">
              {participantData?.UserID
                ? 'Ces identifiants et variables sont automatiquement injectés dans les formulaires passés.'
                : 'Créez ou activez un participant ci-dessous pour démarrer une passation.'}
            </Typography>
          </div>

          {participantData?.UserID && (
            <Stack direction="row" spacing={1} sx={{ ml: 2, flexWrap: 'wrap' }}>
              {participantData.Block && (
                <Chip
                  label={`Block: ${participantData.Block}`}
                  size="small"
                  sx={{ fontWeight: 600, backgroundColor: '#f1f5f9' }}
                />
              )}
              {participantData.Technique && (
                <Chip
                  label={`Technique: ${participantData.Technique}`}
                  size="small"
                  sx={{ fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                />
              )}
            </Stack>
          )}
        </div>

        <Stack direction="row" spacing={1}>
          {participantData?.UserID && (
            <>
              <Tooltip title="Incrémente le numéro de participant pour enchaîner le prochain sujet">
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<SkipNextIcon />}
                  onClick={handleNextParticipant}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Suivant (+1)
                </Button>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={handleClearSession}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Désactiver
              </Button>
            </>
          )}
        </Stack>
      </div>

      {/* Grille 2 colonnes : Formulaire de paramétrage & Liste */}
      <div className="participant-layout-grid">
        {/* Colonne Gauche : Configuration des variables expérimentales (Ajout ou Modification) */}
        <div className={`participant-card-panel ${editMode ? 'edit-mode-panel' : ''}`}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <h2 className="participant-panel-title">
              {editMode ? (
                <>
                  <EditIcon fontSize="small" sx={{ color: '#ea580c' }} />
                  Modifier le Participant #{editMode.UserID || editMode.id}
                </>
              ) : (
                <>
                  <PersonAddIcon fontSize="small" sx={{ color: '#2563eb' }} />
                  Ajouter un participant
                </>
              )}
            </h2>

            {editMode && (
              <Chip
                label="Mode édition"
                color="warning"
                size="small"
                onDelete={handleCancelEdit}
                deleteIcon={<CloseIcon />}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>

          <p className="participant-panel-subtitle">
            {editMode
              ? "Modifiez les variables expérimentales de ce participant et enregistrez les modifications."
              : "Renseignez les variables expérimentales pour créer et enregistrer un nouveau participant."}
          </p>

          <Box sx={{ mb: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Structure des variables expérimentales"
              value={selectedParamFile}
              onChange={(e) => setSelectedParamFile(e.target.value)}
              helperText="Définit les variables requises (ex: UserID, Bloc, Technique)."
            >
              {paramFilesList.map((param, index) => (
                <MenuItem key={index} value={param.file}>
                  {param.title || param.file} ({param.file})
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <form onSubmit={handleSave}>
            <div className="fields-container">
              {parameterFields.map(renderField)}
            </div>

            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: editMode ? '#ea580c' : '#2563eb',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: editMode ? '#c2410c' : '#1d4ed8' },
                }}
              >
                {submitting
                  ? 'Enregistrement...'
                  : editMode
                  ? 'Enregistrer les modifications'
                  : 'Créer et activer le participant'}
              </Button>

              {editMode ? (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancelEdit}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    color: '#475569',
                  }}
                >
                  Annuler la modification
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    const nextId = getNextAvailableId(participantsList);
                    setFormData({ UserID: nextId, Block: 'A' });
                    setErrors({});
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    color: '#475569',
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </Box>
          </form>
        </div>

        {/* Colonne Droite : Participants enregistrés */}
        <div className="participant-card-panel">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <h2 className="participant-panel-title" style={{ margin: 0 }}>
              <HistoryIcon fontSize="small" sx={{ color: '#6366f1' }} />
              Participants enregistrés ({participantsList.length})
            </h2>

            {!editMode && (
              <Button
                size="small"
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => {
                  const nextId = getNextAvailableId(participantsList);
                  setFormData({ UserID: nextId, Block: 'A' });
                  setEditMode(null);
                }}
                sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Nouveau
              </Button>
            )}
          </Box>

          <p className="participant-panel-subtitle">
            Tout les participants déjà créés.
          </p>

          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Rechercher par identifiant..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: historySearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setHistorySearch('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {loadingList ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} />
            </Box>
          ) : filteredParticipants.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#64748b' }}>
              <PersonIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="body2">
                {historySearch
                  ? `Aucun participant ne correspond à "${historySearch}".`
                  : 'Aucun participant enregistré pour le moment.'}
              </Typography>
            </Box>
          ) : (
            <div className="participant-history-list">
              {filteredParticipants.map((p) => {
                const uid = String(p.UserID || p.id);
                const active = isCurrentActive(uid);
                const isBeingEdited = editMode && String(editMode.UserID || editMode.id) === uid;

                return (
                  <div
                    key={uid}
                    className={`participant-history-item ${active ? 'active' : ''} ${
                      isBeingEdited ? 'being-edited' : ''
                    }`}
                  >
                    <div className="participant-history-meta">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1" fontWeight={700} color="#0f172a">
                          #{uid}
                        </Typography>

                        {active && (
                          <Chip
                            icon={<CheckCircleIcon fontSize="small" />}
                            label="Session active"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        )}

                        {isBeingEdited && (
                          <Chip
                            label="En modification"
                            size="small"
                            color="warning"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                          />
                        )}

                        {p.Block && (
                          <Chip
                            label={`Bloc: ${p.Block}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.68rem', backgroundColor: '#f1f5f9' }}
                          />
                        )}

                        {p.Technique && (
                          <Chip
                            label={`Tech: ${p.Technique}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.68rem', backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                          />
                        )}
                      </Box>

                      {p.formCount !== undefined && (
                        <Typography variant="caption" color="#64748b">
                          {p.formCount} formulaire{p.formCount > 1 ? 's' : ''} complété{p.formCount > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </div>

                    <div className="participant-history-actions">
                      <Tooltip title="Activer pour la session">
                        <Button
                          size="small"
                          variant={active ? 'contained' : 'outlined'}
                          color="primary"
                          onClick={() => handleSelectFromHistory(p)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            p: '3px 8px',
                            minWidth: '55px',
                            borderRadius: '6px',
                          }}
                        >
                          {active ? 'Actif' : 'Activer'}
                        </Button>
                      </Tooltip>

                      <Tooltip title="Modifier les variables de ce participant">
                        <IconButton
                          size="small"
                          color={isBeingEdited ? 'warning' : 'default'}
                          onClick={() => handleStartEdit(p)}
                          sx={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '4px',
                            backgroundColor: isBeingEdited ? '#fff7ed' : '#ffffff',
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Voir les réponses du participant">
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleSelectFromHistory(p);
                            navigate('/participant-answers');
                          }}
                          sx={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '4px',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <FactCheckIcon fontSize="small" sx={{ color: '#475569' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer ce participant">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, participant: p })}
                          sx={{
                            border: '1px solid #fee2e2',
                            borderRadius: '6px',
                            padding: '4px',
                            backgroundColor: '#fff5f5',
                            '&:hover': { backgroundColor: '#fee2e2' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, participant: null })}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626' }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment supprimer le <strong>Participant #{deleteDialog.participant?.UserID || deleteDialog.participant?.id}</strong> ?
            <br />
            Cette action supprimera également ses réponses associées dans la base de données.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, participant: null })}
            disabled={deleting}
            color="inherit"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={popup.open}
        autoHideDuration={4000}
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
    </div>
  );
}

export default Participant;