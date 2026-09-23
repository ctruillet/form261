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
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ScienceIcon from '@mui/icons-material/Science';

import { ParticipantContext } from '../context/ParticipantContext';
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

export default function Participant() {
  const {
    participantData,
    updateParticipant,
    clearParticipant,
    protocol,
    activeTrials,
    currentTrialIndex,
    currentTrial,
    activeFactors,
    nextTrial,
    prevTrial,
    setTrialIndex,
  } = useContext(ParticipantContext);

  const navigate = useNavigate();

  // États locaux
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [protocolStats, setProtocolStats] = useState(null);
  const [availableForms, setAvailableForms] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [historySearch, setHistorySearch] = useState('');

  // Formulaire d'ajout simplifié
  const [newUserId, setNewUserId] = useState('');
  const [newBlock, setNewBlock] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, participant: null });
  const [launchMenuOpen, setLaunchMenuOpen] = useState(false);
  const [evaluatingPhase, setEvaluatingPhase] = useState(null);
  const [popup, setPopup] = useState({ open: false, message: '', severity: 'info' });

  // 1. Charger la liste des participants, des formulaires, des réponses et des stats de protocole
  const fetchData = useCallback(async () => {
    setLoadingList(true);
    try {
      const [partRes, statsRes, formsRes, respRes] = await Promise.all([
        axios.get('/api/participants'),
        axios.get('/api/protocol/stats').catch(() => ({ data: null })),
        axios.get('/api/forms').catch(() => ({ data: [] })),
        axios.get('/api/data/responses').catch(() => ({ data: [] }))
      ]);

      setParticipantsList(partRes.data || []);
      if (statsRes.data) setProtocolStats(statsRes.data);
      setAvailableForms(formsRes.data || []);
      setAllResponses(respRes.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données :', error);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Initialiser le formulaire d'ajout avec l'ID suivant et le bloc équilibré
  useEffect(() => {
    if (!newUserId) {
      setNewUserId(getNextAvailableId(participantsList));
    }
    if (protocolStats?.suggestedBlock && !newBlock) {
      setNewBlock(protocolStats.suggestedBlock);
    }
  }, [participantsList, protocolStats, newUserId, newBlock]);

  // Filtrage des participants par recherche
  const filteredParticipants = useMemo(() => {
    if (!historySearch.trim()) return participantsList;
    const q = historySearch.toLowerCase().trim();
    return participantsList.filter((p) => String(p.UserID || p.id).toLowerCase().includes(q));
  }, [participantsList, historySearch]);

// Palette de couleurs pour badges
const COLOR_PALETTE = [
  { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
  { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' },
  { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
  { bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
  { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e' },
  { bg: '#fdf4ff', border: '#f0abfc', text: '#c026d3' },
  { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' },
];

const getModalityColor = (str) => {
  if (!str) return COLOR_PALETTE[0];
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

  // Détection dynamique des macro-blocs
  const hasMacroBlocks = useMemo(() => {
    return activeTrials.length > 0 && activeTrials[0]?.macroBlock !== undefined;
  }, [activeTrials]);

  // Groupement dynamique par Macro-Bloc s'ils existent
  const groupedPhases = useMemo(() => {
    if (!activeTrials || activeTrials.length === 0 || !hasMacroBlocks) return [];
    const macroMap = new Map();
    const activeBlockedKey = protocol?.blockedFactorName || Object.keys(activeTrials[0]).find(k => !['trialOrder', 'macroBlock', 'subTrial'].includes(k)) || 'Condition';

    activeTrials.forEach((trial) => {
      const macroId = trial.macroBlock || 1;
      const mainVal = trial[activeBlockedKey] !== undefined ? String(trial[activeBlockedKey]) : `Phase ${macroId}`;

      if (!macroMap.has(macroId)) {
        macroMap.set(macroId, {
          macroBlock: macroId,
          mainFactor: activeBlockedKey,
          mainValue: mainVal,
          trials: []
        });
      }
      macroMap.get(macroId).trials.push(trial);
    });

    return Array.from(macroMap.values());
  }, [activeTrials, hasMacroBlocks, protocol?.blockedFactorName]);

  // Pourcentage de progression de la session active
  const progressPercent = useMemo(() => {
    if (!activeTrials || activeTrials.length === 0) return 0;
    return Math.round((currentTrialIndex / activeTrials.length) * 100);
  }, [activeTrials, currentTrialIndex]);

  // Créer un participant et démarrer immédiatement sa session
  const handleCreateParticipant = async (e) => {
    if (e) e.preventDefault();

    const uid = String(newUserId || '').trim();
    if (!uid) {
      setPopup({ open: true, message: 'Veuillez saisir un identifiant de sujet.', severity: 'error' });
      return;
    }

    const exists = participantsList.some((p) => String(p.UserID || p.id) === uid);
    if (exists) {
      setPopup({ open: true, message: `Le sujet #${uid} existe déjà dans la base.`, severity: 'warning' });
      return;
    }

    const chosenBlock = newBlock || protocolStats?.suggestedBlock || 'A1';

    setSubmitting(true);
    try {
      const payload = {
        id: uid,
        UserID: uid,
        Block: chosenBlock,
        currentTrialIndex: 1
      };

      await axios.post('/api/participants', payload);

      // Activation immédiate dans la session de passation
      updateParticipant(payload);

      setPopup({
        open: true,
        message: `Sujet #${uid} créé et activé dans le Groupe ${chosenBlock} !`,
        severity: 'success'
      });

      // Préparer le prochain sujet
      const nextId = getNextUserId(uid);
      setNewUserId(nextId);

      await fetchData();
    } catch (err) {
      console.error('Erreur création participant:', err);
      const msg = err.response?.data?.message || 'Erreur lors de la création du participant.';
      setPopup({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Passer au sujet suivant (+1)
  const handleNextSubject = () => {
    const currentId = participantData?.UserID || newUserId || '0';
    const nextId = getNextUserId(currentId);
    const nextBlock = protocolStats?.suggestedBlock || 'A1';
    const payload = {
      id: nextId,
      UserID: nextId,
      Block: nextBlock,
      currentTrialIndex: 1
    };

    updateParticipant(payload);
    setNewUserId(getNextUserId(nextId));
    setNewBlock(nextBlock);

    setPopup({
      open: true,
      message: `Passage au Sujet suivant : #${nextId} (Groupe ${nextBlock})`,
      severity: 'success'
    });
  };

  // Suppression d'un participant
  const handleConfirmDelete = async () => {
    const target = deleteDialog.participant;
    if (!target) return;

    const targetId = String(target.UserID || target.id);
    setDeleting(true);
    try {
      await axios.delete(`/api/participants/${targetId}`);

      if (String(participantData?.UserID) === targetId) {
        clearParticipant();
      }

      setPopup({ open: true, message: `Sujet #${targetId} supprimé avec succès.`, severity: 'info' });
      setDeleteDialog({ open: false, participant: null });
      await fetchData();
    } catch (err) {
      console.error(err);
      setPopup({ open: true, message: 'Erreur lors de la suppression.', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Activer un participant depuis la liste
  const handleActivateParticipant = (p) => {
    const uid = String(p.UserID || p.id);
    const sessionObj = {
      ...p,
      UserID: uid,
      Block: p.Block || 'A1',
      currentTrialIndex: p.currentTrialIndex || 1
    };
    updateParticipant(sessionObj);
    setPopup({ open: true, message: `Sujet #${uid} activé pour la session.`, severity: 'info' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const preForms = useMemo(() => {
    return availableForms.filter((f) => f.timing === 'pre');
  }, [availableForms]);

  const postModalityForms = useMemo(() => {
    return availableForms.filter((f) => f.timing === 'post-modality');
  }, [availableForms]);

  const trialForms = useMemo(() => {
    return availableForms.filter((f) => f.timing === 'trial');
  }, [availableForms]);

  const postForms = useMemo(() => {
    return availableForms.filter((f) => f.timing === 'post');
  }, [availableForms]);

  // Compter le nombre de réponses d'un participant pour un formulaire (et optionnellement un facteur donné)
  const getParticipantResponsesCount = useCallback((formFields, factorKey, factorValue) => {
    if (!participantData?.UserID || !allResponses || allResponses.length === 0) return 0;
    let count = 0;
    allResponses.forEach((fileItem) => {
      if (!fileItem.content) return;
      fileItem.content.forEach((resp) => {
        if (resp.fieldsFile !== formFields) return;
        const uid = resp.parametersFields?.UserID;
        if (String(uid) !== String(participantData.UserID)) return;
        if (factorKey && factorValue !== undefined) {
          const respFactorVal = resp.parametersFields?.[factorKey];
          if (String(respFactorVal) !== String(factorValue)) return;
        }
        count++;
      });
    });
    return count;
  }, [participantData?.UserID, allResponses]);

  // Lancer un formulaire avec ses paramètres spécifiques
  const handleLaunchSpecificForm = (form, extraParams = {}) => {
    const query = new URLSearchParams();
    query.set('fields', form.fields || '');
    query.set('param', form.param || '');
    if (participantData?.UserID) query.set('UserID', participantData.UserID);
    if (participantData?.Block) query.set('Block', participantData.Block);

    Object.entries(extraParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, String(v));
      }
    });

    navigate(`/form?${query.toString()}`);
  };

  // Lancer un formulaire directement pour l'essai courant
  const handleLaunchForm = (form) => {
    handleLaunchSpecificForm(form);
  };

  const isCurrentActive = (uid) => String(participantData?.UserID) === String(uid);

  return (
    <div className="participant-container">
      {/* En-tête de la page */}
      <div className="participant-header">
        <div className="participant-title-group">
          <ScienceIcon sx={{ fontSize: 32, color: '#2563eb' }} />
          <div>
            <h1 className="participant-title">Session d'Expérimentation & Sujets</h1>
            <Typography variant="caption" color="#64748b">
              Suivi en direct du déroulement du protocole, contrebalancement et saisie des sujets.
            </Typography>
          </div>
        </div>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TuneIcon />}
            onClick={() => navigate('/protocol')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Plan d'Expérience (Facteurs)
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Tous les formulaires
          </Button>
          {participantData?.UserID && (
            <Button
              variant="contained"
              size="small"
              startIcon={<FactCheckIcon />}
              onClick={() => navigate('/participant-answers')}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', boxShadow: 'none' }}
            >
              Réponses du sujet
            </Button>
          )}
        </Stack>
      </div>

      {/* ========================================================================= */}
      {/* SESSION ACTIVE DU PARTICIPANT (Cockpit en 3 étapes clés)                  */}
      {/* ========================================================================= */}
      {participantData?.UserID ? (
        <Box sx={{ mb: 4 }}>
          {/* 1. BARRE DE COMMANDE SUPÉRIEURE DE LA SESSION */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: '16px',
              border: '2px solid #2563eb',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.25)',
                  display: 'inline-block'
                }}
              />
              <div>
                <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                  Session en cours : Sujet #{participantData.UserID}
                </Typography>
                <Typography variant="caption" color="#64748b">
                  Groupe de contrebalancement attribué : <strong>Bloc {participantData.Block}</strong>
                </Typography>
              </div>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Prépare le sujet suivant (+1) avec le bloc automatiquement équilibré">
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<SkipNextIcon />}
                  onClick={handleNextSubject}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Sujet suivant (+1)
                </Button>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={clearParticipant}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Déconnecter la session
              </Button>
            </Stack>
          </Paper>

          {/* ÉTAPE 1 : AU TOUT DÉBUT (PRÉ-EXPÉRIENCE) */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: '14px',
              border: '1.5px solid #bae6fd',
              backgroundColor: '#f8fafc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip
                label="ÉTAPE 1 • PRÉ-EXPÉRIENCE"
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.7rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}
              />
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                Questionnaires initiaux (Profil & Consentement)
              </Typography>
            </Box>
            <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>
              À faire remplir au participant <strong>au tout début de la séance</strong>, avant de démarrer les essais. Ces données sont indépendantes des modalités ou des tâches.
            </Typography>

            {preForms.length === 0 ? (
              <Typography variant="caption" color="#94a3b8" sx={{ fontStyle: 'italic' }}>
                Aucun questionnaire pré-expérience configuré.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: preForms.length > 1 ? 'repeat(2, 1fr)' : '1fr' }, gap: 1.5 }}>
                {preForms.map((f) => {
                  const count = getParticipantResponsesCount(f.fields);
                  return (
                    <Paper
                      key={f.id ?? f.name}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: count > 0 ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                        backgroundColor: count > 0 ? '#f0fdf4' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                            {f.name}
                          </Typography>
                          {count > 0 ? (
                            <Chip icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />} label={`Complété (${count})`} color="success" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                          ) : (
                            <Chip label="À remplir" color="info" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="#64748b" sx={{ display: 'block' }}>
                          {f.description || "Informations initiales du sujet"}
                        </Typography>
                      </Box>
                      <Button
                        variant={count > 0 ? "outlined" : "contained"}
                        color="primary"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleLaunchSpecificForm(f)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', minWidth: '120px' }}
                      >
                        {count > 0 ? "Modifier" : "Remplir"}
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* ÉTAPE 2 : DÉROULEMENT DU PROTOCOLE & ÉVALUATIONS DE MODALITÉ */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: '14px',
              border: '1.5px solid #c7d2fe',
              backgroundColor: '#ffffff'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip
                label="ÉTAPE 2 • PROTOCOLE EXPÉRIMENTAL"
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.7rem', backgroundColor: '#e0e7ff', color: '#4338ca' }}
              />
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                Passation des essais & Évaluations par modalité
              </Typography>
            </Box>
            <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>
              Déroulez les essais ci-dessous selon le contrebalancement du <strong>Bloc {participantData.Block}</strong>, puis évaluez chaque modalité à la fin de sa phase.
            </Typography>

            {/* HERO CARD : ESSAI EN COURS */}
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: '280px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={`ESSAI ${currentTrialIndex} SUR ${activeTrials.length || 0}`}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.5px' }}
                    />
                    {currentTrial?.macroBlock !== undefined && (
                      <Chip
                        label={`Phase ${currentTrial.macroBlock}`}
                        size="small"
                        sx={{ fontWeight: 700, backgroundColor: '#dbeafe', color: '#1e40af' }}
                      />
                    )}
                  </Box>

                  <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase', display: 'block', mb: 1, letterSpacing: '0.5px' }}>
                    Conditions expérimentales de cet essai :
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 2 }}>
                    {Object.entries(activeFactors).map(([fKey, fVal]) => {
                      const col = getModalityColor(String(fVal));
                      return (
                        <Box
                          key={fKey}
                          sx={{
                            px: 1.8,
                            py: 0.8,
                            borderRadius: '8px',
                            backgroundColor: col.bg,
                            border: `2px solid ${col.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <Typography variant="caption" fontWeight={700} color="#64748b">
                            {fKey} :
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color={col.text}>
                            {String(fVal)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  <Typography variant="body2" color="#475569">
                    💡 <strong>Consigne :</strong> Réalisez la passation de l'essai selon les conditions expérimentales ci-dessus.
                  </Typography>
                </Box>

                {/* Boutons d'action */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'stretch', minWidth: '240px' }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => setLaunchMenuOpen(true)}
                    sx={{
                      backgroundColor: '#2563eb',
                      fontWeight: 700,
                      py: 1.4,
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      '&:hover': { backgroundColor: '#1d4ed8' }
                    }}
                  >
                    Remplir un questionnaire
                  </Button>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      disabled={currentTrialIndex <= 1}
                      startIcon={<SkipPreviousIcon />}
                      onClick={prevTrial}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}
                    >
                      Étape préc.
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      disabled={currentTrialIndex >= (activeTrials.length || 0)}
                      endIcon={<SkipNextIcon />}
                      onClick={nextTrial}
                      sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}
                    >
                      Étape suiv.
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Barre de progression */}
              <Box sx={{ mt: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} color="#1e40af">
                    Avancement du protocole pour ce sujet
                  </Typography>
                  <Typography variant="caption" fontWeight={800} color="#1e40af">
                    {progressPercent}% terminé ({currentTrialIndex} / {activeTrials.length || 0} essais)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercent}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#bfdbfe' }}
                />
              </Box>
            </Paper>

            {/* CHRONOLOGIE DES PHASES / MACRO-BLOCS */}
            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Séquence des phases & Évaluations par modalité :
            </Typography>

            {hasMacroBlocks ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: `repeat(${Math.min(groupedPhases.length, 4)}, 1fr)` }, gap: 1.5 }}>
                {groupedPhases.map((phase, pIdx) => {
                  const isCurrentPhase = phase.macroBlock === (currentTrial?.macroBlock || 1);
                  const isDone = phase.macroBlock < (currentTrial?.macroBlock || 1);
                  const evalCount = postModalityForms.reduce((sum, f) => {
                    return sum + getParticipantResponsesCount(f.fields, phase.mainFactor, phase.mainValue);
                  }, 0);

                  return (
                    <Paper
                      key={pIdx}
                      sx={{
                        p: 1.8,
                        borderRadius: '12px',
                        border: isCurrentPhase ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isCurrentPhase ? '#ffffff' : isDone ? '#f8fafc' : '#ffffff',
                        boxShadow: isCurrentPhase ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" fontWeight={800} color={isCurrentPhase ? '#2563eb' : '#64748b'}>
                            PHASE {phase.macroBlock}
                          </Typography>
                          {isDone && <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />}
                          {isCurrentPhase && (
                            <Chip label="En cours" color="primary" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />
                          )}
                        </Box>

                        <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ mb: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {phase.mainValue}
                        </Typography>

                        <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                          {phase.trials.map((t) => {
                            const isCur = t.trialOrder === currentTrialIndex;
                            const isTrialDone = t.trialOrder < currentTrialIndex;
                            const subEntries = Object.entries(t).filter(
                              ([k]) => !['trialOrder', 'macroBlock', 'subTrial', phase.mainFactor].includes(k)
                            );
                            const subDesc = subEntries.map(([k, v]) => subEntries.length === 1 ? String(v) : `${k}: ${v}`).join(' • ');

                            return (
                              <Box
                                key={t.trialOrder}
                                onClick={() => setTrialIndex(t.trialOrder)}
                                sx={{
                                  p: '6px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  backgroundColor: isCur ? '#2563eb' : isTrialDone ? '#e2e8f0' : '#f1f5f9',
                                  color: isCur ? '#ffffff' : '#334155',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    backgroundColor: isCur ? '#1d4ed8' : '#cbd5e1'
                                  }
                                }}
                              >
                                <Typography variant="caption" fontWeight={isCur ? 800 : 600}>
                                  #{t.trialOrder} {subDesc ? `: ${subDesc}` : ''}
                                </Typography>
                                {isTrialDone && <CheckCircleIcon sx={{ fontSize: 14, color: '#059669' }} />}
                                {isCur && <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>📍 ACTIF</span>}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>

                      {/* Bouton d'évaluation de cette modalité */}
                      {postModalityForms.length > 0 && (
                        <Box sx={{ pt: 1.2, borderTop: '1px dashed #e2e8f0' }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<FactCheckIcon fontSize="small" />}
                            onClick={() => setEvaluatingPhase(phase)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              backgroundColor: isCurrentPhase ? '#2563eb' : '#475569',
                              '&:hover': { backgroundColor: isCurrentPhase ? '#1d4ed8' : '#334155' }
                            }}
                          >
                            Évaluer {phase.mainValue}
                          </Button>
                          {evalCount > 0 && (
                            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, display: 'block', textAlign: 'center', mt: 0.5, fontSize: '0.68rem' }}>
                              ✓ {evalCount} évaluation{evalCount > 1 ? 's' : ''} enregistrée{evalCount > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            ) : (
              /* AFFICHAGE DES ESSAIS QUAND PAS DE MACRO-BLOCS */
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                {activeTrials.map((t) => {
                  const isCur = t.trialOrder === currentTrialIndex;
                  const isTrialDone = t.trialOrder < currentTrialIndex;
                  const factorPairs = Object.entries(t).filter(
                    ([k]) => !['trialOrder', 'macroBlock', 'subTrial'].includes(k)
                  );

                  return (
                    <Paper
                      key={t.trialOrder}
                      onClick={() => setTrialIndex(t.trialOrder)}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: isCur ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isCur ? '#eff6ff' : isTrialDone ? '#f8fafc' : '#ffffff',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: '#2563eb' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" fontWeight={800} color={isCur ? '#2563eb' : '#64748b'}>
                          ESSAI #{t.trialOrder}
                        </Typography>
                        {isTrialDone && <CheckCircleIcon sx={{ fontSize: 14, color: '#059669' }} />}
                        {isCur && <Chip label="Actif" color="primary" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }} />}
                      </Box>
                      <Stack spacing={0.5}>
                        {factorPairs.map(([fk, fv]) => (
                          <Typography key={fk} variant="caption" color="#334155" sx={{ display: 'block' }}>
                            <strong>{fk} :</strong> {String(fv)}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* ÉTAPE 3 : CLÔTURE & BILAN FINAL (POST-EXPÉRIENCE) */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '14px',
              border: '1.5px solid #a7f3d0',
              backgroundColor: '#f8fafc'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip
                label="ÉTAPE 3 • BILAN FINAL"
                size="small"
                sx={{ fontWeight: 800, fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#15803d' }}
              />
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                Clôture & Questionnaires finaux
              </Typography>
            </Box>
            <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>
              À faire remplir au participant <strong>à la fin de l'ensemble des essais</strong> (classement des techniques, commentaires libres, bilan général).
            </Typography>

            {postForms.length === 0 ? (
              <Typography variant="caption" color="#94a3b8" sx={{ fontStyle: 'italic' }}>
                Aucun questionnaire de clôture configuré.
              </Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: postForms.length > 1 ? 'repeat(2, 1fr)' : '1fr' }, gap: 1.5 }}>
                {postForms.map((f) => {
                  const count = getParticipantResponsesCount(f.fields);
                  return (
                    <Paper
                      key={f.id ?? f.name}
                      sx={{
                        p: 2,
                        borderRadius: '10px',
                        border: count > 0 ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                        backgroundColor: count > 0 ? '#f0fdf4' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                            {f.name}
                          </Typography>
                          {count > 0 ? (
                            <Chip icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />} label={`Complété (${count})`} color="success" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                          ) : (
                            <Chip label="À remplir à la fin" color="success" variant="outlined" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="#64748b" sx={{ display: 'block' }}>
                          {f.description || "Bilan de clôture de l'expérience"}
                        </Typography>
                      </Box>
                      <Button
                        variant={count > 0 ? "outlined" : "contained"}
                        color="success"
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleLaunchSpecificForm(f)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', minWidth: '120px' }}
                      >
                        {count > 0 ? "Modifier" : "Remplir"}
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        /* ALERTE AUCUN SUJET ACTIF */
        <Alert severity="info" sx={{ mb: 4, borderRadius: '12px', fontSize: '0.9rem' }}>
          Aucun participant n'est actif pour le moment. Renseignez l'identifiant ci-dessous pour lancer la session d'un sujet.
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2 : GRILLE À 2 COLONNES (NOUVEAU PARTICIPANT & HISTORIQUE)        */}
      {/* ========================================================================= */}
      <div className="participant-layout-grid">
        {/* Colonne Gauche : Démarrer un nouveau participant */}
        <div className="participant-card-panel">
          <h2 className="participant-panel-title">
            <PersonAddIcon fontSize="small" sx={{ color: '#2563eb' }} />
            Démarrer un nouveau sujet
          </h2>
          <p className="participant-panel-subtitle">
            Le groupe de contrebalancement est automatiquement attribué pour garantir l'équilibre parfait de votre étude.
          </p>

          <form onSubmit={handleCreateParticipant}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="#334155" sx={{ display: 'block', mb: 0.5 }}>
                  Identifiant du participant (UserID unique) *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ex : 1, 2, P01..."
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Incrémenter (+1)">
                          <IconButton
                            size="small"
                            onClick={() => setNewUserId(getNextUserId(newUserId))}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} color="#334155">
                    Groupe de contrebalancement (Bloc) *
                  </Typography>
                  {protocolStats?.suggestedBlock && (
                    <Typography variant="caption" color="#059669" fontWeight={700}>
                      ★ Suggéré pour équilibrer : Bloc {protocolStats.suggestedBlock}
                    </Typography>
                  )}
                </Box>

                <TextField
                  select
                  fullWidth
                  size="small"
                  value={newBlock}
                  onChange={(e) => setNewBlock(e.target.value)}
                  helperText="Les blocs alternent les ordres de passage des facteurs expérimentaux selon le plan de contrebalancement."
                >
                  {(protocolStats?.blocks || ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']).map((b) => {
                    const count = protocolStats?.distribution?.[b] || 0;
                    const isSugg = protocolStats?.suggestedBlock === b;
                    return (
                      <MenuItem key={b} value={b}>
                        <strong>Bloc {b}</strong> ({count} sujet{count > 1 ? 's' : ''}) {isSugg ? '— RECOMMANDÉ' : ''}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>

              {/* Jauge visuelle de répartition des blocs */}
              {protocolStats && (
                <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                    Équilibre actuel des groupes :
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {(protocolStats.blocks || []).map((b) => (
                      <Chip
                        key={b}
                        label={`${b} : ${protocolStats.distribution?.[b] || 0}`}
                        size="small"
                        color={protocolStats.suggestedBlock === b ? 'primary' : 'default'}
                        variant={protocolStats.suggestedBlock === b ? 'filled' : 'outlined'}
                        onClick={() => setNewBlock(b)}
                        sx={{ fontWeight: 700, cursor: 'pointer', height: 22, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1.2,
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#1d4ed8' }
                }}
              >
                {submitting ? 'Création...' : 'Créer et lancer la session du sujet'}
              </Button>
            </Stack>
          </form>
        </div>

        {/* Colonne Droite : Participants enregistrés */}
        <div className="participant-card-panel">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <h2 className="participant-panel-title" style={{ margin: 0 }}>
              <PersonIcon fontSize="small" sx={{ color: '#6366f1' }} />
              Sujets enregistrés ({participantsList.length})
            </h2>

            <Button
              size="small"
              variant="text"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewUserId(getNextAvailableId(participantsList));
                setNewBlock(protocolStats?.suggestedBlock || 'A1');
              }}
              sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Nouveau
            </Button>
          </Box>

          <p className="participant-panel-subtitle">
            Cliquez sur <strong>Activer</strong> pour reprendre la session d'un sujet existant.
          </p>

          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Rechercher un sujet..."
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
              <Typography variant="body2">
                {historySearch ? `Aucun sujet ne correspond à "${historySearch}".` : 'Aucun sujet enregistré pour le moment.'}
              </Typography>
            </Box>
          ) : (
            <div className="participant-history-list">
              {filteredParticipants.map((p) => {
                const uid = String(p.UserID || p.id);
                const active = isCurrentActive(uid);

                return (
                  <div
                    key={uid}
                    className={`participant-history-item ${active ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      backgroundColor: active ? '#f0fdf4' : '#ffffff',
                      border: active ? '1px solid #86efac' : '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                          #{uid}
                        </Typography>
                        {p.Block && (
                          <Chip
                            label={`Bloc ${p.Block}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#f1f5f9' }}
                          />
                        )}
                        {active && (
                          <Chip
                            label="Actif"
                            color="success"
                            size="small"
                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                          />
                        )}
                      </Box>
                      {p.formCount !== undefined && (
                        <Typography variant="caption" color="#64748b">
                          {p.formCount} formulaire{p.formCount > 1 ? 's' : ''} complété{p.formCount > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </div>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant={active ? 'contained' : 'outlined'}
                        color="primary"
                        onClick={() => handleActivateParticipant(p)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px' }}
                      >
                        {active ? 'Session active' : 'Activer'}
                      </Button>

                      <Tooltip title="Voir ses réponses">
                        <IconButton
                          size="small"
                          onClick={() => {
                            handleActivateParticipant(p);
                            navigate('/participant-answers');
                          }}
                          sx={{ border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        >
                          <FactCheckIcon fontSize="small" sx={{ color: '#475569' }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, participant: p })}
                          sx={{ border: '1px solid #fee2e2', borderRadius: '6px', backgroundColor: '#fff5f5' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL D'ÉVALUATION DE FIN DE MODALITÉ                                    */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(evaluatingPhase)}
        onClose={() => setEvaluatingPhase(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 0.5 }}>
          Évaluer la modalité : {evaluatingPhase?.mainValue}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Pour le <strong>Sujet #{participantData?.UserID}</strong> (Groupe {participantData?.Block}, Phase {evaluatingPhase?.macroBlock}) :<br />
            Sélectionnez le questionnaire à administrer pour cette modalité :
          </DialogContentText>

          <Stack spacing={1.2}>
            {postModalityForms.map((form) => {
              const count = evaluatingPhase
                ? getParticipantResponsesCount(form.fields, evaluatingPhase.mainFactor, evaluatingPhase.mainValue)
                : 0;

              return (
                <Paper
                  key={form.id ?? form.name}
                  onClick={() => {
                    const phase = evaluatingPhase;
                    setEvaluatingPhase(null);
                    handleLaunchSpecificForm(form, { [phase.mainFactor]: phase.mainValue });
                  }}
                  sx={{
                    p: 1.8,
                    borderRadius: '10px',
                    border: count > 0 ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                    backgroundColor: count > 0 ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: '#2563eb',
                      backgroundColor: '#eff6ff',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        {form.name}
                      </Typography>
                      {form.tag && (
                        <Chip label={form.tag} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                      )}
                      {count > 0 && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />}
                          label="Déjà répondu"
                          color="success"
                          size="small"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="#64748b" sx={{ display: 'block', mt: 0.3 }}>
                      {form.description || "Questionnaire d'évaluation de modalité"}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEvaluatingPhase(null)} color="inherit" sx={{ textTransform: 'none' }}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL DE CHOIX DU QUESTIONNAIRE GÉNÉRAL / ESSAI                         */}
      {/* ========================================================================= */}
      <Dialog
        open={launchMenuOpen}
        onClose={() => setLaunchMenuOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', pb: 1 }}>
          Sélectionner le questionnaire à passer
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Pour le <strong>Sujet #{participantData?.UserID}</strong> (Essai #{currentTrialIndex}) :<br />
            {Object.entries(activeFactors).length > 0 && (
              <span>Conditions actuelles : <strong>{Object.entries(activeFactors).map(([k, v]) => `${k}: ${v}`).join(' • ')}</strong></span>
            )}
          </DialogContentText>

          {/* Catégories de formulaires */}
          <Stack spacing={2}>
            {/* 1. Évaluations de fin de modalité */}
            {postModalityForms.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={800} color="#7c3aed" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                  🔬 Évaluations de modalité ({Object.values(activeFactors)[0] || 'courante'}) :
                </Typography>
                <Stack spacing={1}>
                  {postModalityForms.map((form) => (
                    <Paper
                      key={form.id ?? form.name}
                      onClick={() => {
                        setLaunchMenuOpen(false);
                        const blockedKey = protocol?.blockedFactorName || Object.keys(activeFactors)[0] || 'Technique';
                        const blockedVal = activeFactors[blockedKey] || Object.values(activeFactors)[0] || '';
                        handleLaunchSpecificForm(form, blockedVal ? { [blockedKey]: blockedVal } : {});
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#7c3aed',
                          backgroundColor: '#f5f3ff',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                            {form.name}
                          </Typography>
                          <Chip label="Modalité" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#f3e8ff', color: '#7c3aed' }} />
                        </Box>
                        <Typography variant="caption" color="#64748b">
                          {form.description || "Questionnaire d'évaluation"}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* 2. Questionnaires d'essai */}
            {trialForms.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={800} color="#b45309" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                  🎯 Questionnaires d'essai (Essai #{currentTrialIndex}) :
                </Typography>
                <Stack spacing={1}>
                  {trialForms.map((form) => (
                    <Paper
                      key={form.id ?? form.name}
                      onClick={() => {
                        setLaunchMenuOpen(false);
                        handleLaunchSpecificForm(form, { TrialOrder: currentTrialIndex, ...activeFactors });
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: '#f59e0b',
                          backgroundColor: '#fffbeb',
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                          {form.name}
                        </Typography>
                        <Typography variant="caption" color="#64748b">
                          {form.description || "Questionnaire par essai"}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: '#b45309', fontSize: 20 }} />
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* 3. Questionnaires initiaux & finaux */}
            <Box>
              <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', mb: 1 }}>
                📋 Questionnaires généraux (Pré & Post-expérience) :
              </Typography>
              <Stack spacing={1}>
                {[...preForms, ...postForms].map((form) => (
                  <Paper
                    key={form.id ?? form.name}
                    onClick={() => {
                      setLaunchMenuOpen(false);
                      handleLaunchSpecificForm(form);
                    }}
                    sx={{
                      p: 1.5,
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: '#2563eb',
                        backgroundColor: '#eff6ff',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                          {form.name}
                        </Typography>
                        <Chip
                          label={form.timing === 'pre' ? 'Pré-expé' : 'Bilan final'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            backgroundColor: form.timing === 'pre' ? '#e0f2fe' : '#dcfce7',
                            color: form.timing === 'pre' ? '#0369a1' : '#15803d'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="#64748b">
                        {form.description || "Questionnaire général"}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLaunchMenuOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Annuler
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal confirmation suppression */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, participant: null })}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#dc2626' }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Voulez-vous vraiment supprimer le <strong>Sujet #{deleteDialog.participant?.UserID || deleteDialog.participant?.id}</strong> ?
            <br />
            Ses réponses associées seront également effacées.
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