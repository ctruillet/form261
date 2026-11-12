import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// Icons
import ScienceIcon from '@mui/icons-material/Science';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TuneIcon from '@mui/icons-material/Tune';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import BarChartIcon from '@mui/icons-material/BarChart';

import { ParticipantContext } from '../context/ParticipantContext';

// Menu du mode admin : une entrée par tâche de l'expérimentateur.
// (Dès qu'une session est active, l'application passe en mode participant et ce menu disparaît.)
const NAV_ITEMS = [
  { path: '/session', label: 'Sessions', icon: PlayCircleOutlineIcon },
  { path: '/forms', label: 'Questionnaires', icon: ListAltIcon },
  { path: '/protocol', label: 'Protocole', icon: TuneIcon },
  { path: '/answers', label: 'Réponses', icon: QuestionAnswerIcon },
  { path: '/results', label: 'Résultats', icon: BarChartIcon },
];

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participantData } = useContext(ParticipantContext);

  const isSelected = (path) => location.pathname.startsWith(path);

  return (
    <List component="nav" className="sidebar">
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.08)', mb: 1 }}>
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
              Espace expérimentateur
            </Typography>
          </Box>
        </Box>
      </Box>

      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const active = isSelected(path);
        return (
          <ListItemButton
            key={path}
            selected={active}
            onClick={() => navigate(path)}
            sx={{
              borderRadius: '8px',
              mx: 1.5,
              my: 0.3,
              backgroundColor: active ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
              borderLeft: active ? '4px solid #3b82f6' : '4px solid transparent',
              color: active ? '#ffffff' : '#cbd5e1',
              '&:hover': {
                backgroundColor: active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: active ? '#60a5fa' : '#94a3b8' }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 700 : 400, noWrap: true }}
            />
            {path === '/session' && participantData?.UserID && (
              <Chip
                label={`#${participantData.UserID}`}
                size="small"
                color="success"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, ml: 1, maxWidth: '90px' }}
              />
            )}
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default Nav;
