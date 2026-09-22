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

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';

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
  const { participantData } = useContext(ParticipantContext);
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

                  <Stack direction="row" spacing={0.5} alignItems="center">
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

                  <div className="form-card-files">
                    <div className="form-card-file-item">
                      📄 {form.fields}
                    </div>
                    {form.param && (
                      <div className="form-card-file-item">
                        ⚙️ {formatParamName(form.param)}
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
                  Lancer la passation
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
