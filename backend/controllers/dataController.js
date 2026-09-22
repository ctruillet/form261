const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const axios = require('axios'); // Pour effectuer les requêtes HTTP
const { v4: uuidv4 } = require('uuid'); // Utilisé pour générer des IDs uniques

// Chemin vers le fichier où les données sont stockées
// const dataFilePath = path.join(__dirname, '../data.json');
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

// Enregistrer les données soumises via un formulaire
exports.registerData = (req, res) => {
  ensureAnswersFolderExists();
  const data = { ...req.body, id: uuidv4() }; // Ajoute un ID unique à chaque nouvelle réponse
  const answersFilePath = path.join(answersFolderPath, `${data.formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, fileData) => {
    let jsonData = [];

    // Si le fichier n'existe pas, initialise jsonData comme un tableau vide
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`Fichier ${data.formID}.json non trouvé, création d'un nouveau fichier.`);
      } else {
        console.error(err);
        return res.status(500).json({ message: 'Erreur de lecture du fichier' });
      }
    } else {
      // Si le fichier existe, parse son contenu
      try {
        jsonData = JSON.parse(fileData || '[]');
      } catch (parseError) {
        console.error('Erreur de parsing du fichier:', parseError);
        return res.status(500).json({ message: 'Erreur de parsing du fichier' });
      }
    }

    // Ajoute les nouvelles données au tableau
    jsonData.push(data);

    // Écrit les données mises à jour dans le fichier
    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de l\'écriture du fichier' });
      }
      res.status(200).json({ message: 'Données enregistrées avec succès', id: data.id });
    });
  });
};

// Modifier une réponse via le formulaire
exports.modifyData = (req, res) => {
  ensureAnswersFolderExists();
  const data = req.body;
  const id = data.id;
  const answersFilePath = path.join(answersFolderPath, `${data.formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, fileData) => {
    let jsonData = [];

    // Si le fichier n'existe pas, initialise jsonData comme un tableau vide
    if (err) {
      if (err.code === 'ENOENT') {
        console.log(`Fichier ${data.formID}.json non trouvé.`);
        return res.status(404).json({ message: 'Fichier de formulaire non trouvé' });
      } else {
        console.error(err);
        return res.status(500).json({ message: 'Erreur de lecture du fichier' });
      }
    } else {
      // Si le fichier existe, parse son contenu
      try {
        jsonData = JSON.parse(fileData || '[]');
      } catch (parseError) {
        console.error('Erreur de parsing du fichier:', parseError);
        return res.status(500).json({ message: 'Erreur de parsing du fichier' });
      }
    }

    // Cherche la réponse à modifier par son ID
    const index = jsonData.findIndex((item) => item.id === id);

    if (index === -1) {
      // Si la réponse n'est pas trouvée, retourne une erreur
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    // Met à jour les données de la réponse
    jsonData[index] = { ...jsonData[index], ...data };

    // Écrit les données mises à jour dans le fichier
    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
      if (writeErr) {
        console.error(writeErr);
        return res.status(500).json({ message: 'Erreur lors de l\'écriture du fichier' });
      }

      res.status(200).json({ message: 'Données modifiées avec succès', id });
    });
  });
};


// Récupérer toutes les réponses
exports.getAllResponses = (req, res) => {
  ensureAnswersFolderExists();
  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture du dossier de réponses' });
    }

    const jsonFiles = (files || []).filter(file => path.extname(file) === '.json');
    if (jsonFiles.length === 0) {
      return res.status(200).json([]);
    }

    const allResponses = [];
    jsonFiles.forEach((file) => {
      const filePath = path.join(answersFolderPath, file);
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data || '[]');
        allResponses.push({ file: file, content: jsonData });
      } catch (error) {
        console.error(`Erreur de lecture du fichier ${file}:`, error);
      }
    });

    res.status(200).json(allResponses);
  });
};

// Récuperer les réponses d'un formulaire spécifique
exports.getResponsesByFormID = (req, res) => {
  ensureAnswersFolderExists();
  const formID = req.params.formID;
  const answersFilePath = path.join(answersFolderPath, `${formID}.json`);

  fs.readFile(answersFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Un formulaire sans réponses retourne un tableau vide au lieu d'une erreur 500
        return res.status(200).json([]);
      }
      console.error(`Erreur de lecture du fichier ${answersFilePath}:`, err);
      return res.status(500).json({ message: `Erreur de lecture du fichier ${formID}.json de réponses` });
    }

    try {
      const jsonData = JSON.parse(data || '[]');
      return res.status(200).json(jsonData);
    } catch (parseError) {
      console.error('Erreur de parsing du fichier:', parseError);
      return res.status(500).json({ message: 'Erreur de parsing du fichier de réponses' });
    }
  });
};

// Récupérer une réponse d'un formulaire spécifique
exports.getResponseByID = (req, res) => {
  const id = req.params.id;

  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error('Erreur de lecture du répertoire:', err);
      return res.status(500).json({ message: 'Erreur de lecture du répertoire des réponses' });
    }

    let foundResponse = null;  // Variable pour stocker la réponse trouvée

    // Utiliser une promesse pour s'assurer que nous lisons tous les fichiers avant de répondre
    let filePromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        if (path.extname(file) === '.json') {  // Vérifier si c'est un fichier .json
          const answersFilePath = path.join(answersFolderPath, file);  // Créer le chemin complet du fichier

          fs.readFile(answersFilePath, 'utf8', (err, data) => {
            if (err) {
              console.error(`Erreur de lecture du fichier ${answersFilePath}:`, err);
              reject(`Erreur de lecture du fichier ${file} de réponses`);
            }

            try {
              let jsonData = JSON.parse(data || '[]');
              const response = jsonData.find((response) => response.id === id); // Trouver la réponse par ID

              if (response) {
                foundResponse = response;  // Stocker la réponse trouvée
              }
              resolve();
            } catch (parseError) {
              console.error('Erreur de parsing du fichier:', parseError);
              reject('Erreur de parsing du fichier de réponses');
            }
          });
        } else {
          resolve();  // Si ce n'est pas un fichier JSON, on continue
        }
      });
    });

    // Une fois que toutes les promesses sont résolues, on renvoie la réponse
    Promise.all(filePromises)
      .then(() => {
        if (foundResponse) {
          console.log(foundResponse);
          return res.status(200).json(foundResponse); // Retourner la réponse trouvée
        } else {
          return res.status(404).json({ message: `Réponse avec l'ID ${id} non trouvée` });
        }
      })
      .catch((error) => {
        console.error('Erreur:', error);
        return res.status(500).json({ message: 'Erreur de traitement des fichiers de réponses' });
      });
  });
};

