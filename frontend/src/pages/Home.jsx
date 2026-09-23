import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';
import SkipNextIcon from '@mui/icons-material/SkipNext';

import { ParticipantContext } from '../context/ParticipantContext';
import '../styles/Home.css';

const formatParamName = (paramFile) => {
  if (!paramFile) return '';
  return paramFile.replace('.json', '').replace(/_/g, ' • ');
};

const Home = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    participantData,
    currentTrialIndex,
    currentTrial,
    activeTrials,
    activeFactors = {},
    nextTrial
  } = useContext(ParticipantContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/forms');
        setForms(response.data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des formulaires :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const handleFormSelect = (fields, param) => {
    navigate(`/form?fields=${encodeURIComponent(fields)}&param=${encodeURIComponent(param)}`);
  };

  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms;
    const query = searchQuery.toLowerCase().trim();
    return forms.filter(
      (f) =>
        (f.name && f.name.toLowerCase().includes(query)) ||
        (f.tag && f.tag.toLowerCase().includes(query)) ||
        (f.description && f.description.toLowerCase().includes(query)) ||
        (f.fields && f.fields.toLowerCase().includes(query)) ||
        (f.param && f.param.toLowerCase().includes(query))
    );
  }, [forms, searchQuery]);

  return (
    <div className="home-container">
      {/* En-tête : Titre & Actions principales */}
      <div className="home-header">
        <div className="home-title-group">
          <h1 className="home-title">Formulaires</h1>
          <span className="home-count-badge">
            {forms.length} {forms.length > 1 ? 'formulaires' : 'formulaire'}
          </span>
        </div>

        <div className="home-actions-group">
          {/* Statut participant */}
          <div className="participant-status-pill">
            <span
              className={`participant-status-dot ${
                participantData?.UserID ? '' : 'inactive'
              }`}
            />
            {participantData?.UserID ? (
              <>
                <span>
                  Participant : <strong>{participantData.UserID}</strong>
                </span>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => navigate('/participant')}
                  sx={{
                    minWidth: 'auto',
                    p: '2px 6px',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Modifier
                </Button>
              </>
            ) : (
              <>
                <span style={{ color: '#64748b' }}>Aucun participant actif</span>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => navigate('/participant')}
                  startIcon={<PersonIcon fontSize="small" />}
                  sx={{
                    minWidth: 'auto',
                    p: '2px 8px',
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Définir
                </Button>
              </>
            )}
          </div>

          {/* Raccourcis de gestion */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<ListAltIcon fontSize="small" />}
            onClick={() => navigate('/manage-forms')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              height: '36px',
              borderColor: '#cbd5e1',
              color: '#334155',
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f1f5f9',
              },
            }}
          >
            Gérer
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutlineIcon fontSize="small" />}
            onClick={() => navigate('/create-form')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              height: '36px',
              boxShadow: 'none',
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              },
            }}
          >
            Créer
          </Button>
        </div>
      </div>

      {/* BANNIÈRE COCKPIT : Session active ou invitation à démarrer */}
      {participantData?.UserID ? (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            backgroundColor: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ScienceIcon sx={{ color: '#2563eb', fontSize: 28 }} />
            <div>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle1" fontWeight={800} color="#1e3a8a">
                  Session en cours : Sujet #{participantData.UserID}
                </Typography>
                <Chip
                  label={`Bloc ${participantData.Block}`}
                  size="small"
                  sx={{ height: 22, fontWeight: 700, backgroundColor: '#dbeafe', color: '#1e40af' }}
                />
                <Chip
                  label={`Essai ${currentTrialIndex} / ${activeTrials.length || 8}`}
                  size="small"
                  color="primary"
                  sx={{ height: 22, fontWeight: 800 }}
                />
              </Box>
              {Object.entries(activeFactors).length > 0 && (
                <Typography variant="body2" color="#334155" sx={{ mt: 0.3 }}>
                  Conditions : <strong>{Object.entries(activeFactors).map(([k, v]) => `${k} : ${v}`).join(' • ')}</strong>
                </Typography>
              )}
            </div>
          </Box>

          <Stack direction="row" spacing={1}>
            {currentTrialIndex < (activeTrials.length || 8) && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<SkipNextIcon />}
                onClick={nextTrial}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Essai suiv.
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              onClick={() => navigate('/participant')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', backgroundColor: '#2563eb' }}
            >
              Guide pas-à-pas
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PersonIcon sx={{ color: '#64748b', fontSize: 26 }} />
            <div>
              <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                Aucune session de passation active
              </Typography>
              <Typography variant="caption" color="#64748b">
                Démarrez une session de sujet pour bénéficier du contrebalancement automatique des facteurs expérimentaux.
              </Typography>
            </div>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate('/participant')}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Démarrer un sujet
          </Button>
        </Paper>
      )}

      {/* Barre d'outils : Recherche */}
      <div className="home-toolbar">
        <div className="search-container">
          <TextField
            size="small"
            fullWidth
            placeholder="Rechercher un formulaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                fontSize: '0.875rem',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Contenu principal : Grille de cartes dynamiques */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : filteredForms.length === 0 ? (
        <div className="home-empty-state">
          <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
            Aucun formulaire ne correspond à votre recherche &quot;{searchQuery}&quot;.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setSearchQuery('')}
            sx={{ textTransform: 'none' }}
          >
            Réinitialiser le filtre
          </Button>
        </div>
      ) : (
        <div className="home-cards-grid">
          {filteredForms.map((form) => (
            <div key={form.id ?? form.fields} className="form-card">
              <div>
                <div className="form-card-top">
                  <div className="form-icon-avatar">
                    <AssignmentIcon fontSize="small" />
                  </div>

                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                    {form.timing === 'pre' && (
                      <Chip
                        label="Pré-expérience"
                        size="small"
                        sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1' }}
                      />
                    )}
                    {form.timing === 'post-modality' && (
                      <Chip
                        label="Fin de modalité"
                        size="small"
                        sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#f3e8ff', color: '#7e22ce' }}
                      />
                    )}
                    {form.timing === 'trial' && (
                      <Chip
                        label="Par essai"
                        size="small"
                        sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#fef3c7', color: '#b45309' }}
                      />
                    )}
                    {form.timing === 'post' && (
                      <Chip
                        label="Bilan final"
                        size="small"
                        sx={{ height: '22px', fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }}
                      />
                    )}
                    {form.tag && (
                      <Chip
                        label={form.tag}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    )}
                    {form.id !== undefined && (
                      <Tooltip title="Modifier la configuration">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-form/${form.id}`);
                          }}
                          sx={{ color: '#94a3b8', '&:hover': { color: '#2563eb' } }}
                        >
                          <EditOutlinedIcon sx={{ fontSize: '1.05rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </div>

                <div className="form-card-body">
                  <h3 className="form-card-title">{form.name}</h3>

                  {form.description && (
                    <div className="form-card-description">
                      {form.description}
                    </div>
                  )}

                  <div className="form-card-files" style={{ marginTop: '8px' }}>
                    {participantData?.UserID ? (
                      form.timing === 'pre' ? (
                        <Chip
                          label={`Questionnaire initial • Participant #${participantData.UserID}`}
                          size="small"
                          sx={{
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 24,
                            maxWidth: '100%'
                          }}
                        />
                      ) : form.timing === 'post' ? (
                        <Chip
                          label={`Bilan final • Participant #${participantData.UserID}`}
                          size="small"
                          sx={{
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 24,
                            maxWidth: '100%'
                          }}
                        />
                      ) : form.timing === 'post-modality' ? (
                        <Chip
                          label={`Évaluation de modalité (${Object.values(activeFactors)[0] || 'active'})`}
                          size="small"
                          sx={{
                            backgroundColor: '#f3e8ff',
                            color: '#7e22ce',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 24,
                            maxWidth: '100%'
                          }}
                        />
                      ) : (
                        <Chip
                          label={`Essai #${currentTrialIndex}${
                            Object.values(activeFactors).length > 0
                              ? ` (${Object.values(activeFactors).join(' • ')})`
                              : ''
                          }`}
                          size="small"
                          sx={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 24,
                            maxWidth: '100%'
                          }}
                        />
                      )
                    ) : (
                      <div className="form-card-file-item">
                        📋 {form.fields.replace('.json', '')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-card-footer">
                <Button
                  variant="contained"
                  fullWidth
                  size="medium"
                  endIcon={<PlayArrowIcon />}
                  onClick={() => handleFormSelect(form.fields, form.param)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    boxShadow: 'none',
                    py: 1,
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                      boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
                    },
                  }}
                >
                  {participantData?.UserID
                    ? `Passer ce questionnaire (Essai ${currentTrialIndex})`
                    : 'Lancer la passation'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
