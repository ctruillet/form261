const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const {
  isValidFormID,
  readAnswers,
  writeAnswers,
  readAllAnswers,
  findResponse,
} = require('../services/answersService');

// Lecture / écriture synchrones : Node étant mono-thread, chaque cycle
// lecture-modification-écriture est atomique vis-à-vis des autres requêtes.

// Enregistrer une nouvelle réponse
exports.registerData = (req, res) => {
  const body = req.body || {};
  if (!isValidFormID(body.formID)) {
    return res.status(400).json({ message: 'Identifiant de formulaire (formID) manquant ou invalide' });
  }

  try {
    const data = { ...body, id: uuidv4(), createdAt: new Date().toISOString() };
    const answers = readAnswers(body.formID);
    answers.push(data);
    writeAnswers(body.formID, answers);
    res.status(200).json({ message: 'Données enregistrées avec succès', id: data.id });
  } catch (err) {
    console.error('Erreur registerData:', err);
    res.status(500).json({ message: "Erreur lors de l'enregistrement des données" });
  }
};

// Modifier une réponse existante (son identifiant et son questionnaire ne changent jamais)
exports.modifyData = (req, res) => {
  const data = req.body || {};
  if (!data.id) {
    return res.status(400).json({ message: 'Identifiant de réponse (id) manquant' });
  }
  if (!isValidFormID(data.formID)) {
    return res.status(400).json({ message: 'Identifiant de formulaire (formID) manquant ou invalide' });
  }

  try {
    const answers = readAnswers(data.formID);
    const index = answers.findIndex((item) => item.id === data.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    answers[index] = {
      ...answers[index],
      ...data,
      id: data.id,
      formID: answers[index].formID,
      updatedAt: new Date().toISOString(),
    };
    writeAnswers(data.formID, answers);
    res.status(200).json({ message: 'Données modifiées avec succès', id: data.id });
  } catch (err) {
    console.error('Erreur modifyData:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la réponse' });
  }
};

// Récupérer toutes les réponses : [{ file, content }]
exports.getAllResponses = (req, res) => {
  try {
    res.status(200).json(readAllAnswers().map(({ file, content }) => ({ file, content })));
  } catch (err) {
    console.error('Erreur getAllResponses:', err);
    res.status(500).json({ message: 'Erreur de lecture du dossier de réponses' });
  }
};

// Récupérer une réponse par son identifiant
exports.getResponseByID = (req, res) => {
  const id = req.params.id;
  try {
    const found = findResponse(id);
    if (!found) {
      return res.status(404).json({ message: `Réponse avec l'ID ${id} non trouvée` });
    }
    res.status(200).json(found.answers[found.index]);
  } catch (err) {
    console.error('Erreur getResponseByID:', err);
    res.status(500).json({ message: 'Erreur de traitement des fichiers de réponses' });
  }
};

// Supprimer une réponse par son identifiant
exports.deleteResponseByID = (req, res) => {
  const id = req.params.id;
  try {
    const found = findResponse(id);
    if (!found) {
      return res.status(404).json({ message: `Réponse avec l'ID ${id} non trouvée` });
    }
    found.answers.splice(found.index, 1);
    writeAnswers(found.formID, found.answers);
    res.status(200).json({ message: `Réponse avec l'ID ${id} supprimée avec succès` });
  } catch (err) {
    console.error('Erreur deleteResponseByID:', err);
    res.status(500).json({ message: 'Erreur de traitement des fichiers de réponses' });
  }
};

