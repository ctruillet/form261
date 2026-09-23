import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

// Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FunctionsIcon from '@mui/icons-material/Functions';
import BarChartIcon from '@mui/icons-material/BarChart';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import DataObjectIcon from '@mui/icons-material/DataObject';

import { analyzeFactorSignificance, getDescriptives } from '../utils/statsUtils';
import '../styles/Data.css';

// Palette de couleurs constante pour les conditions expérimentales
const PALETTE = [
  '#3b82f6', // Bleu
  '#f59e0b', // Ambre / Orange
  '#10b981', // Émeraude / Vert
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#06b6d4', // Cyan
  '#f97316', // Orange chaud
  '#6366f1', // Indigo
];

// Nettoyer les clés de paramètres pour un affichage lisible
const cleanParamName = (rawKey) => {
  if (!rawKey || rawKey === 'Global') return 'Tous les participants (Global)';
  return rawKey
    .replace(/[a-zA-Z0-9_-]+:/g, '')
    .replace(/\s*\|\s*/g, ' - ')
    .trim();
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <Paper
        elevation={3}
        sx={{
          p: 1.5,
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 1.5,
          fontSize: '0.8rem',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
          {item.name}
        </Typography>
        <div><strong>Moyenne :</strong> {item.average}</div>
        <div><strong>Écart-type (SD) :</strong> {item.stdDev}</div>
        <div><strong>Échantillon (N) :</strong> {item.n}</div>
        {item.values && item.values.length > 0 && (
          <div style={{ marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
            Valeurs : [{item.values.join(', ')}]
          </div>
        )}
      </Paper>
    );
  }
  return null;
};

const Data = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormIndex, setSelectedFormIndex] = useState(0);
  const [onlySignificant, setOnlySignificant] = useState(false);
  const [mergeBlocks, setMergeBlocks] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/data/responses');
        setResponses(response.data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des réponses :', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, []);

  // Télécharger l'export Excel (.xlsx)
  const downloadExcel = async () => {
    try {
      const response = await fetch('/api/data/responses/exportResponsesToExcel');
      if (!response.ok) throw new Error('Erreur de téléchargement');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reponses_form261_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors du téléchargement du fichier Excel.');
    }
  };

  // Télécharger l'export Tidy Data CSV (.csv)
  const downloadTidyCSV = async () => {
    try {
      const response = await fetch('/api/data/responses/exportTidyCSV');
      if (!response.ok) throw new Error('Erreur de téléchargement');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tidy_data_form261_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors du téléchargement du fichier CSV.');
    }
  };

  // Télécharger l'export JSON (.json)
  const downloadJSON = async () => {
    try {
      const response = await fetch('/api/data/responses');
      if (!response.ok) throw new Error('Erreur de téléchargement');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reponses_form261_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue lors du téléchargement du fichier JSON.');
    }
  };


  // Traitement et analyse des données expérimentales
  const processedData = useMemo(() => {
    const allResponses = [];
    responses.forEach((file) => {
      if (Array.isArray(file.content)) {
        file.content.forEach((item) => {
          if (item && item.fieldsFields) {
            allResponses.push(item);
          }
        });
      }
    });

    if (allResponses.length === 0) return [];

    // 1. Regrouper par formulaire (par formID pour réunir toutes les sessions)
    const formsMap = {};
    allResponses.forEach((res) => {
      const key = res.formID !== undefined ? String(res.formID) : (res.name || res.fieldsFile || 'Formulaire');
      if (!formsMap[key]) {
        formsMap[key] = {
          title: res.name || res.fieldsFile || `Formulaire #${key}`,
          paramFile: res.paramFile || 'Défaut',
          items: [],
        };
      }
      formsMap[key].items.push(res);
    });

    // 2. Pour chaque formulaire, analyser chaque question numérique
    return Object.entries(formsMap).map(([formKey, formData]) => {
      const { title, items } = formData;

      // Détecter les facteurs avec valeurs numériques
      const factorSet = new Set();
      items.forEach((it) => {
        Object.entries(it.fieldsFields || {}).forEach(([fKey, fVal]) => {
          if (fVal !== '' && fVal !== null && fVal !== undefined && !isNaN(parseFloat(fVal))) {
            factorSet.add(fKey);
          }
        });
      });

      const factors = Array.from(factorSet);

      // Regrouper les réponses par combinaison de paramètres (excluant UserID et les blocs de contrebalancement)
      const paramsMap = {};
      items.forEach((it) => {
        const params = { ...(it.parametersFields || {}) };
        delete params.UserID;
        delete params.id;
        delete params.trialOrder;

        // FUSION DES GROUPES DE CONTREBALANCEMENT :
        // Le bloc (A1, A2...) sert uniquement à neutraliser l'ordre de passation.
        // En analyse statistique, on regroupe les réponses d'une même condition indépendamment du bloc.
        if (mergeBlocks) {
          delete params.Block;
          delete params.Bloc;
          delete params.block;
          delete params.bloc;
          delete params.Group;
          delete params.group;
          delete params.Order;
          delete params.order;
          delete params.MacroBlock;
          delete params.macroBlock;
        }

        const pKey = Object.keys(params).length > 0
          ? Object.entries(params).map(([k, v]) => `${k}:${v}`).join(' | ')
          : 'Global';

        if (!paramsMap[pKey]) paramsMap[pKey] = [];
        paramsMap[pKey].push(it);
      });

      // Analyser chaque facteur
      const factorAnalyses = factors.map((factor) => {
        const conditionGroups = Object.entries(paramsMap)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { numeric: true }))
          .map(([rawParamKey, paramItems], idx) => {
          const values = [];
          paramItems.forEach((it) => {
            const raw = it.fieldsFields?.[factor];
            const v = parseFloat(raw);
            if (!isNaN(v)) values.push(v);
          });

          const desc = getDescriptives(values);

          return {
            rawKey: rawParamKey,
            name: cleanParamName(rawParamKey),
            values,
            value: desc.mean,
            average: desc.mean,
            stdDev: desc.stdDev,
            n: desc.n,
            color: PALETTE[idx % PALETTE.length],
          };
        }).filter((g) => g.values.length > 0);

        // Calcul du test de significativité
        const significance = analyzeFactorSignificance(conditionGroups);

        return {
          factor,
          conditionGroups,
          significance,
          isSignificant: Boolean(significance?.isSignificant),
        };
      });

      const significantCount = factorAnalyses.filter((f) => f.isSignificant).length;

      return {
        formKey,
        title,
        factors: factorAnalyses,
        totalFactors: factorAnalyses.length,
        significantCount,
      };
    }).filter((f) => f.totalFactors > 0);
  }, [responses, mergeBlocks]);

  // Statistiques globales
  const overallStats = useMemo(() => {
    let totalFactors = 0;
    let totalSignificant = 0;
    processedData.forEach((form) => {
      totalFactors += form.totalFactors;
      totalSignificant += form.significantCount;
    });
    return {
      totalForms: processedData.length,
      totalFactors,
      totalSignificant,
      percentage: totalFactors > 0 ? Math.round((totalSignificant / totalFactors) * 100) : 0,
    };
  }, [processedData]);

  // Formulaire actuellement sélectionné
  const currentForm = processedData[selectedFormIndex] || processedData[0];

  // Facteurs filtrés selon le switch "différences significatives"
  const displayedFactors = useMemo(() => {
    if (!currentForm) return [];
    if (!onlySignificant) return currentForm.factors;
    return currentForm.factors.filter((f) => f.isSignificant);
  }, [currentForm, onlySignificant]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (processedData.length === 0) {
    return (
      <Box sx={{ maxWidth: '1000px', margin: '0 auto', p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Graphiques & Statistiques
        </Typography>
        <Alert severity="info" sx={{ mt: 3 }}>
          Aucune donnée numérique enregistrée pour le moment. Remplissez des formulaires ou générez un jeu de données pour visualiser les statistiques.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 2 }}>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
            Graphiques & Tests Statistiques
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualisation simplifiée des moyennes par condition et détection automatique des différences statistiquement significatives (ANOVA / Test t).
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadExcel}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              borderColor: '#0284c7',
              color: '#0284c7',
              '&:hover': {
                borderColor: '#0369a1',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
              },
            }}
          >
            Exporter Excel (.xlsx)
          </Button>

          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={downloadTidyCSV}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              borderColor: '#10b981',
              color: '#059669',
              '&:hover': {
                borderColor: '#059669',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
              },
            }}
          >
            Exporter CSV (.csv)
          </Button>

          <Button
            variant="outlined"
            startIcon={<DataObjectIcon />}
            onClick={downloadJSON}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              borderColor: '#8b5cf6',
              color: '#7c3aed',
              '&:hover': {
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(139, 92, 246, 0.08)',
              },
            }}
          >
            Exporter JSON (.json)
          </Button>
        </Stack>
      </Box>


      {/* Cartes de synthèse globale */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper elevation={1} sx={{ p: 2, flex: 1, borderRadius: 2, borderLeft: '4px solid #3b82f6' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            Questionnaires analysés
          </Typography>
          <Typography variant="h5" fontWeight={700} color="#1e293b" sx={{ mt: 0.5 }}>
            {overallStats.totalForms}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, flex: 1, borderRadius: 2, borderLeft: '4px solid #6366f1' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            Questions / Facteurs testés
          </Typography>
          <Typography variant="h5" fontWeight={700} color="#1e293b" sx={{ mt: 0.5 }}>
            {overallStats.totalFactors}
          </Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, flex: 1, borderRadius: 2, borderLeft: '4px solid #10b981' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            Effets Significatifs (p &lt; 0.05)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
            <Typography variant="h5" fontWeight={700} color="#10b981">
              {overallStats.totalSignificant}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({overallStats.percentage}%)
            </Typography>
          </Box>
        </Paper>
      </Stack>

      {/* Barre d'onglets pour choisir le questionnaire */}
      <Paper elevation={1} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, backgroundColor: '#f8fafc' }}>
          <Tabs
            value={selectedFormIndex}
            onChange={(_, val) => setSelectedFormIndex(val)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {processedData.map((form, idx) => (
              <Tab
                key={idx}
                icon={<BarChartIcon fontSize="small" />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{form.title}</span>
                    {form.significantCount > 0 && (
                      <Chip
                        label={`${form.significantCount} signif.`}
                        size="small"
                        color="success"
                        sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Barre de filtre et contrôles */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            backgroundColor: '#ffffff',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mergeBlocks}
                  onChange={(e) => setMergeBlocks(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    Fusionner les groupes (contrebalancement)
                  </Typography>
                  <Chip
                    label="Actif"
                    size="small"
                    color="primary"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800 }}
                  />
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={onlySignificant}
                  onChange={(e) => setOnlySignificant(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600} color="#1e293b">
                  Différences significatives uniquement (p &lt; 0.05)
                </Typography>
              }
            />
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Légende :
            </Typography>
            <Chip size="small" label="*** p < 0.001" sx={{ height: 20, fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }} />
            <Chip size="small" label="** p < 0.01" sx={{ height: 20, fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }} />
            <Chip size="small" label="* p < 0.05" sx={{ height: 20, fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600 }} />
            <Chip size="small" label="ns p ≥ 0.05" sx={{ height: 20, fontSize: '0.68rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
          </Box>
        </Box>

        {/* Message informatif sur la fusion des groupes */}
        {mergeBlocks && (
          <Box sx={{ px: 2, pb: 1.5, backgroundColor: '#ffffff' }}>
            <Alert severity="info" sx={{ py: 0.4, borderRadius: 1.5, fontSize: '0.78rem' }}>
              <strong>Groupes de contrebalancement fusionnés :</strong> les blocs (A1, A2, B1, B2...) sont agrégés afin de neutraliser les effets d&apos;ordre et comparer directement les modalités expérimentales avec l&apos;ensemble de la cohorte de participants.
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Liste des cartes de graphiques */}
      {displayedFactors.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <FilterAltIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Aucune différence significative trouvée pour ce questionnaire.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Désactivez le filtre pour visualiser l&apos;ensemble des questions.
          </Typography>
        </Paper>
      ) : (
        <Box className="sub-plots">
          {displayedFactors.map(({ factor, conditionGroups, significance, isSignificant }, fIdx) => (
            <Paper
              key={fIdx}
              elevation={2}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                backgroundColor: '#ffffff',
                border: isSignificant ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                },
              }}
            >
              {/* En-tête de la question avec Badge de Significativité */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                  {factor}
                </Typography>

                {significance?.hasTest && (
                  <Chip
                    size="small"
                    icon={isSignificant ? <CheckCircleOutlineIcon fontSize="small" /> : undefined}
                    label={
                      isSignificant
                        ? `Significatif (${significance.stars})`
                        : `Non significatif (${significance.stars})`
                    }
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: '24px',
                      backgroundColor: isSignificant ? '#dcfce7' : '#f1f5f9',
                      color: isSignificant ? '#15803d' : '#64748b',
                      border: isSignificant ? '1px solid #86efac' : '1px solid #e2e8f0',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>

              {/* Bloc explicatif du test statistique */}
              {significance?.hasTest && (
                <Box
                  sx={{
                    mb: 2,
                    p: 1.2,
                    borderRadius: 1.5,
                    backgroundColor: isSignificant ? '#f0fdf4' : '#f8fafc',
                    border: isSignificant ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    color: isSignificant ? '#166534' : '#64748b',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <span>
                      <FunctionsIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                      <strong>{significance.testName} :</strong> {significance.statistic}, <em>p</em> = <strong>{significance.pFormatted}</strong> ({significance.stars})
                    </span>
                    {isSignificant && (
                      <span style={{ fontWeight: 700, color: '#15803d' }}>Différence prouvée</span>
                    )}
                  </Box>

                  {/* Comparaisons deux-à-deux significatives */}
                  {significance.significantPairs && significance.significantPairs.length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #bbf7d0', display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Différences par paire :</span>
                      {significance.significantPairs.map((p, pIdx) => (
                        <Chip
                          key={pIdx}
                          size="small"
                          label={`${p.label || `${p.groupA} vs ${p.groupB}`} : p = ${p.pFormatted} ${p.stars}`}
                          sx={{
                            height: '20px',
                            fontSize: '0.68rem',
                            backgroundColor: '#dcfce7',
                            color: '#14532d',
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Graphique simple et lisible */}
              <Box sx={{ width: '100%', height: 230, mt: 'auto' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conditionGroups}
                    margin={{ top: 22, right: 10, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(val) => (typeof val === 'number' ? val.toFixed(1) : val)}
                        style={{ fill: '#0f172a', fontSize: 11, fontWeight: 700 }}
                      />
                      {conditionGroups.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

              {/* Récapitulatif chiffré sous le graphique */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: 1.5 }}>
                {conditionGroups.map((d, cIdx) => (
                  <Box key={cIdx} sx={{ textAlign: 'center', minWidth: '75px' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: d.color,
                        fontWeight: 700,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px',
                      }}
                    >
                      {d.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      M = {d.average}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                      SD = {d.stdDev} (N={d.n})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Data;
