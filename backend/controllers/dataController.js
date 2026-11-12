const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { v4: uuidv4 } = require('uuid'); // Utilisé pour générer des IDs uniques
const { readJson, writeJson, listJsonFiles } = require('../services/fileService');

// Dossier où les réponses sont stockées (un fichier <formID>.json par formulaire)
const answersFolderPath = path.join(__dirname, '../answers/');

// Fonction pour aplatir un objet JSON
const flattenObject = (obj, parent = '', res = {}) => {
  for (let key in obj) {
    const propName = key;

    if (Array.isArray(obj[key])) {
      // Si c'est un tableau, crée des clés pour chaque élément
      obj[key].forEach((item, index) => {
        const arrayKey = `${propName}.${index+1}`;
        if (typeof item === 'object' && item !== null) {
          flattenObject(item, arrayKey, res); // Aplati les objets imbriqués dans le tableau
        } else {
          res[arrayKey] = item;
        }
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Si c'est un objet (non tableau), aplatir récursivement
      flattenObject(obj[key], propName, res);
    } else {
      // Ajoute les valeurs primitives directement
      res[propName] = obj[key];
    }
  }
  return res;
};


const ensureAnswersFolderExists = () => {
  if (!fs.existsSync(answersFolderPath)) {
    fs.mkdirSync(answersFolderPath, { recursive: true });
  }
};

// Un formID sert de nom de fichier : on n'accepte que des identifiants simples
// (pas de séparateur de chemin, pas de "..").
const isValidFormID = (formID) =>
  formID !== undefined && formID !== null && /^[A-Za-z0-9_-]+$/.test(String(formID));

const getAnswersFilePath = (formID) => path.join(answersFolderPath, `${formID}.json`);

// Lecture / écriture synchrones : Node étant mono-thread, chaque cycle
// lecture-modification-écriture est ainsi atomique vis-à-vis des autres requêtes
// (deux soumissions simultanées ne peuvent plus s'écraser mutuellement).
const readAnswers = (formID) => {
  const content = readJson(getAnswersFilePath(formID), []);
  return Array.isArray(content) ? content : [];
};

const writeAnswers = (formID, answers) => {
  ensureAnswersFolderExists();
  writeJson(getAnswersFilePath(formID), answers);
};

// Recherche une réponse par son ID dans tous les fichiers de réponses
const findResponseLocation = (id) => {
  for (const file of listJsonFiles(answersFolderPath)) {
    const formID = path.basename(file, '.json');
    let answers;
    try {
      answers = readAnswers(formID);
    } catch (err) {
      console.error(`Erreur de lecture du fichier ${file}:`, err);
      continue;
    }
    const index = answers.findIndex((response) => response && response.id === id);
    if (index !== -1) return { formID, answers, index };
  }
  return null;
};

// Enregistrer les données soumises via un formulaire
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

// Fusionne une mise à jour dans une réponse existante (l'ID n'est jamais modifiable)
const applyResponseUpdate = (formID, id, updatedData, res) => {
  if (!isValidFormID(formID)) {
    return res.status(400).json({ message: 'Identifiant de formulaire (formID) manquant ou invalide' });
  }

  try {
    const answers = readAnswers(formID);
    const index = answers.findIndex((item) => item && item.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    answers[index] = {
      ...answers[index],
      ...updatedData,
      id,
      formID: answers[index].formID,
      updatedAt: new Date().toISOString(),
    };
    writeAnswers(formID, answers);
    res.status(200).json({ message: 'Données modifiées avec succès', id });
  } catch (err) {
    console.error('Erreur de mise à jour de la réponse:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la réponse' });
  }
};

// Modifier une réponse via le formulaire
exports.modifyData = (req, res) => {
  const data = req.body || {};
  if (!data.id) {
    return res.status(400).json({ message: 'Identifiant de réponse (id) manquant' });
  }
  applyResponseUpdate(data.formID, data.id, data, res);
};

// Mettre à jour une réponse
exports.updateResponse = (req, res) => {
  applyResponseUpdate(req.params.formID, req.params.id, req.body || {}, res);
};

// Récupérer toutes les réponses
exports.getAllResponses = (req, res) => {
  try {
    const allResponses = [];
    listJsonFiles(answersFolderPath).forEach((file) => {
      try {
        const content = readJson(path.join(answersFolderPath, file), []);
        allResponses.push({ file, content: Array.isArray(content) ? content : [] });
      } catch (error) {
        console.error(`Erreur de lecture du fichier ${file}:`, error);
      }
    });
    res.status(200).json(allResponses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur de lecture du dossier de réponses' });
  }
};

// Récuperer les réponses d'un formulaire spécifique
exports.getResponsesByFormID = (req, res) => {
  const formID = req.params.formID;
  if (!isValidFormID(formID)) {
    return res.status(400).json({ message: 'Identifiant de formulaire invalide' });
  }

  try {
    // Un formulaire sans réponses retourne un tableau vide
    res.status(200).json(readAnswers(formID));
  } catch (err) {
    console.error(`Erreur de lecture des réponses du formulaire ${formID}:`, err);
    res.status(500).json({ message: `Erreur de lecture du fichier ${formID}.json de réponses` });
  }
};

// Récupérer une réponse par son ID
exports.getResponseByID = (req, res) => {
  const id = req.params.id;
  try {
    const found = findResponseLocation(id);
    if (!found) {
      return res.status(404).json({ message: `Réponse avec l'ID ${id} non trouvée` });
    }
    res.status(200).json(found.answers[found.index]);
  } catch (err) {
    console.error('Erreur getResponseByID:', err);
    res.status(500).json({ message: 'Erreur de traitement des fichiers de réponses' });
  }
};

// Supprimer une réponse par son ID
exports.deleteResponseByID = (req, res) => {
  const id = req.params.id;
  try {
    const found = findResponseLocation(id);
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



exports.exportResponsesToExcel = (req, res) => {
  ensureAnswersFolderExists();

  // Lis les fichiers dans le dossier des réponses
  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier:', err);
      return res.status(500).json({ message: 'Erreur de lecture du dossier des réponses' });
    }

    const workbook = xlsx.utils.book_new(); // Crée un nouveau classeur Excel
    const jsonFiles = (files || []).filter((file) => path.extname(file) === '.json');
    const usedSheetNames = new Set();

    // Traite chaque fichier JSON
    jsonFiles.forEach((file) => {
      const filePath = path.join(answersFolderPath, file);
      const baseName = path.basename(file, '.json');

      try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const responses = JSON.parse(fileData || '[]');

        if (Array.isArray(responses) && responses.length > 0) {
          // Transforme les données en format tabulaire
          const worksheetData = responses.map((response, index) => ({
            Index: index + 1, // Ajoute un numéro de ligne
            ...flattenObject(response),
          }));

          // Crée une feuille Excel à partir des données
          const worksheet = xlsx.utils.json_to_sheet(worksheetData);

          // Nom de la feuille : nettoyer les caractères interdits Excel \ / ? * : [ ]
          let rawName = responses[0].name || baseName;
          let sheetName = String(rawName).replace(/[:\\/?*\[\]]/g, "_").trim().substring(0, 28);
          if (!sheetName) sheetName = `Form_${baseName}`;

          // Garantir l'unicité du nom de la feuille (limite max 31 caractères dans Excel)
          let candidate = sheetName;
          let counter = 1;
          while (usedSheetNames.has(candidate.toLowerCase())) {
            candidate = `${sheetName.substring(0, 25)}_${counter++}`;
          }
          usedSheetNames.add(candidate.toLowerCase());

          xlsx.utils.book_append_sheet(workbook, worksheet, candidate);
        }
      } catch (readError) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, readError);
      }
    });

    // Si aucune feuille n'a pu être créée (aucun retour ou dossier vide), ajouter une feuille par défaut
    if (workbook.SheetNames.length === 0) {
      const placeholder = xlsx.utils.json_to_sheet([{ Statut: "Aucune réponse enregistrée" }]);
      xlsx.utils.book_append_sheet(workbook, placeholder, "Réponses");
    }

    try {
      // Génère le classeur en mémoire (aucun fichier temporaire écrit dans le dépôt)
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="exported_responses.xlsx"');
      res.status(200).send(buffer);
    } catch (writeErr) {
      console.error('Erreur lors de l\'écriture du fichier Excel:', writeErr);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Erreur lors de la génération du fichier Excel' });
      }
    }
  });
};

