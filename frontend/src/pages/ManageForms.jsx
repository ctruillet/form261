import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';

const ManageForms = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Charger la liste des formulaires
  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/forms');
      setForms(res.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des formulaires :', err);
      setNotification({
        open: true,
        message: 'Impossible de charger la liste des formulaires.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // Supprimer un formulaire
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      await axios.delete(`/api/forms/${deleteTarget.id}`);
      setNotification({
        open: true,
        message: `Le formulaire « ${deleteTarget.name} » a été supprimé avec succès.`,
        severity: 'success',
      });
      setDeleteTarget(null);
      await fetchForms();
    } catch (err) {
      console.error('Erreur lors de la suppression :', err);
      const msg = err.response?.data?.message || 'Erreur lors de la suppression du formulaire.';
      setNotification({
        open: true,
        message: msg,
        severity: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1100px', margin: '0 auto', p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Gestion des Formulaires
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consultez, modifiez, testez ou supprimez les questionnaires de l&apos;expérimentation.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => navigate('/create-form')}
        >
          Nouveau Formulaire
        </Button>
      </Box>

      {/* État de chargement */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : forms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun formulaire trouvé.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate('/create-form')}
            sx={{ mt: 2 }}
          >
            Créer un premier formulaire
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table aria-label="Tableau des formulaires">
            <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '80px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nom du Questionnaire</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fichier Questions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fichier Paramètres</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, minWidth: '180px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forms.map((form) => (
                <TableRow
                  key={form.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Chip label={`#${form.id}`} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <span>{form.name}</span>
                      {form.tag && (
                        <Chip
                          label={form.tag}
                          size="small"
                          sx={{ fontSize: '0.72rem', height: 20, backgroundColor: '#f1f5f9', color: '#475569' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<DescriptionIcon fontSize="small" />}
                      label={form.fields}
                      size="small"
                      sx={{ backgroundColor: '#e3f2fd', color: '#1565c0' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<SettingsIcon fontSize="small" />}
                      label={form.param}
                      size="small"
                      sx={{ backgroundColor: '#ede7f6', color: '#512da8' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Tester / Répondre">
                      <IconButton
                        color="success"
                        onClick={() => navigate(`/form?fields=${form.fields}&param=${form.param}`)}
                        sx={{ mr: 1 }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier le formulaire">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/edit-form/${form.id}`)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer le formulaire">
                      <IconButton
                        color="error"
                        onClick={() => setDeleteTarget(form)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous certain de vouloir supprimer définitivement le questionnaire{' '}
            <strong>« {deleteTarget?.name} »</strong> (ID: #{deleteTarget?.id}) ?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Cette action est irréversible et supprimera également la configuration des questions associée.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageForms;