exports.deleteResponseByID = (req, res) => {
  const id = req.params.id;

  fs.readdir(answersFolderPath, (err, files) => {
    if (err) {
      console.error("Erreur de lecture du répertoire :", err);
      return res.status(500).json({ message: "Erreur de lecture du répertoire des réponses" });
    }

    let filePromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        if (path.extname(file) === ".json") {
          const answersFilePath = path.join(answersFolderPath, file);

          fs.readFile(answersFilePath, "utf8", (err, data) => {
            if (err) {
              console.error(`Erreur de lecture du fichier ${answersFilePath} :`, err);
              return reject(`Erreur de lecture du fichier ${file} de réponses`);
            }

            try {
              let jsonData = JSON.parse(data || "[]");
              const initialLength = jsonData.length;

              // Filtrer les réponses pour supprimer celle avec l'ID correspondant
              jsonData = jsonData.filter((response) => response.id !== id);

              if (jsonData.length < initialLength) {
                // Si une réponse a été supprimée, écrire le fichier mis à jour
                fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                  if (writeErr) {
                    console.error(`Erreur d'écriture dans le fichier ${answersFilePath} :`, writeErr);
                    return reject(`Erreur d'écriture dans le fichier ${file}`);
                  }
                  console.log(`Réponse avec l'ID ${id} supprimée du fichier ${file}`);
                  resolve(true); // Indique qu'une suppression a été effectuée
                });
              } else {
                resolve(false); // Aucun élément supprimé dans ce fichier
              }
            } catch (parseError) {
              console.error("Erreur de parsing du fichier :", parseError);
              reject("Erreur de parsing du fichier de réponses");
            }
          });
        } else {
          resolve(false); // Ignorer les fichiers non-JSON
        }
      });
    });

    Promise.all(filePromises)
      .then((results) => {
        const isDeleted = results.some((result) => result); // Vérifie si au moins une suppression a eu lieu
        if (isDeleted) {
          return res.status(200).json({ message: `Réponse avec l'ID ${id} supprimée avec succès` });
        } else {
          return res.status(404).json({ message: `Réponse avec l'ID ${id} non trouvée` });
        }
      })
      .catch((error) => {
        console.error("Erreur :", error);
        return res.status(500).json({ message: "Erreur de traitement des fichiers de réponses" });
      });
  });
};


// Mettre à jour une réponse
exports.updateResponse = (req, res) => {
  const id = req.params.id;
  const formID = req.params.formID;
  const answersFilePath = path.join(answersFolderPath, `${formID}.json`);

  const updatedData = req.body;

  fs.readFile(answersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur de lecture des réponses' });
    }

    let jsonData = JSON.parse(data || '[]');
    const responseIndex = jsonData.findIndex((response) => response.id === id);

    if (responseIndex === -1) {
      return res.status(404).json({ message: 'Réponse non trouvée' });
    }

    jsonData[responseIndex] = { ...jsonData[responseIndex], ...updatedData };

    fs.writeFile(answersFilePath, JSON.stringify(jsonData, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erreur lors de la mise à jour de la réponse' });
      }
      res.status(200).json({ message: 'Réponse mise à jour avec succès' });
    });
  });
};



exports.exportResponsesToExcel = (req, res) => {
  ensureAnswersFolderExists();
  const outputFilePath = path.join(__dirname, 'exported_responses.xlsx');

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
      // Écrit le classeur Excel dans un fichier
      xlsx.writeFile(workbook, outputFilePath);

      // Télécharge le fichier Excel
      res.download(outputFilePath, 'exported_responses.xlsx', (downloadErr) => {
        if (downloadErr) {
          console.error('Erreur lors du téléchargement du fichier:', downloadErr);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Erreur lors du téléchargement du fichier Excel' });
          }
        } else {
          console.log('Fichier Excel téléchargé avec succès');
        }
      });
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

    // 2. Ordonner les facteurs/paramètres (ex: UserID en premier, puis Technique/Condition, Block, etc.)
    const sortedParamKeys = Array.from(paramKeySet).sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower.includes('user') || aLower.includes('partic')) return -1;
      if (bLower.includes('user') || bLower.includes('partic')) return 1;
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