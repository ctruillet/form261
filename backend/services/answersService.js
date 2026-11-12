const fs = require('fs');
const path = require('path');
const { readJson, listJsonFiles } = require('./fileService');

// Stockage des réponses : un fichier answers/<formID>.json par questionnaire.
//
// Format compact : une réponse par ligne, sans les champs qui se déduisent du
// questionnaire (name, formID, fieldsFile, paramFile). Ces champs sont rétablis à la
// lecture à partir de forms.json : le reste du code manipule toujours des réponses complètes.
const answersFolderPath = path.join(__dirname, '../answers');
const formsFilePath = path.join(__dirname, '../forms.json');

const FORM_DERIVED_KEYS = ['name', 'formID', 'fieldsFile', 'paramFile'];

// Un formID sert de nom de fichier : uniquement des identifiants simples
const isValidFormID = (formID) =>
  formID !== undefined && formID !== null && /^[A-Za-z0-9_-]+$/.test(String(formID));

const getAnswersFilePath = (formID) => path.join(answersFolderPath, `${formID}.json`);

// Questionnaires indexés par identifiant
const loadFormsById = () => {
  const forms = readJson(formsFilePath, []);
  const map = new Map();
  (Array.isArray(forms) ? forms : []).forEach((form) => map.set(String(form.id), form));
  return map;
};

// Réponse complète : champs dérivés rétablis depuis le questionnaire
const hydrate = (response, formID, form) => {
  if (!response || typeof response !== 'object') return response;
  const numericId = /^\d+$/.test(String(formID)) ? Number(formID) : formID;
  return {
    id: response.id,
    name: form?.name ?? response.name ?? '',
    formID: form?.id ?? response.formID ?? numericId,
    fieldsFile: form?.fields ?? response.fieldsFile ?? '',
    paramFile: form?.param ?? response.paramFile ?? '',
    ...Object.fromEntries(Object.entries(response).filter(([k]) => k !== 'id' && !FORM_DERIVED_KEYS.includes(k))),
  };
};

// Réponse stockée : sans les champs dérivés, tant que le questionnaire existe.
// (Si le questionnaire a été supprimé, on les conserve pour ne perdre aucune information.)
const dehydrate = (response, form) => {
  if (!form || !response || typeof response !== 'object') return response;
  return Object.fromEntries(Object.entries(response).filter(([k]) => !FORM_DERIVED_KEYS.includes(k)));
};

const readAnswers = (formID, formsById = loadFormsById()) => {
  const content = readJson(getAnswersFilePath(formID), []);
  const form = formsById.get(String(formID));
  return (Array.isArray(content) ? content : []).filter(Boolean).map((r) => hydrate(r, formID, form));
};

// Écriture atomique, une réponse par ligne (compact, et lisible dans un diff git)
const writeAnswers = (formID, answers, formsById = loadFormsById()) => {
  const form = formsById.get(String(formID));
  const lines = answers.map((r) => JSON.stringify(dehydrate(r, form)));
  const content = lines.length > 0 ? `[\n${lines.join(',\n')}\n]\n` : '[]\n';

  fs.mkdirSync(answersFolderPath, { recursive: true });
  const filePath = getAnswersFilePath(formID);
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* rien à nettoyer */ }
    throw err;
  }
};

const listFormIDs = () => listJsonFiles(answersFolderPath).map((file) => path.basename(file, '.json'));

// Toutes les réponses : [{ file, formID, content }] (les fichiers illisibles sont ignorés et signalés)
const readAllAnswers = () => {
  const formsById = loadFormsById();
  const all = [];
  listFormIDs().forEach((formID) => {
    try {
      all.push({ file: `${formID}.json`, formID, content: readAnswers(formID, formsById) });
    } catch (err) {
      console.error(`Erreur de lecture du fichier de réponses ${formID}.json:`, err);
    }
  });
  return all;
};

// Recherche une réponse par son identifiant dans tous les questionnaires
const findResponse = (id) => {
  for (const { formID, content } of readAllAnswers()) {
    const index = content.findIndex((response) => response.id === id);
    if (index !== -1) return { formID, answers: content, index };
  }
  return null;
};

module.exports = {
  isValidFormID,
  readAnswers,
  writeAnswers,
  readAllAnswers,
  findResponse,
  listFormIDs,
  loadFormsById,
};
