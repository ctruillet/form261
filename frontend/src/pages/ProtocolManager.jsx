import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// Icons
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ScienceIcon from '@mui/icons-material/Science';
import TableViewIcon from '@mui/icons-material/TableView';
import PersonIcon from '@mui/icons-material/Person';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import TimelineIcon from '@mui/icons-material/Timeline';
import LayersIcon from '@mui/icons-material/Layers';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import LoopIcon from '@mui/icons-material/Loop';

import { ParticipantContext } from '../context/ParticipantContext';

// Palette de couleurs harmonieuses pour les modalités (générée par hachage de chaîne)
const COLOR_PALETTE = [
  { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' }, // Bleu
  { bg: '#faf5ff', border: '#d8b4fe', text: '#7c3aed' }, // Violet
  { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' }, // Vert
  { bg: '#fffbeb', border: '#fde68a', text: '#b45309' }, // Ambre
  { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' }, // Rose
  { bg: '#f0fdfa', border: '#99f6e4', text: '#0f766e' }, // Sarcelle
  { bg: '#fdf4ff', border: '#f0abfc', text: '#c026d3' }, // Fuchsia
  { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' }, // Ardoise
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

export default function ProtocolManager() {
  const navigate = useNavigate();
  const { reloadProtocol } = useContext(ParticipantContext);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Plan Expérimental');
  const [method, setMethod] = useState('blocked');
  const [blockedFactorName, setBlockedFactorName] = useState('');
  const [factors, setFactors] = useState([]);
  const [newValueInputs, setNewValueInputs] = useState({});
  const [newFactorName, setNewFactorName] = useState('');
  const [generatedProtocol, setGeneratedProtocol] = useState(null);
  const [stats, setStats] = useState(null);
  const [popup, setPopup] = useState({ open: false, message: '', severity: 'info' });

  // Mode d'affichage de la matrice
  const [matrixViewMode, setMatrixViewMode] = useState('detailed');
  const [selectedInspectorBlock, setSelectedInspectorBlock] = useState('');

  // 1. Charger le protocole actif depuis l'API
  const fetchProtocolData = async () => {
    setLoading(true);
    try {
      const [protoRes, statsRes] = await Promise.all([
        axios.get('/api/protocol'),
        axios.get('/api/protocol/stats').catch(() => ({ data: null }))
      ]);

      const data = protoRes.data;
      if (data) {
        setName(data.name || 'Plan Expérimental');
        setMethod(data.counterbalancingMethod || 'williams');
        setBlockedFactorName(data.blockedFactorName || (data.factors?.[0]?.name) || '');
        setFactors(data.factors || []);
        setGeneratedProtocol(data);

        // Si macro-blocs présents, activer la vue groupée
        const firstBlockKey = data.blocks ? Object.keys(data.blocks)[0] : null;
        const hasMacro = firstBlockKey && data.blocks[firstBlockKey]?.[0]?.macroBlock !== undefined;
        if (hasMacro) {
          setMatrixViewMode('synthetic');
        } else {
          setMatrixViewMode('detailed');
        }
      }

      if (statsRes.data) {
        setStats(statsRes.data);
        if (statsRes.data.suggestedBlock) {
          setSelectedInspectorBlock(statsRes.data.suggestedBlock);
        } else if (protoRes.data?.blocks) {
          setSelectedInspectorBlock(Object.keys(protoRes.data.blocks)[0] || '');
        }
      }
    } catch (err) {
      console.error('Erreur chargement protocole:', err);
      setPopup({ open: true, message: 'Erreur lors du chargement du protocole', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocolData();
  }, []);

  // Calcul dynamique du nombre de conditions
  const totalConditionsCount = useMemo(() => {
    if (!factors || factors.length === 0) return 0;
    return factors.reduce((acc, f) => acc * (f.values?.length || 0), 1);
  }, [factors]);

  // Ajouter une modalité à un facteur
  const handleAddValue = (factorIndex) => {
    const val = (newValueInputs[factorIndex] || '').trim();
    if (!val) return;

    setFactors(prev => {
      const updated = [...prev];
      const target = { ...updated[factorIndex] };
      if (!target.values.includes(val)) {
        target.values = [...target.values, val];
      }
      updated[factorIndex] = target;
      return updated;
    });

    setNewValueInputs(prev => ({ ...prev, [factorIndex]: '' }));
  };

  // Supprimer une modalité
  const handleRemoveValue = (factorIndex, valueToRemove) => {
    setFactors(prev => {
      const updated = [...prev];
      const target = { ...updated[factorIndex] };
      target.values = target.values.filter(v => v !== valueToRemove);
      updated[factorIndex] = target;
      return updated;
    });
  };

  // Ajouter un nouveau facteur
  const handleAddFactor = () => {
    const factorName = newFactorName.trim();
    if (!factorName) return;

    if (factors.some(f => f.name.toLowerCase() === factorName.toLowerCase())) {
      setPopup({ open: true, message: `Le facteur "${factorName}" existe déjà.`, severity: 'warning' });
      return;
    }

    setFactors(prev => [
      ...prev,
      { name: factorName, type: 'within', values: [] }
    ]);
    if (!blockedFactorName) {
      setBlockedFactorName(factorName);
    }
    setNewFactorName('');
  };

  // Supprimer un facteur
  const handleRemoveFactor = (factorIndex) => {
    if (factors.length <= 1) {
      setPopup({ open: true, message: 'Le plan doit comporter au moins un facteur.', severity: 'warning' });
      return;
    }
    const removedName = factors[factorIndex].name;
    setFactors(prev => {
      const next = prev.filter((_, idx) => idx !== factorIndex);
      if (blockedFactorName === removedName) {
        setBlockedFactorName(next[0]?.name || '');
      }
      return next;
    });
  };

  // Sauvegarder et générer les blocs
  const handleSaveProtocol = async () => {
    const invalidFactor = factors.find(f => !f.values || f.values.length === 0);
    if (invalidFactor) {
      setPopup({
        open: true,
        message: `Le facteur "${invalidFactor.name}" n'a aucune modalité définie.`,
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        counterbalancingMethod: method,
        blockedFactorName: method === 'blocked' ? (blockedFactorName || factors[0]?.name) : null,
        factors
      };

      const response = await axios.post('/api/protocol', payload);
      setGeneratedProtocol(response.data);
      await reloadProtocol();

      try {
        const statsRes = await axios.get('/api/protocol/stats');
        setStats(statsRes.data);
        if (statsRes.data?.suggestedBlock) {
          setSelectedInspectorBlock(statsRes.data.suggestedBlock);
        }
      } catch (e) {}

      // Si macro-blocs présents, basculer sur synthetic par défaut, sinon detailed
      const firstB = response.data?.blocks ? Object.keys(response.data.blocks)[0] : null;
      if (firstB && response.data.blocks[firstB]?.[0]?.macroBlock !== undefined) {
        setMatrixViewMode('synthetic');
      } else {
        setMatrixViewMode('detailed');
      }

      setPopup({
        open: true,
        message: `Plan expérimental généré et enregistré avec succès (${response.data.blocksCount} blocs calculés).`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur sauvegarde protocole:', err);
      setPopup({ open: true, message: 'Erreur lors de la sauvegarde du protocole.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser avec les valeurs initiales par défaut du serveur
  const handleResetToDefault = async () => {
    try {
      setLoading(true);
      await fetchProtocolData();
      setPopup({ open: true, message: 'Configuration rechargée depuis le serveur.', severity: 'info' });
    } finally {
      setLoading(false);
    }
  };

  // Export de la matrice en CSV
  const handleExportCSV = () => {
    if (!generatedProtocol?.blocks) return;
    const blocks = generatedProtocol.blocks;
    const bKeys = Object.keys(blocks);
    if (bKeys.length === 0) return;

    const maxTrials = Math.max(...bKeys.map(k => (blocks[k] || []).length));
    const headers = ['Bloc', 'Effectif_Actuel', ...Array.from({ length: maxTrials }, (_, i) => `Essai_${i + 1}`)];

    const rows = bKeys.map(bk => {
      const trials = blocks[bk] || [];
      const count = stats?.distribution?.[bk] || 0;
      const trialStrs = trials.map(t => {
        const factorItems = Object.entries(t)
          .filter(([k]) => !['trialOrder', 'macroBlock', 'subTrial'].includes(k))
          .map(([k, v]) => `${k}:${v}`)
          .join(' / ');
        return `"${factorItems}"`;
      });
      return [bk, count, ...trialStrs].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plan_experience_${name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setPopup({ open: true, message: 'Matrice exportée en CSV.', severity: 'success' });
  };

  // Copier le JSON
  const handleCopyJSON = () => {
    if (!generatedProtocol) return;
    navigator.clipboard.writeText(JSON.stringify(generatedProtocol, null, 2));
    setPopup({ open: true, message: 'Structure copiée dans le presse-papier.', severity: 'success' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const blocksObj = generatedProtocol?.blocks || {};
  const blockKeys = Object.keys(blocksObj);

  // Vérifier si le protocole généré comporte des macro-blocs
  const hasMacroBlocks = blockKeys.length > 0 && blocksObj[blockKeys[0]]?.[0]?.macroBlock !== undefined;

  // Déterminer le nombre d'essais maximal par bloc
  const maxTrialsCount = blockKeys.length > 0
    ? Math.max(...blockKeys.map(k => (blocksObj[k] || []).length))
    : 0;

  // Calculer dynamiquement les macro-phases d'un bloc donné
  const getDynamicMacroPhases = (blockKey) => {
    const trials = blocksObj[blockKey] || [];
    const macroMap = new Map();

    trials.forEach((trial) => {
      const macroId = trial.macroBlock || 1;
      const activeBlockedKey = generatedProtocol?.blockedFactorName || blockedFactorName || factors[0]?.name;
      const blockedVal = trial[activeBlockedKey] !== undefined ? String(trial[activeBlockedKey]) : '';

      if (!macroMap.has(macroId)) {
        macroMap.set(macroId, {
          macroBlock: macroId,
          blockedFactor: activeBlockedKey,
          blockedValue: blockedVal,
          subTrials: []
        });
      }

      // Sous-conditions : tous les facteurs différents du facteur bloqué
      const subEntries = Object.entries(trial).filter(
        ([k]) => !['trialOrder', 'macroBlock', 'subTrial', activeBlockedKey].includes(k)
      );
      const subStr = subEntries.map(([, v]) => String(v)).join(' / ');
      macroMap.get(macroId).subTrials.push(subStr || `Essai ${trial.trialOrder}`);
    });

    return Array.from(macroMap.values());
  };

  // Déterminer dynamiquement le nombre de phases
  const dynamicPhasesCount = (hasMacroBlocks && blockKeys.length > 0)
    ? getDynamicMacroPhases(blockKeys[0]).length
    : 0;

  return (
    <Box sx={{ maxWidth: '1240px', margin: '0 auto', p: { xs: 2, md: 3 } }}>
      {/* ========================================================================= */}
      {/* EN-TÊTE PRINCIPAL                                                         */}
      {/* ========================================================================= */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ScienceIcon sx={{ fontSize: 34, color: '#2563eb' }} />
          <div>
            <Typography variant="h4" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.5px' }}>
              Plan d'Expérience
            </Typography>
            <Typography variant="body2" color="#64748b">
              Configuration des variables expérimentales et matrice de contrebalancement.
            </Typography>
          </div>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={handleResetToDefault}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Recharger
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonIcon />}
            onClick={() => navigate('/participant')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Session & Sujets
          </Button>

          <Button
            variant="contained"
            size="medium"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveProtocol}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              boxShadow: 'none',
              px: 2.5,
              '&:hover': { backgroundColor: '#1d4ed8' }
            }}
          >
            {saving ? 'Génération...' : 'Enregistrer & Générer'}
          </Button>
        </Stack>
      </Box>

      {/* ========================================================================= */}
      {/* CARTES DE SYNTHÈSE                                                        */}
      {/* ========================================================================= */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3.5 }}>
        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
            Facteurs Expérimentaux
          </Typography>
          <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ mt: 0.5 }}>
            {factors.length} {factors.length > 1 ? 'Facteurs' : 'Facteur'}
          </Typography>
          <Typography variant="caption" color="#2563eb" fontWeight={600}>
            {factors.map(f => `${f.name} (${f.values?.length || 0})`).join(' × ') || 'Aucun'}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
            Conditions par Sujet
          </Typography>
          <Typography variant="h5" fontWeight={800} color="#2563eb" sx={{ mt: 0.5 }}>
            {totalConditionsCount} Conditions
          </Typography>
          <Typography variant="caption" color="#64748b">
            {maxTrialsCount > 0 ? `${maxTrialsCount} essais par bloc` : 'Non calculé'}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
          <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
            Blocs de Contrebalancement
          </Typography>
          <Typography variant="h5" fontWeight={800} color="#059669" sx={{ mt: 0.5 }}>
            {blockKeys.length} Blocs
          </Typography>
          <Typography variant="caption" color="#059669" fontWeight={600}>
            {method === 'blocked' ? 'Macro-Blocs consécutifs' : method === 'williams' ? 'Carré Latin de Williams' : 'Carré Latin Cyclique'}
          </Typography>
        </Paper>

        {stats && (
          <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
              Prochain Bloc Suggéré
            </Typography>
            <Typography variant="h5" fontWeight={800} color="#ea580c" sx={{ mt: 0.5 }}>
              Bloc {stats.suggestedBlock}
            </Typography>
            <Typography variant="caption" color="#64748b">
              {stats.totalParticipants} sujet{stats.totalParticipants > 1 ? 's' : ''} au total
            </Typography>
          </Paper>
        )}
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 1 : FACTEURS & MODALITÉS                                          */}
      {/* ========================================================================= */}
      <Card sx={{ mb: 3.5, borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              1. Facteurs Expérimentaux
            </Typography>
            <Typography variant="body2" color="#64748b">
              Chaque facteur représente une variable indépendante. Renseignez son nom et ses différentes modalités.
            </Typography>
          </Box>

          <Stack spacing={2.5}>
            {factors.map((factor, fIdx) => {
              const isBlockedFactor = method === 'blocked' && factor.name === blockedFactorName;

              return (
                <Paper
                  key={fIdx}
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    border: isBlockedFactor ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    boxShadow: 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                        Facteur {fIdx + 1} : <span style={{ color: '#2563eb' }}>{factor.name}</span>
                      </Typography>

                      {isBlockedFactor ? (
                        <Chip
                          icon={<LayersIcon sx={{ fontSize: '15px !important' }} />}
                          label="Facteur Principal Bloqué"
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Chip
                          label="Intra-sujet (Within)"
                          size="small"
                          sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      )}
                    </Box>

                    {factors.length > 1 && (
                      <Tooltip title="Supprimer ce facteur">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFactor(fIdx)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Modalités existantes */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {factor.values.map((val) => {
                      const col = getModalityColor(val);
                      return (
                        <Chip
                          key={val}
                          label={val}
                          onDelete={() => handleRemoveValue(fIdx, val)}
                          sx={{
                            backgroundColor: col.bg,
                            border: `1.5px solid ${col.border}`,
                            color: col.text,
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        />
                      );
                    })}

                    {factor.values.length === 0 && (
                      <Alert severity="warning" sx={{ width: '100%', py: 0.5, fontSize: '0.8rem' }}>
                        Aucune modalité définie pour ce facteur.
                      </Alert>
                    )}
                  </Box>

                  {/* Champ d'ajout de modalité */}
                  <Box sx={{ display: 'flex', gap: 1, maxWidth: '420px' }}>
                    <TextField
                      size="small"
                      placeholder={`Ajouter une modalité à ${factor.name}...`}
                      value={newValueInputs[fIdx] || ''}
                      onChange={(e) => setNewValueInputs(prev => ({ ...prev, [fIdx]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(fIdx);
                        }
                      }}
                      fullWidth
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddValue(fIdx)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2, whiteSpace: 'nowrap' }}
                    >
                      Ajouter
                    </Button>
                  </Box>
                </Paper>
              );
            })}

            {/* Nouveau facteur */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', pt: 1 }}>
              <TextField
                size="small"
                placeholder="Nom du nouveau facteur..."
                value={newFactorName}
                onChange={(e) => setNewFactorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFactor();
                  }
                }}
                sx={{ maxWidth: '350px' }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddFactor}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Ajouter un facteur
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2 : MÉTHODE DE CONTREBALANCEMENT                                 */}
      {/* ========================================================================= */}
      <Card sx={{ mb: 3.5, borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ mb: 0.5 }}>
            2. Méthode de Contrebalancement
          </Typography>
          <Typography variant="body2" color="#64748b" sx={{ mb: 2.5 }}>
            Algorithme d'ordonnancement des conditions pour contrôler les effets d'ordre et de report.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 2.5 }}>
            {/* Option 1 : Macro-Blocs */}
            <Paper
              onClick={() => setMethod('blocked')}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                cursor: 'pointer',
                border: method === 'blocked' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: method === 'blocked' ? '#eff6ff' : '#ffffff',
                boxShadow: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <LayersIcon sx={{ color: method === 'blocked' ? '#2563eb' : '#64748b' }} />
                <Chip
                  label="Macro-Blocs"
                  size="small"
                  color={method === 'blocked' ? 'primary' : 'default'}
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                Plan par Macro-Blocs (Consécutif)
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ fontSize: '0.825rem' }}>
                Les sous-conditions d'un facteur principal choisi sont exécutées consécutivement sans interruption. L'ordre des sous-conditions est inversé entre les blocs.
              </Typography>
            </Paper>

            {/* Option 2 : Carré Latin de Williams */}
            <Paper
              onClick={() => setMethod('williams')}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                cursor: 'pointer',
                border: method === 'williams' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: method === 'williams' ? '#eff6ff' : '#ffffff',
                boxShadow: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <ShuffleIcon sx={{ color: method === 'williams' ? '#2563eb' : '#64748b' }} />
                <Chip
                  label="Équilibré"
                  size="small"
                  color={method === 'williams' ? 'primary' : 'default'}
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                Carré Latin de Williams
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ fontSize: '0.825rem' }}>
                Toutes les combinaisons croisées sont traitées comme des conditions individuelles. Équilibre les effets de report de premier ordre.
              </Typography>
            </Paper>

            {/* Option 3 : Cyclique */}
            <Paper
              onClick={() => setMethod('cyclic')}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                cursor: 'pointer',
                border: method === 'cyclic' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: method === 'cyclic' ? '#eff6ff' : '#ffffff',
                boxShadow: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <LoopIcon sx={{ color: method === 'cyclic' ? '#2563eb' : '#64748b' }} />
                <Chip
                  label="Standard"
                  size="small"
                  color={method === 'cyclic' ? 'primary' : 'default'}
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                />
              </Box>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a" sx={{ mb: 1 }}>
                Carré Latin Cyclique
              </Typography>
              <Typography variant="body2" color="#475569" sx={{ fontSize: '0.825rem' }}>
                Décalage circulaire standard des conditions d'une ligne à l'autre.
              </Typography>
            </Paper>
          </Box>

          {/* Facteur bloqué principal si mode 'blocked' */}
          {method === 'blocked' && (
            <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                Facteur à regrouper consécutivement :
              </Typography>
              <TextField
                select
                size="small"
                value={blockedFactorName || factors[0]?.name || ''}
                onChange={(e) => setBlockedFactorName(e.target.value)}
                sx={{ minWidth: '220px', backgroundColor: '#ffffff', borderRadius: '6px' }}
              >
                {factors.map(f => (
                  <MenuItem key={f.name} value={f.name}>
                    <strong>{f.name}</strong> ({f.values.length} modalités)
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 3 : MATRICE DE CONTREBALANCEMENT                                  */}
      {/* ========================================================================= */}
      <Card sx={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TableViewIcon sx={{ color: '#2563eb', fontSize: 26 }} />
              <div>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  3. Matrice de Contrebalancement ({blockKeys.length} Blocs)
                </Typography>
                <Typography variant="caption" color="#64748b">
                  Séquences ordonnées attribuées aux sujets.
                </Typography>
              </div>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <ToggleButtonGroup
                size="small"
                value={matrixViewMode}
                exclusive
                onChange={(_, next) => next && setMatrixViewMode(next)}
                sx={{ backgroundColor: '#f1f5f9', borderRadius: '8px' }}
              >
                {hasMacroBlocks && (
                  <ToggleButton value="synthetic" sx={{ textTransform: 'none', fontWeight: 700, px: 1.5 }}>
                    <ViewWeekIcon sx={{ fontSize: 18, mr: 0.8 }} />
                    Vue Groupée (Phases)
                  </ToggleButton>
                )}
                <ToggleButton value="detailed" sx={{ textTransform: 'none', fontWeight: 700, px: 1.5 }}>
                  <TableViewIcon sx={{ fontSize: 18, mr: 0.8 }} />
                  Vue Détaillée (Essais)
                </ToggleButton>
                <ToggleButton value="inspector" sx={{ textTransform: 'none', fontWeight: 700, px: 1.5 }}>
                  <TimelineIcon sx={{ fontSize: 18, mr: 0.8 }} />
                  Inspecteur Sujet
                </ToggleButton>
              </ToggleButtonGroup>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Exporter CSV
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyJSON}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Copier JSON
              </Button>
            </Stack>
          </Box>

          {/* Synthèse des groupes fusionnés (contrebalancement) */}
          {stats?.groupDistribution && Object.keys(stats.groupDistribution).length > 0 && (
            <Paper sx={{ p: 2, mb: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" fontWeight={800} color="#0f172a" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚖️ Répartition par Groupe fusionné (Contrebalancement) :
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total : <strong>{stats.totalParticipants || 0}</strong> participants enregistrés
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {Object.values(stats.groupDistribution).map((g) => (
                  <Paper
                    key={g.group}
                    sx={{
                      p: '8px 14px',
                      borderRadius: '8px',
                      border: g.count > 0 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                      backgroundColor: g.count > 0 ? '#eff6ff' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        Groupe {g.group}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        ({g.blocks.join(', ')})
                      </Typography>
                    </Box>
                    <Chip
                      label={`${g.count} sujet${g.count > 1 ? 's' : ''}`}
                      size="small"
                      color={g.count > 0 ? 'primary' : 'default'}
                      sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                    />
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {/* VUE 1 : VUE GROUPÉE PAR PHASES (DYNAMIQUE) */}
          {matrixViewMode === 'synthetic' && hasMacroBlocks && (
            <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, width: '110px', color: '#1e293b' }}>Bloc</TableCell>
                    {stats && <TableCell sx={{ fontWeight: 800, width: '100px', color: '#1e293b' }}>Effectif</TableCell>}
                    {Array.from({ length: dynamicPhasesCount }).map((_, pIdx) => (
                      <TableCell key={pIdx} sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Phase {pIdx + 1}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blockKeys.map((blockKey) => {
                    const phases = getDynamicMacroPhases(blockKey);
                    const participantCount = stats?.distribution?.[blockKey] || 0;
                    const isSuggested = stats?.suggestedBlock === blockKey;

                    return (
                      <TableRow
                        key={blockKey}
                        sx={{
                          backgroundColor: isSuggested ? 'rgba(37, 99, 235, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(241, 245, 249, 0.7)' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span>Bloc {blockKey}</span>
                            {isSuggested && (
                              <Chip
                                label="Suggéré"
                                size="small"
                                color="primary"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                              />
                            )}
                          </Stack>
                        </TableCell>

                        {stats && (
                          <TableCell>
                            <Chip
                              label={`${participantCount}`}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: participantCount > 0 ? '#eff6ff' : '#f1f5f9',
                                color: participantCount > 0 ? '#1d4ed8' : '#64748b'
                              }}
                            />
                          </TableCell>
                        )}

                        {phases.map((ph, pIdx) => {
                          const col = getModalityColor(ph.blockedValue);
                          const seqStr = ph.subTrials.join(' ➔ ');

                          return (
                            <TableCell key={pIdx}>
                              <Box
                                sx={{
                                  p: '8px 12px',
                                  borderRadius: '8px',
                                  backgroundColor: col.bg,
                                  border: `1.5px solid ${col.border}`,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: 1
                                }}
                              >
                                <Typography variant="caption" fontWeight={800} sx={{ color: col.text }}>
                                  {ph.blockedValue || ph.blockedFactor}
                                </Typography>
                                {seqStr && (
                                  <Chip
                                    label={seqStr}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      backgroundColor: '#ffffff',
                                      color: '#ea580c',
                                      border: '1px solid #fed7aa'
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* VUE 2 : VUE DÉTAILLÉE ESSAI PAR ESSAI (100% DYNAMIQUE) */}
          {(matrixViewMode === 'detailed' || (!hasMacroBlocks && matrixViewMode === 'synthetic')) && (
            <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, width: '100px', color: '#1e293b' }}>Bloc</TableCell>
                    {stats && <TableCell sx={{ fontWeight: 800, width: '90px', color: '#1e293b' }}>Effectif</TableCell>}
                    {Array.from({ length: maxTrialsCount }).map((_, tIdx) => (
                      <TableCell key={tIdx} sx={{ fontWeight: 800, color: '#1e293b' }}>
                        Essai {tIdx + 1}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blockKeys.map((blockKey) => {
                    const trials = blocksObj[blockKey] || [];
                    const participantCount = stats?.distribution?.[blockKey] || 0;
                    const isSuggested = stats?.suggestedBlock === blockKey;

                    return (
                      <TableRow
                        key={blockKey}
                        sx={{
                          backgroundColor: isSuggested ? 'rgba(37, 99, 235, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: 'rgba(241, 245, 249, 0.7)' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span>Bloc {blockKey}</span>
                            {isSuggested && (
                              <Chip
                                label="Suggéré"
                                size="small"
                                color="primary"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                              />
                            )}
                          </Stack>
                        </TableCell>

                        {stats && (
                          <TableCell>
                            <Chip
                              label={`${participantCount}`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: participantCount > 0 ? '#eff6ff' : '#f1f5f9',
                                color: participantCount > 0 ? '#1d4ed8' : '#64748b'
                              }}
                            />
                          </TableCell>
                        )}

                        {trials.map((trial, tIdx) => {
                          const factorEntries = Object.entries(trial).filter(
                            ([k]) => !['trialOrder', 'macroBlock', 'subTrial'].includes(k)
                          );

                          return (
                            <TableCell key={tIdx}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {factorEntries.map(([fKey, fVal]) => {
                                  const col = getModalityColor(String(fVal));
                                  return (
                                    <Chip
                                      key={fKey}
                                      label={factorEntries.length === 1 ? String(fVal) : `${fKey}: ${fVal}`}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        backgroundColor: col.bg,
                                        border: `1px solid ${col.border}`,
                                        color: col.text
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* VUE 3 : INSPECTEUR DE PARCOURS SUJET (100% DYNAMIQUE) */}
          {matrixViewMode === 'inspector' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                  Sélectionner un Bloc :
                </Typography>
                <TextField
                  select
                  size="small"
                  value={selectedInspectorBlock || blockKeys[0] || ''}
                  onChange={(e) => setSelectedInspectorBlock(e.target.value)}
                  sx={{ width: '180px' }}
                >
                  {blockKeys.map(bk => (
                    <MenuItem key={bk} value={bk}>
                      <strong>Bloc {bk}</strong> ({stats?.distribution?.[bk] || 0} sujets)
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Parcours chronologique */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                {(blocksObj[selectedInspectorBlock || blockKeys[0]] || []).map((trial, tIdx) => {
                  const factorEntries = Object.entries(trial).filter(
                    ([k]) => !['trialOrder', 'macroBlock', 'subTrial'].includes(k)
                  );

                  return (
                    <Paper
                      key={tIdx}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" fontWeight={800} color="#2563eb">
                          ESSAI #{trial.trialOrder || tIdx + 1}
                        </Typography>
                        {trial.macroBlock !== undefined && (
                          <Chip
                            label={`Phase ${trial.macroBlock}`}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                      </Box>

                      <Stack spacing={0.8}>
                        {factorEntries.map(([fKey, fVal]) => {
                          const col = getModalityColor(String(fVal));
                          return (
                            <Box
                              key={fKey}
                              sx={{
                                p: '6px 10px',
                                borderRadius: '6px',
                                backgroundColor: col.bg,
                                border: `1px solid ${col.border}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <Typography variant="caption" fontWeight={700} color="#64748b">
                                {fKey}
                              </Typography>
                              <Typography variant="caption" fontWeight={800} color={col.text}>
                                {String(fVal)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={popup.open}
        autoHideDuration={4000}
        onClose={() => setPopup(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setPopup(prev => ({ ...prev, open: false }))}
          severity={popup.severity}
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {popup.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
