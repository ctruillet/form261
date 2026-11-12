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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { ParticipantContext } from '../context/ParticipantContext';
import { buildSessionSteps, buildStepUrl, getTrialFactors } from '../utils/sessionSteps';

// Incrémente un identifiant de sujet (ex: 1 -> 2, P01 -> P02)
const getNextUserId = (currentId) => {
  if (!currentId) return '1';
  const str = String(currentId).trim();
  const match = str.match(/^(.*?)(\d+)$/);
  if (match) {
    const num = parseInt(match[2], 10) + 1;
    return `${match[1]}${String(num).padStart(match[2].length, '0')}`;
  }
  return `${str}_2`;
};

// Identifiant proposé pour un nouveau sujet : la suite du dernier sujet enregistré
const suggestNewUserId = (list) => {
  if (!list || list.length === 0) return '1';
  const last = list[list.length - 1];
  return getNextUserId(last.UserID || last.id);
};

const panelSx = {
  p: { xs: 2, sm: 3 },
  mb: 2,
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
};

export default function Session() {
  const {
    participantData,
    updateParticipant,
    clearParticipant,
    protocol,
    activeTrials,
    setTrialIndex,
  } = useContext(ParticipantContext);

  const navigate = useNavigate();

  const [participantsList, setParticipantsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [protocolStats, setProtocolStats] = useState(null);
  const [forms, setForms] = useState([]);
  const [responses, setResponses] = useState([]);

  const [newUserId, setNewUserId] = useState('');
  const [newBlock, setNewBlock] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [popup, setPopup] = useState({ open: false, message: '', severity: 'info' });

  const activeId = participantData?.UserID ? String(participantData.UserID) : null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partRes, statsRes, formsRes, respRes] = await Promise.all([
        axios.get('/api/participants'),
        axios.get('/api/protocol/stats').catch(() => ({ data: null })),
        axios.get('/api/forms').catch(() => ({ data: [] })),
        axios.get('/api/data/responses').catch(() => ({ data: [] })),
      ]);
      setParticipantsList(partRes.data || []);
      setProtocolStats(statsRes.data);
      setForms(formsRes.data || []);
      setResponses(respRes.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données :', error);
      setPopup({ open: true, message: 'Impossible de charger les données de session.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pré-remplir le formulaire « nouveau sujet » : identifiant suivant et bloc équilibré
  useEffect(() => {
    if (!newUserId && !loading) setNewUserId(suggestNewUserId(participantsList));
    if (!newBlock && protocolStats?.suggestedBlock) setNewBlock(protocolStats.suggestedBlock);
  }, [participantsList, protocolStats, newUserId, newBlock, loading]);

  // Déroulé de la session du sujet actif
  const session = useMemo(() => {
    if (!activeId) return { steps: [], phases: [] };
    return buildSessionSteps({
      forms,
      trials: activeTrials,
      blockedFactorName: protocol?.blockedFactorName,
      responses,
      userId: activeId,
    });
  }, [activeId, forms, activeTrials, protocol?.blockedFactorName, responses]);

  const nextStep = session.steps.find((s) => !s.done) || null;
  const doneCount = session.steps.filter((s) => s.done).length;
  const nextGroupSteps = nextStep ? session.steps.filter((s) => s.group === nextStep.group) : [];
  const nextGroupRemaining = nextGroupSteps.filter((s) => !s.done).length;
  // Rappeler les essais à faire passer uniquement si l'étape n'est pas déjà entamée
  const nextStepNeedsTrials = Boolean(nextStep?.phase) && nextGroupSteps.every((s) => !s.done);

  // Étapes regroupées pour la liste compacte du déroulé
  const stepGroups = useMemo(() => {
    const groups = [];
    session.steps.forEach((step) => {
      let group = groups.find((g) => g.id === step.group);
      if (!group) {
        group = { id: step.group, label: step.groupLabel, steps: [] };
        groups.push(group);
      }
      group.steps.push(step);
    });
    return groups;
  }, [session.steps]);

  const notify = (message, severity = 'info') => setPopup({ open: true, message, severity });

  // Ouvrir le questionnaire d'une étape (en modification s'il est déjà rempli)
  const handleLaunchStep = (step) => {
    if (step.trial) {
      setTrialIndex(step.trial.trialOrder);
    } else if (step.phase) {
      const lastTrial = step.phase.trials[step.phase.trials.length - 1];
      if (lastTrial) setTrialIndex(lastTrial.trialOrder);
    }
    navigate(buildStepUrl(step, participantData));
  };

  const handleActivate = (p) => {
    const uid = String(p.UserID || p.id);
    updateParticipant({
      id: uid,
      UserID: uid,
      Block: p.Block || protocolStats?.suggestedBlock || 'A',
      currentTrialIndex: p.currentTrialIndex || 1,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Créer un sujet côté serveur puis ouvrir sa session
  const createAndActivate = async (uid, block) => {
    setSubmitting(true);
    try {
      const response = await axios.post('/api/participants', {
        id: uid,
        UserID: uid,
        Block: block,
        currentTrialIndex: 1,
      });
      const created = response.data || {};
      updateParticipant({ id: uid, UserID: uid, Block: created.Block || block, currentTrialIndex: 1 });
      setNewUserId(getNextUserId(uid));
      setNewBlock('');
      await fetchData();
    } catch (err) {
      console.error('Erreur création participant:', err);
      notify(err.response?.data?.message || 'Erreur lors de la création du sujet.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const uid = String(newUserId || '').trim();
    if (!uid) {
      notify('Saisissez un identifiant de sujet.', 'error');
      return;
    }
    const existing = participantsList.find((p) => String(p.UserID || p.id) === uid);
    if (existing) {
      // L'identifiant existe déjà : on reprend simplement sa session
      handleActivate(existing);
      return;
    }
    createAndActivate(uid, newBlock || protocolStats?.suggestedBlock || 'A');
  };

  // Sujet suivant (+1) : reprend le sujet s'il existe, sinon le crée avec le bloc équilibré
  const handleNextSubject = () => {
    if (submitting) return;
    const nextId = getNextUserId(activeId || newUserId || '0');
    const existing = participantsList.find((p) => String(p.UserID || p.id) === nextId);
    if (existing) handleActivate(existing);
    else createAndActivate(nextId, protocolStats?.suggestedBlock || 'A');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = String(deleteTarget.UserID || deleteTarget.id);
    setDeleting(true);
    try {
      await axios.delete(`/api/participants/${encodeURIComponent(targetId)}`);
      if (activeId === targetId) clearParticipant();
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      notify('Erreur lors de la suppression.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* En-tête : sujet en cours et actions de session */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            {activeId ? 'Session' : 'Sessions'}
          </Typography>
          {activeId && (
            <>
              <Chip label={`Sujet #${activeId}`} color="primary" sx={{ fontWeight: 800 }} />
              <Chip label={`Bloc ${participantData.Block}`} sx={{ fontWeight: 700 }} />
            </>
          )}
        </Box>
        {activeId && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              endIcon={<SkipNextIcon />}
              onClick={handleNextSubject}
              disabled={submitting}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Sujet suivant
            </Button>
            <Tooltip title="Ferme la session et revient au mode admin (protocole, questionnaires, résultats)">
              <Button size="small" color="inherit" onClick={clearParticipant} sx={{ textTransform: 'none', color: '#64748b' }}>
                Terminer la session
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      {activeId && (
        <>
          {/* PROCHAINE ÉTAPE : l'unique action à faire maintenant */}
          <Paper
            elevation={0}
            sx={{
              ...panelSx,
              backgroundColor: nextStep ? '#eff6ff' : '#f0fdf4',
              border: nextStep ? '1.5px solid #bfdbfe' : '1.5px solid #86efac',
            }}
          >
            {loading && session.steps.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            ) : session.steps.length === 0 ? (
              <Typography color="#475569">
                Aucun questionnaire n&apos;est défini. Ajoutez-en dans « Questionnaires ».
              </Typography>
            ) : nextStep ? (
              <>
                <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 800, letterSpacing: '1px' }}>
                  Prochaine étape · {nextStep.groupLabel}
                </Typography>

                {nextStepNeedsTrials && (
                  <Box sx={{ mt: 0.5, mb: 1.5 }}>
                    <Typography color="#0f172a" sx={{ mb: 1 }}>
                      1. Faites réaliser {nextStep.trial ? "l'essai" : 'les essais'} :
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(nextStep.trial ? [nextStep.trial] : nextStep.phase.trials).map((t) => (
                        <Chip
                          key={t.trialOrder}
                          label={`Essai ${t.trialOrder} — ${Object.values(getTrialFactors(t)).join(' · ')}`}
                          sx={{ fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #bfdbfe', color: '#1e3a8a' }}
                        />
                      ))}
                    </Box>
                    <Typography color="#0f172a" sx={{ mt: 1.5 }}>
                      2. Puis donnez l&apos;appareil au participant :
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="#0f172a">
                      {nextStep.form.name}
                    </Typography>
                    {nextGroupRemaining > 1 && (
                      <Typography variant="body2" color="#64748b">
                        Puis {nextGroupRemaining - 1} autre{nextGroupRemaining > 2 ? 's' : ''} questionnaire{nextGroupRemaining > 2 ? 's' : ''}, enchaîné{nextGroupRemaining > 2 ? 's' : ''} automatiquement.
                      </Typography>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => handleLaunchStep(nextStep)}
                    sx={{ textTransform: 'none', fontWeight: 800, fontSize: '1.05rem', borderRadius: '12px', px: 4, py: 1.5 }}
                  >
                    Lancer le questionnaire
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#10b981' }} />
                  <Typography variant="h5" fontWeight={800} color="#0f172a">
                    Session terminée
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  endIcon={<SkipNextIcon />}
                  onClick={handleNextSubject}
                  disabled={submitting}
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '12px', px: 4, py: 1.5 }}
                >
                  Sujet suivant
                </Button>
              </Box>
            )}

            {session.steps.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.round((doneCount / session.steps.length) * 100)}
                  sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#dbeafe' }}
                />
                <Typography variant="caption" color="#64748b" sx={{ whiteSpace: 'nowrap' }}>
                  {doneCount} / {session.steps.length}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* DÉROULÉ : toutes les étapes, cliquables (refaire ou corriger un questionnaire) */}
          {stepGroups.length > 0 && (
            <Paper elevation={0} sx={panelSx}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1.5 }}>
                Déroulé
              </Typography>
              {stepGroups.map((group) => (
                <Box
                  key={group.id}
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.6, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
                >
                  <Typography
                    variant="body2"
                    sx={{ width: 170, flexShrink: 0, pt: 0.4, fontWeight: 600, color: group.id === nextStep?.group ? '#2563eb' : '#64748b' }}
                  >
                    {group.label}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {group.steps.map((step) => {
                      const isNext = step === nextStep;
                      return (
                        <Tooltip key={step.key} title={step.done ? 'Rempli — cliquer pour modifier' : 'À remplir'}>
                          <Chip
                            size="small"
                            clickable
                            onClick={() => handleLaunchStep(step)}
                            icon={step.done ? <CheckCircleIcon /> : undefined}
                            label={step.form.name}
                            color={step.done ? 'success' : isNext ? 'primary' : 'default'}
                            variant={step.done || isNext ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600 }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}

      {/* MODE ADMIN (aucune session en cours) : démarrer un nouveau sujet ou reprendre une session */}
      {!activeId && (
      <Paper elevation={0} sx={panelSx}>
        <Typography variant="subtitle2" fontWeight={800} color="#0f172a" sx={{ mb: 1.5 }}>
          Démarrer ou reprendre une session
        </Typography>

        <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <TextField
            size="small"
            label="Identifiant"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            sx={{ width: 150 }}
          />
          <TextField
            select
            size="small"
            label="Bloc"
            value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)}
            sx={{ width: 210 }}
          >
            {(protocolStats?.blocks || []).map((b) => {
              const count = protocolStats?.distribution?.[b] || 0;
              return (
                <MenuItem key={b} value={b}>
                  {b} — {count} sujet{count > 1 ? 's' : ''}
                  {protocolStats?.suggestedBlock === b ? ' (conseillé)' : ''}
                </MenuItem>
              );
            })}
          </TextField>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            sx={{ textTransform: 'none', fontWeight: 700, height: 40 }}
          >
            Démarrer
          </Button>
        </Box>

        {loading && participantsList.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={26} />
          </Box>
        ) : participantsList.length === 0 ? (
          <Typography variant="body2" color="#64748b">
            Aucun sujet enregistré pour le moment.
          </Typography>
        ) : (
          <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Sujet</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Bloc</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Réponses</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {participantsList.map((p) => {
                  const uid = String(p.UserID || p.id);
                  const isActive = uid === activeId;
                  return (
                    <TableRow key={uid} hover selected={isActive}>
                      <TableCell sx={{ fontWeight: 700 }}>#{uid}</TableCell>
                      <TableCell>{p.Block || '—'}</TableCell>
                      <TableCell>{p.formCount ?? 0}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {isActive ? (
                          <Chip label="En cours" color="success" size="small" sx={{ fontWeight: 700, mr: 1 }} />
                        ) : (
                          <Button size="small" onClick={() => handleActivate(p)} sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}>
                            Reprendre
                          </Button>
                        )}
                        <Tooltip title="Voir ses réponses">
                          <IconButton size="small" onClick={() => navigate(`/answers?user=${encodeURIComponent(uid)}`)}>
                            <QuestionAnswerIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer le sujet et ses réponses">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(p)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
      )}

      {/* Confirmation de suppression */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Supprimer ce sujet ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Le sujet <strong>#{deleteTarget?.UserID || deleteTarget?.id}</strong> et toutes ses réponses seront définitivement effacés.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={popup.open}
        autoHideDuration={4000}
        onClose={() => setPopup((prev) => ({ ...prev, open: false }))}
      >
        <Alert onClose={() => setPopup((prev) => ({ ...prev, open: false }))} severity={popup.severity} sx={{ width: '100%' }}>
          {popup.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
