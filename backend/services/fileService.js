const fs = require('fs');
const path = require('path');

/**
 * Lit un fichier JSON. Retourne `fallback` si le fichier n'existe pas ou est vide.
 * Lève une erreur si le contenu est illisible (JSON corrompu), pour ne jamais
 * écraser silencieusement des données existantes.
 */
const readJson = (filePath, fallback) => {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
};

/**
 * Écrit un fichier JSON de façon atomique (fichier temporaire puis renommage),
 * afin qu'une coupure en cours d'écriture ne laisse jamais un fichier tronqué.
 */
const writeJson = (filePath, data, indent = 2) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, indent), 'utf8');
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* rien à nettoyer */ }
    throw err;
  }
};

/** Liste les fichiers .json d'un dossier (tableau vide si le dossier n'existe pas). */
const listJsonFiles = (dirPath) => {
  try {
    return fs.readdirSync(dirPath).filter((f) => path.extname(f) === '.json');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

/**
 * Transforme un nom fourni par le client en nom de fichier .json sûr
 * (sans composante de chemin). Retourne null si le nom est invalide.
 */
const safeJsonFileName = (name) => {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  const base = path.basename(raw.replace(/\\/g, '/'));
  if (!base || base === '.' || base === '..' || base !== raw) return null;
  return base.toLowerCase().endsWith('.json') ? base : `${base}.json`;
};

module.exports = { readJson, writeJson, listJsonFiles, safeJsonFileName };