// Exporter toutes les réponses au format Tidy Data (format long CSV pour R, Python, JASP)
exports.exportTidyCSV = (req, res) => {
  ensureAnswersFolderExists();
  const targetFormID = req.query.formID;

  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier:', err);
      return res.status(500).json({ message: 'Erreur de lecture du dossier des réponses' });
    }

    const jsonFiles = (files || []).filter((file) => {
      if (path.extname(file) !== '.json') return false;
      if (targetFormID !== undefined && targetFormID !== null && targetFormID !== '') {
        return path.basename(file, '.json') === String(targetFormID);
      }
      return true;
    });

    const allResponses = [];
    const paramKeySet = new Set();

    // 1. Lire et agréger les réponses
    jsonFiles.forEach((file) => {
      const filePath = path.join(answersFolderPath, file);
      try {
        const fileData = fs.readFileSync(filePath, 'utf8');
        const responses = JSON.parse(fileData || '[]');
        if (Array.isArray(responses)) {
          responses.forEach((resp) => {
            if (!resp) return;
            allResponses.push(resp);
            if (resp.parametersFields && typeof resp.parametersFields === 'object') {
              Object.keys(resp.parametersFields).forEach((key) => paramKeySet.add(key));
            }
          });
        }
      } catch (readErr) {
        console.error(`Erreur lecture fichier ${file}:`, readErr);
      }
    });

    // 2. Ordonner les facteurs/paramètres (UserID, puis Block, puis TrialOrder, puis les facteurs expérimentaux)
    const sortedParamKeys = Array.from(paramKeySet).sort((a, b) => {
      const getPriority = (k) => {
        const l = k.toLowerCase();
        if (l.includes('user') || l.includes('partic')) return 1;
        if (l === 'block') return 2;
        if (l === 'trialorder' || l === 'order' || l.includes('essai')) return 3;        return 4;
      };
      const pA = getPriority(a);
      const pB = getPriority(b);
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b);
    });

    // 3. Définir les colonnes Tidy Data
    const headers = [
      'ResponseID',
      'FormID',
      'FormName',
      ...sortedParamKeys,
      'Question',
      'Value',
      'NumericValue'
    ];

    // Helper d'échappement CSV RFC 4180
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [];
    csvLines.push(headers.map(escapeCSV).join(','));

    // 4. Générer 1 ligne par mesure/question (Long format)
    allResponses.forEach((resp) => {
      const respId = resp.id || '';
      const formId = resp.formID !== undefined ? resp.formID : '';
      const formName = resp.name || '';
      const params = resp.parametersFields || {};
      const fields = resp.fieldsFields || {};

      const baseParamValues = sortedParamKeys.map((k) =>
        params[k] !== undefined && params[k] !== null ? params[k] : ''
      );

      Object.entries(fields).forEach(([questionLabel, val]) => {
        let displayVal = '';
        let numericVal = '';

        if (val === null || val === undefined) {
          displayVal = '';
        } else if (Array.isArray(val)) {
          displayVal = val.join(' > ');
        } else if (typeof val === 'object') {
          displayVal = JSON.stringify(val);
        } else {
          displayVal = String(val);
          const num = Number(val);
          if (!isNaN(num) && typeof val !== 'boolean' && String(val).trim() !== '') {
            numericVal = String(num);
          }
        }

        const row = [
          respId,
          formId,
          formName,
          ...baseParamValues,
          questionLabel,
          displayVal,
          numericVal
        ];

        csvLines.push(row.map(escapeCSV).join(','));
      });
    });

    // 5. UTF-8 avec BOM (\uFEFF) pour compatibilité Excel & R sans altération des accents
    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const formPrefix = targetFormID !== undefined && targetFormID !== '' ? `form${targetFormID}_` : '';
    const filename = `tidy_data_${formPrefix}${year}-${month}-${day}_${hours}h${minutes}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  });
};

// Exporter toutes les réponses au format JSON
exports.exportResponsesToJSON = (req, res) => {
  ensureAnswersFolderExists();
  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error('Erreur lors de la lecture du dossier:', err);
      return res.status(500).json({ message: 'Erreur de lecture du dossier des réponses' });
    }

    const jsonFiles = (files || []).filter((file) => path.extname(file) === '.json');
    const allResponses = [];

    jsonFiles.forEach((file) => {
      try {
        const fileData = fs.readFileSync(path.join(answersFolderPath, file), 'utf8');
        allResponses.push({ file, content: JSON.parse(fileData || '[]') });
      } catch (readErr) {
        console.error(`Erreur lecture ${file}:`, readErr);
      }
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const filename = `reponses_form261_${year}-${month}-${day}_${hours}h${minutes}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(allResponses, null, 2));
  });
};