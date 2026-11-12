const path = require('path');
const { readJson } = require('../services/fileService');
const { loadProtocol, saveProtocolDefinition, expandProtocol } = require('../services/protocolService');

const participantsFilePath = path.join(__dirname, '../participants.json');

// Noms réservés : ils servent déjà de clés dans les essais et les paramètres
const RESERVED_FACTOR_NAMES = ['userid', 'block', 'trialorder', 'macroblock', 'subtrial', 'id'];

// Nettoie les facteurs reçus du client. Retourne { factors } ou { error }.
const sanitizeFactors = (rawFactors) => {
  if (!Array.isArray(rawFactors) || rawFactors.length === 0) {
    return { error: 'Au moins un facteur expérimental est requis' };
  }

  const seen = new Set();
  const factors = [];
  for (const raw of rawFactors) {
    const name = String(raw?.name ?? '').trim();
    if (!name) return { error: 'Chaque facteur doit avoir un nom' };

    const key = name.toLowerCase();
    if (RESERVED_FACTOR_NAMES.includes(key)) {
      return { error: `Le nom de facteur "${name}" est réservé` };
    }
    if (seen.has(key)) return { error: `Le facteur "${name}" est défini plusieurs fois` };
    seen.add(key);

    const values = [...new Set(
      (Array.isArray(raw.values) ? raw.values : []).map((v) => String(v ?? '').trim()).filter(Boolean)
    )];
    if (values.length === 0) return { error: `Le facteur "${name}" n'a aucune modalité définie` };

    factors.push({ name, values });
  }
  return { factors };
};

// Récupérer le protocole actif (facteurs, conditions et blocs calculés)
exports.getProtocol = (req, res) => {
  try {
    res.json(loadProtocol());
  } catch (error) {
    console.error('Erreur getProtocol:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du protocole' });
  }
};

// Mettre à jour la définition du protocole
exports.updateProtocol = (req, res) => {
  try {
    const { name, counterbalancingMethod, blockedFactorName } = req.body || {};

    const { factors, error } = sanitizeFactors(req.body?.factors);
    if (error) {
      return res.status(400).json({ message: error });
    }

    res.json(saveProtocolDefinition({ name, factors, counterbalancingMethod, blockedFactorName }));
  } catch (error) {
    console.error('Erreur updateProtocol:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du protocole' });
  }
};

// Aperçu : calcule les blocs d'une définition en cours d'édition, SANS l'enregistrer.
// Sert à mettre à jour la matrice de contrebalancement au fil des modifications.
exports.previewProtocol = (req, res) => {
  try {
    const { name, counterbalancingMethod, blockedFactorName } = req.body || {};

    // En cours de saisie, un facteur peut ne pas encore avoir de modalité : il est ignoré
    const draft = (Array.isArray(req.body?.factors) ? req.body.factors : []).filter(
      (f) => Array.isArray(f?.values) && f.values.some((v) => String(v ?? '').trim())
    );
    if (draft.length === 0) {
      return res.json(expandProtocol({ name, factors: [], counterbalancingMethod, blockedFactorName }));
    }

    const { factors, error } = sanitizeFactors(draft);
    if (error) {
      return res.status(400).json({ message: error });
    }

    res.json(expandProtocol({ name, factors, counterbalancingMethod, blockedFactorName }));
  } catch (error) {
    console.error('Erreur previewProtocol:', error);
    res.status(500).json({ message: "Erreur lors du calcul de l'aperçu du protocole" });
  }
};

// Répartition des sujets par bloc et prochain bloc conseillé (le moins rempli)
exports.getProtocolStats = (req, res) => {
  try {
    const blockKeys = Object.keys(loadProtocol().blocks || {});
    const participants = readJson(participantsFilePath, []);

    const distribution = Object.fromEntries(blockKeys.map((k) => [k, 0]));
    participants.forEach((p) => {
      if (p.Block && distribution[p.Block] !== undefined) distribution[p.Block] += 1;
    });

    let suggestedBlock = blockKeys[0] || 'A';
    blockKeys.forEach((k) => {
      if (distribution[k] < distribution[suggestedBlock]) suggestedBlock = k;
    });

    // Regroupement par famille de blocs (A1 et A2 -> groupe A), pour la matrice du protocole
    const groupDistribution = {};
    blockKeys.forEach((k) => {
      const group = k.replace(/[0-9]+$/, '') || k;
      if (!groupDistribution[group]) groupDistribution[group] = { group, count: 0, blocks: [] };
      groupDistribution[group].count += distribution[k];
      groupDistribution[group].blocks.push(k);
    });

    res.json({
      blocks: blockKeys,
      distribution,
      groupDistribution,
      suggestedBlock,
      totalParticipants: participants.length,
    });
  } catch (error) {
    console.error('Erreur getProtocolStats:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques de protocole' });
  }
};
