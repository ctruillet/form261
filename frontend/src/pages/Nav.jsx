import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// Icons
import ScienceIcon from '@mui/icons-material/Science';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import TuneIcon from '@mui/icons-material/Tune';

import { ParticipantContext } from '../context/ParticipantContext';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participantData } = useContext(ParticipantContext);

  // Fonction pour télécharger l'export Excel des réponses
  const downloadResponses = async () => {
    try {
      const response = await fetch('/api/data/responses/exportResponsesToExcel');
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const fileName = `reponses_form261_${year}-${month}-${day}_${hours}h${minutes}.xlsx`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors du téléchargement des réponses.');
    }
  };

  // Fonction pour télécharger l'export Tidy Data CSV (format long pour R / JASP / Python)
  const downloadTidyCSV = async () => {
    try {
      const response = await fetch('/api/data/responses/exportTidyCSV');
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const fileName = `tidy_data_form261_${year}-${month}-${day}_${hours}h${minutes}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors du téléchargement du fichier Tidy Data CSV.');
    }
  };

  // Fonction pour télécharger l'export JSON de toutes les réponses
  const downloadJSON = async () => {
    try {
      const response = await fetch('/api/data/responses');
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const fileName = `reponses_form261_${year}-${month}-${day}_${hours}h${minutes}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors du téléchargement du fichier JSON.');
    }
  };


  // Helper pour vérifier si un élément est actif
  const isSelected = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/manage-forms') return location.pathname === '/manage-forms' || location.pathname.startsWith('/edit-form');
    return location.pathname.startsWith(path);
  };

  const navItemStyle = (active) => ({
    borderRadius: '8px',
    mx: 1.5,
    my: 0.3,
    minHeight: '40px',
    maxHeight: '40px',
    height: '40px',
    boxSizing: 'border-box',
    px: 1.5,
    py: 0,
    backgroundColor: active ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
    borderLeft: active ? '4px solid #3b82f6' : '4px solid transparent',
    color: active ? '#ffffff' : '#cbd5e1',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)',
      color: '#ffffff',
    },
  });

  const subheaderStyle = {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    lineHeight: '1.8rem',
    px: 2,
    mt: 1,
    mb: 0.2,
  };

  return (
    <List component="nav" className="sidebar">
      {/* Brand Header */}
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              flexShrink: 0,
            }}
          >
            <ScienceIcon fontSize="medium" />
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              form261
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
              Gestion des questionnaires
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* SECTION 1 : EXPÉRIMENTATION */}
      <ListSubheader component="div" sx={subheaderStyle}>
        Expérimentation
      </ListSubheader>

      <ListItemButton
        selected={isSelected('/participant')}
        sx={navItemStyle(isSelected('/participant'))}
        onClick={() => navigate('/participant')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/participant') ? '#60a5fa' : '#94a3b8' }}>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Session & Sujets"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/participant') ? 600 : 400, noWrap: true }}
        />
        {participantData?.UserID ? (
          <Chip
            label={`#${participantData.UserID}`}
            size="small"
            color="success"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, ml: 1, maxWidth: '90px' }}
          />
        ) : (
          <Chip
            label="Inactif"
            size="small"
            sx={{ height: 20, fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', ml: 1 }}
          />
        )}
      </ListItemButton>

      <ListItemButton
        selected={isSelected('/')}
        sx={navItemStyle(isSelected('/'))}
        onClick={() => navigate('/')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/') ? '#60a5fa' : '#94a3b8' }}>
          <AssignmentIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Questionnaires"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/') ? 600 : 400, noWrap: true }}
        />
      </ListItemButton>

      <ListItemButton
        selected={isSelected('/protocol')}
        sx={navItemStyle(isSelected('/protocol'))}
        onClick={() => navigate('/protocol')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/protocol') ? '#60a5fa' : '#94a3b8' }}>
          <TuneIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Plan d'Expérience"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/protocol') ? 600 : 400, noWrap: true }}
        />
      </ListItemButton>

      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* SECTION 2 : GESTION DES FORMULAIRES */}
      <ListSubheader component="div" sx={subheaderStyle}>
        Gestion des Questionnaires
      </ListSubheader>

      <ListItemButton
        selected={isSelected('/manage-forms')}
        sx={navItemStyle(isSelected('/manage-forms'))}
        onClick={() => navigate('/manage-forms')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/manage-forms') ? '#60a5fa' : '#94a3b8' }}>
          <ListAltIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Gérer les formulaires"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/manage-forms') ? 600 : 400, noWrap: true }}
        />
      </ListItemButton>

      <ListItemButton
        selected={isSelected('/create-form')}
        sx={navItemStyle(isSelected('/create-form'))}
        onClick={() => navigate('/create-form')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/create-form') ? '#60a5fa' : '#94a3b8' }}>
          <AddCircleOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Créer un formulaire"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/create-form') ? 600 : 400, noWrap: true }}
        />
      </ListItemButton>

      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* SECTION 3 : DONNÉES & ANALYSES */}
      <ListSubheader component="div" sx={subheaderStyle}>
        Données & Résultats
      </ListSubheader>

      <ListItemButton
        selected={isSelected('/data')}
        sx={navItemStyle(isSelected('/data'))}
        onClick={() => navigate('/data')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/data') ? '#60a5fa' : '#94a3b8' }}>
          <BarChartIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Graphiques & Stats"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/data') ? 600 : 400, noWrap: true }}
        />
      </ListItemButton>

      <ListItemButton
        selected={isSelected('/answers')}
        sx={navItemStyle(isSelected('/answers'))}
        onClick={() => navigate('/answers')}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isSelected('/answers') ? '#60a5fa' : '#94a3b8' }}>
          <QuestionAnswerIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Toutes les réponses"
          primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/answers') ? 600 : 400, noWrap: true }}
        />
      </ListItemButton>

      {participantData?.UserID && (
        <ListItemButton
          selected={isSelected('/participant-answers')}
          sx={navItemStyle(isSelected('/participant-answers'))}
          onClick={() => navigate('/participant-answers')}
        >
          <ListItemIcon sx={{ minWidth: 36, color: isSelected('/participant-answers') ? '#60a5fa' : '#94a3b8' }}>
            <FactCheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={`Réponses de ${participantData.UserID}`}
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected('/participant-answers') ? 600 : 400, noWrap: true }}
          />
        </ListItemButton>
      )}

      <ListItemButton
        sx={{
          ...navItemStyle(false),
          mt: 0.8,
          border: '1px dashed rgba(255,255,255,0.15)',
          borderLeft: '4px solid transparent',
          '&:hover': {
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: '#3b82f6',
            borderLeft: '4px solid #3b82f6',
          },
        }}
        onClick={downloadResponses}
      >
        <ListItemIcon sx={{ minWidth: 36, color: '#38bdf8' }}>
          <DownloadIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Exporter Excel (.xlsx)"
          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: 500, color: '#38bdf8', noWrap: true }}
        />
      </ListItemButton>

      <ListItemButton
        sx={{
          ...navItemStyle(false),
          mt: 0.5,
          border: '1px dashed rgba(255,255,255,0.15)',
          borderLeft: '4px solid transparent',
          '&:hover': {
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: '#10b981',
            borderLeft: '4px solid #10b981',
          },
        }}
        onClick={downloadTidyCSV}
      >
        <ListItemIcon sx={{ minWidth: 36, color: '#34d399' }}>
          <TableChartIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Exporter CSV (.csv)"
          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: 500, color: '#34d399', noWrap: true }}
        />
      </ListItemButton>

      <ListItemButton
        sx={{
          ...navItemStyle(false),
          mt: 0.5,
          mb: 1.5,
          border: '1px dashed rgba(255,255,255,0.15)',
          borderLeft: '4px solid transparent',
          '&:hover': {
            backgroundColor: 'rgba(167, 139, 250, 0.15)',
            borderColor: '#a78bfa',
            borderLeft: '4px solid #a78bfa',
          },
        }}
        onClick={downloadJSON}
      >
        <ListItemIcon sx={{ minWidth: 36, color: '#a78bfa' }}>
          <DataObjectIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Exporter JSON (.json)"
          primaryTypographyProps={{ fontSize: '0.825rem', fontWeight: 500, color: '#a78bfa', noWrap: true }}
        />
      </ListItemButton>
    </List>

  );
}

export default Nav;
