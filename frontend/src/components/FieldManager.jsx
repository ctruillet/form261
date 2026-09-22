import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// Icons
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import ShortTextIcon from '@mui/icons-material/ShortText';
import NotesIcon from '@mui/icons-material/Notes';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import '../styles/FieldManager.css';

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court', icon: <ShortTextIcon fontSize="small" /> },
  { value: 'textAutosize', label: 'Texte long (Commentaire)', icon: <NotesIcon fontSize="small" /> },
  { value: 'range', label: 'Échelle / Slider (Likert)', icon: <LinearScaleIcon fontSize="small" /> },
  { value: 'choice', label: 'Choix unique (Boutons radio)', icon: <RadioButtonCheckedIcon fontSize="small" /> },
  { value: 'drop-down', label: 'Menu déroulant', icon: <ArrowDropDownCircleIcon fontSize="small" /> },
  { value: 'ranking', label: 'Classement ordonné', icon: <FormatListNumberedIcon fontSize="small" /> },
  { value: 'information', label: 'Message informatif / Consigne', icon: <InfoOutlinedIcon fontSize="small" /> },
];

const FieldManager = ({
  fields = [],
  onAddField,
  onRemoveField,
  onUpdateField,
  onMoveField,
  onDuplicateField,
}) => {
  const handleTypeChange = (index, newType) => {
    const current = fields[index];
    const updated = { ...current, type: newType };

    if (newType === 'range' && updated.min === undefined) {
      updated.min = 1;
      updated.max = 7;
      updated.step = 1;
      updated.labelMin = "Pas du tout d'accord";
      updated.labelMax = "Tout à fait d'accord";
    }

    if ((newType === 'choice' || newType === 'drop-down' || newType === 'ranking') && (!updated.options || updated.options.length === 0)) {
      updated.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    if (newType === 'textAutosize' && !updated.minRows) {
      updated.minRows = 3;
    }

    onUpdateField(index, updated);
  };

  const handleAddOption = (fieldIndex) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options.push(`Option ${options.length + 1}`);
    onUpdateField(fieldIndex, { ...field, options });
  };

  const handleUpdateOption = (fieldIndex, optIndex, val) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optIndex] = val;
    onUpdateField(fieldIndex, { ...field, options });
  };

  const handleRemoveOption = (fieldIndex, optIndex) => {
    const field = fields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optIndex);
    onUpdateField(fieldIndex, { ...field, options });
  };

  const applyRangePreset = (fieldIndex, preset) => {
    const field = fields[fieldIndex];
    if (preset === 'likert7') {
      onUpdateField(fieldIndex, {
        ...field,
        min: 1,
        max: 7,
        step: 1,
        labelMin: "Pas du tout d'accord",
        labelMax: "Tout à fait d'accord",
      });
    } else if (preset === 'likert5') {
      onUpdateField(fieldIndex, {
        ...field,
        min: 1,
        max: 5,
        step: 1,
        labelMin: "Pas d'accord",
        labelMax: "D'accord",
      });
    } else if (preset === 'scale100') {
      onUpdateField(fieldIndex, {
        ...field,
        min: 0,
        max: 100,
        step: 5,
        labelMin: "Faible / Bas",
        labelMax: "Élevé / Haut",
      });
    }
  };

  return (
    <Box className="field-manager-container">
      {/* Liste des champs */}
      {fields.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: '#f9f9f9', border: '2px dashed #ddd', borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Aucune question n&apos;a encore été ajoutée à ce formulaire.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Utilisez les boutons ci-dessous pour ajouter votre premier champ.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {fields.map((field, index) => {
            const isFirst = index === 0;
            const isLast = index === fields.length - 1;

            return (
              <Paper
                key={field.id || index}
                elevation={1}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  borderLeft: '5px solid #1976d2',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* En-tête de la carte */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip label={`Question ${index + 1}`} size="small" color="primary" variant="outlined" />
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel id={`type-select-label-${index}`}>Type de champ</InputLabel>
                      <Select
                        labelId={`type-select-label-${index}`}
                        value={field.type || 'text'}
                        label="Type de champ"
                        onChange={(e) => handleTypeChange(index, e.target.value)}
                      >
                        {FIELD_TYPES.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {t.icon}
                              <span>{t.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Boutons d'action : haut, bas, dupliquer, supprimer */}
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      title="Monter"
                      disabled={isFirst}
                      onClick={() => onMoveField(index, index - 1)}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Descendre"
                      disabled={isLast}
                      onClick={() => onMoveField(index, index + 1)}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Dupliquer"
                      onClick={() => onDuplicateField(index)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      title="Supprimer"
                      onClick={() => onRemoveField(index)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Paramètres principaux : Label et Sublabel */}
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Intitulé de la question (Label)"
                      value={field.label || ''}
                      placeholder="Ex: Dans quelle mesure la tâche était-elle exigeante ?"
                      required
                      onChange={(e) => onUpdateField(index, { ...field, label: e.target.value })}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(field.required)}
                          onChange={(e) => onUpdateField(index, { ...field, required: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="Obligatoire"
                      sx={{ whiteSpace: 'nowrap' }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Description ou consigne secondaire (Sublabel - facultatif)"
                    value={field.sublabel || ''}
                    placeholder="Ex: Évaluez sur une échelle de 1 à 7"
                    onChange={(e) => onUpdateField(index, { ...field, sublabel: e.target.value })}
                  />

                  {/* Paramètres spécifiques selon le type */}
                  {/* TYPE : RANGE (SLIDER / LIKERT) */}
                  {field.type === 'range' && (
                    <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          Configuration de l&apos;échelle numérique
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label="Likert 1-7" size="small" onClick={() => applyRangePreset(index, 'likert7')} clickable />
                          <Chip label="Likert 1-5" size="small" onClick={() => applyRangePreset(index, 'likert5')} clickable />
                          <Chip label="Échelle 0-100" size="small" onClick={() => applyRangePreset(index, 'scale100')} clickable />
                        </Stack>
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                        <TextField
                          type="number"
                          size="small"
                          label="Min"
                          value={field.min ?? 1}
                          onChange={(e) => onUpdateField(index, { ...field, min: Number(e.target.value) })}
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Max"
                          value={field.max ?? 7}
                          onChange={(e) => onUpdateField(index, { ...field, max: Number(e.target.value) })}
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Pas (Step)"
                          value={field.step ?? 1}
                          onChange={(e) => onUpdateField(index, { ...field, step: Number(e.target.value) })}
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Libellé Minimum (ex: Pas du tout d'accord)"
                          value={field.labelMin || ''}
                          onChange={(e) => onUpdateField(index, { ...field, labelMin: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Libellé Maximum (ex: Tout à fait d'accord)"
                          value={field.labelMax || ''}
                          onChange={(e) => onUpdateField(index, { ...field, labelMax: e.target.value })}
                        />
                      </Stack>
                    </Box>
                  )}

                  {/* TYPE : CHOICE (RADIO), DROP-DOWN, RANKING */}
                  {(field.type === 'choice' || field.type === 'drop-down' || field.type === 'ranking') && (
                    <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          {field.type === 'ranking' ? 'Options à classer' : 'Options de sélection'}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() => handleAddOption(index)}
                        >
                          Ajouter une option
                        </Button>
                      </Box>

                      <Stack spacing={1}>
                        {(field.options || []).map((opt, optIdx) => (
                          <Box key={optIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                              {optIdx + 1}.
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={opt}
                              placeholder={`Option ${optIdx + 1}`}
                              onChange={(e) => handleUpdateOption(index, optIdx, e.target.value)}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              disabled={(field.options || []).length <= 1}
                              onClick={() => handleRemoveOption(index, optIdx)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>

                      {field.type === 'choice' && (
                        <Box sx={{ mt: 1.5 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={Boolean(field.otherChoice)}
                                onChange={(e) => onUpdateField(index, { ...field, otherChoice: e.target.checked })}
                                color="primary"
                              />
                            }
                            label='Permettre la saisie libre "Autre (préciser)"'
                          />
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* TYPE : TEXT & TEXTAUTOSIZE */}
                  {field.type === 'textAutosize' && (
                    <TextField
                      size="small"
                      type="number"
                      label="Nombre de lignes par défaut"
                      value={field.minRows || 3}
                      sx={{ width: 220 }}
                      onChange={(e) => onUpdateField(index, { ...field, minRows: Math.max(1, Number(e.target.value)) })}
                    />
                  )}

                  {(field.type === 'text' || field.type === 'drop-down') && (
                    <TextField
                      size="small"
                      label="Placeholder (Texte indicatif grisé)"
                      value={field.placeholder || ''}
                      placeholder="Ex: Tapez votre réponse..."
                      onChange={(e) => onUpdateField(index, { ...field, placeholder: e.target.value })}
                    />
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Barre d'ajout rapide */}
      <Divider sx={{ my: 3 }} />
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
          ➕ Ajouter une nouvelle question :
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LinearScaleIcon />}
            onClick={() => onAddField('range')}
          >
            Échelle Likert (Slider)
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RadioButtonCheckedIcon />}
            onClick={() => onAddField('choice')}
          >
            Choix unique
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowDropDownCircleIcon />}
            onClick={() => onAddField('drop-down')}
          >
            Menu déroulant
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FormatListNumberedIcon />}
            onClick={() => onAddField('ranking')}
          >
            Classement
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ShortTextIcon />}
            onClick={() => onAddField('text')}
          >
            Texte court
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<NotesIcon />}
            onClick={() => onAddField('textAutosize')}
          >
            Texte long
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<InfoOutlinedIcon />}
            onClick={() => onAddField('information')}
          >
            Consigne
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FieldManager;