// Horodatage pour les noms de fichiers exportés
const fileTimestamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}`;
};

// Valeur d'une cellule : les classements (tableaux) deviennent "A > B > C"
const cellValue = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(' > ');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
};

// Export Excel : une feuille par questionnaire, une ligne par réponse
exports.exportResponsesToExcel = (req, res) => {
  try {
    const workbook = xlsx.utils.book_new();
    const usedSheetNames = new Set();

    readAllAnswers().forEach(({ formID, content }) => {
      if (content.length === 0) return;

      const rows = content.map((response, index) => {
        const row = { Index: index + 1, ResponseID: response.id };
        Object.entries(response.parametersFields || {}).forEach(([k, v]) => { row[k] = cellValue(v); });
        Object.entries(response.fieldsFields || {}).forEach(([k, v]) => { row[k] = cellValue(v); });
        row.createdAt = response.createdAt || '';
        row.updatedAt = response.updatedAt || '';
        return row;
      });

      // Nom de feuille : sans caractères interdits (\ / ? * : [ ]), 31 caractères max, unique
      const base = String(content[0].name || `Form_${formID}`).replace(/[:\\/?*[\]]/g, '_').trim().substring(0, 28) || `Form_${formID}`;
      let sheetName = base;
      let counter = 1;
      while (usedSheetNames.has(sheetName.toLowerCase())) {
        sheetName = `${base.substring(0, 25)}_${counter++}`;
      }
      usedSheetNames.add(sheetName.toLowerCase());

      xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(rows), sheetName);
    });

    if (workbook.SheetNames.length === 0) {
      const placeholder = xlsx.utils.json_to_sheet([{ Statut: 'Aucune réponse enregistrée' }]);
      xlsx.utils.book_append_sheet(workbook, placeholder, 'Réponses');
    }

    // Classeur généré en mémoire (aucun fichier temporaire)
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="reponses_form261_${fileTimestamp()}.xlsx"`);
    res.status(200).send(buffer);
  } catch (err) {
    console.error("Erreur lors de l'export Excel:", err);
    res.status(500).json({ message: 'Erreur lors de la génération du fichier Excel' });
  }
};

// Export CSV au format long (« tidy ») pour R, Python, JASP : une ligne par question
exports.exportTidyCSV = (req, res) => {
  try {
    const targetFormID = req.query.formID;
    const allResponses = readAllAnswers()
      .filter(({ formID }) => !targetFormID || String(formID) === String(targetFormID))
      .flatMap(({ content }) => content);

    // Colonnes de paramètres : UserID, puis Block, puis l'ordre d'essai, puis les facteurs
    const priority = (key) => {
      const k = key.toLowerCase();
      if (k.includes('user') || k.includes('partic')) return 1;
      if (k === 'block') return 2;
      if (k === 'trialorder' || k === 'order' || k.includes('essai')) return 3;
      return 4;
    };
    const paramKeys = [...new Set(allResponses.flatMap((r) => Object.keys(r.parametersFields || {})))]
      .sort((a, b) => priority(a) - priority(b) || a.localeCompare(b));

    // Échappement CSV (RFC 4180)
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const lines = [['ResponseID', 'FormID', 'FormName', ...paramKeys, 'Question', 'Value', 'NumericValue']];

    allResponses.forEach((resp) => {
      const params = resp.parametersFields || {};
      const base = [resp.id || '', resp.formID ?? '', resp.name || '', ...paramKeys.map((k) => params[k] ?? '')];

      Object.entries(resp.fieldsFields || {}).forEach(([question, val]) => {
        const display = cellValue(val);
        const isScalar = val !== null && typeof val !== 'object' && typeof val !== 'boolean';
        const numeric = isScalar && String(val).trim() !== '' && !Number.isNaN(Number(val)) ? String(Number(val)) : '';
        lines.push([...base, question, display, numeric]);
      });
    });

    // UTF-8 avec BOM pour qu'Excel et R lisent correctement les accents
    const csvContent = '﻿' + lines.map((row) => row.map(escapeCSV).join(',')).join('\r\n');
    const formPrefix = targetFormID ? `form${String(targetFormID).replace(/[^A-Za-z0-9_-]/g, '')}_` : '';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tidy_data_${formPrefix}${fileTimestamp()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error("Erreur lors de l'export CSV:", err);
    res.status(500).json({ message: 'Erreur lors de la génération du fichier CSV' });
  }
};
