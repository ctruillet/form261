const path = require('path');
const { readJson, writeJson } = require('../services/fileService');
const { readAllAnswers, writeAnswers } = require('../services/answersService');
const { loadProtocol } = require('../services/protocolService');

const participantsFilePath = path.join(__dirname, '../participants.json');

const idOf = (p) => String(p.UserID || p.id);

const readParticipants = () => {
  const participants = readJson(participantsFilePath, []);
  return Array.isArray(participants) ? participants : [];
};

const writeParticipants = (participants) => writeJson(participantsFilePath, participants);

// Applique `transform` aux réponses d'un sujet dans tous les questionnaires.
// `transform(response)` retourne la réponse modifiée, ou null pour la supprimer.
const updateAnswersOf = (userId, transform) => {
  readAllAnswers().forEach(({ formID, content }) => {
    let changed = false;
    const updated = [];
    content.forEach((resp) => {
      if (String(resp.parametersFields?.UserID) !== userId) {
        updated.push(resp);
        return;
      }
      changed = true;
      const next = transform(resp);
      if (next) updated.push(next);
    });
    if (changed) writeAnswers(formID, updated);
  });
};

// Bloc le moins rempli (équilibrage du contrebalancement)
const pickBalancedBlock = (participants) => {
  const blockKeys = Object.keys(loadProtocol().blocks || {});
  if (blockKeys.length === 0) return 'A';
  const counts = Object.fromEntries(blockKeys.map((k) => [k, 0]));
  participants.forEach((p) => {
    if (p.Block && counts[p.Block] !== undefined) counts[p.Block] += 1;
  });
  return blockKeys.reduce((best, k) => (counts[k] < counts[best] ? k : best), blockKeys[0]);
};

// Liste des participants, avec leur nombre de réponses
exports.getParticipants = (req, res) => {
  try {
    const counts = {};
    readAllAnswers().forEach(({ content }) => {
      content.forEach((resp) => {
        const uid = resp.parametersFields?.UserID;
        if (uid !== undefined && uid !== null && uid !== '') {
          counts[String(uid)] = (counts[String(uid)] || 0) + 1;
        }
      });
    });

    const participants = readParticipants()
      .map((p) => ({ ...p, id: idOf(p), UserID: idOf(p), formCount: counts[idOf(p)] || 0 }))
      .sort((a, b) => a.UserID.localeCompare(b.UserID, undefined, { numeric: true }));

    res.json(participants);
  } catch (err) {
    console.error('Erreur getParticipants:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des participants' });
  }
};

// Créer un participant (bloc équilibré automatiquement s'il n'est pas fourni)
exports.createParticipant = (req, res) => {
  const data = req.body || {};
  const userId = String(data.UserID || data.id || '').trim();
  if (!userId) {
    return res.status(400).json({ message: 'Identifiant UserID requis' });
  }

  try {
    const participants = readParticipants();
    if (participants.some((p) => idOf(p) === userId)) {
      return res.status(409).json({ message: `Le participant #${userId} existe déjà` });
    }

    const newParticipant = {
      currentTrialIndex: 1,
      ...data,
      id: userId,
      UserID: userId,
      Block: data.Block || pickBalancedBlock(participants),
    };

    participants.push(newParticipant);
    writeParticipants(participants);
    res.status(201).json(newParticipant);
  } catch (err) {
    console.error('Erreur createParticipant:', err);
    res.status(500).json({ message: 'Erreur lors de la création du participant' });
  }
};

// Modifier un participant (un changement d'identifiant ou de bloc est répercuté sur ses réponses)
exports.updateParticipant = (req, res) => {
  const targetId = String(req.params.id).trim();
  const updatedData = req.body || {};
  const newUserId = String(updatedData.UserID || targetId).trim();

  try {
    const participants = readParticipants();
    const index = participants.findIndex((p) => idOf(p) === targetId);
    if (index === -1) {
      return res.status(404).json({ message: `Participant #${targetId} introuvable` });
    }

    const previous = participants[index];
    const hasIdChanged = newUserId !== targetId;
    if (hasIdChanged && participants.some((p) => idOf(p) === newUserId)) {
      return res.status(409).json({ message: `Le participant #${newUserId} existe déjà` });
    }

    participants[index] = { ...previous, ...updatedData, id: newUserId, UserID: newUserId };
    writeParticipants(participants);

    const hasBlockChanged = Boolean(updatedData.Block) && updatedData.Block !== previous.Block;
    if (hasIdChanged || hasBlockChanged) {
      updateAnswersOf(targetId, (resp) => ({
        ...resp,
        parametersFields: {
          ...resp.parametersFields,
          UserID: newUserId,
          ...(hasBlockChanged ? { Block: updatedData.Block } : {}),
        },
      }));
    }

    res.json(participants[index]);
  } catch (err) {
    console.error('Erreur updateParticipant:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du participant' });
  }
};

// Supprimer un participant et toutes ses réponses
exports.deleteParticipant = (req, res) => {
  const targetId = String(req.params.id).trim();

  try {
    const participants = readParticipants();
    const remaining = participants.filter((p) => idOf(p) !== targetId);
    if (remaining.length === participants.length) {
      return res.status(404).json({ message: `Participant #${targetId} introuvable` });
    }

    writeParticipants(remaining);
    updateAnswersOf(targetId, () => null);
    res.json({ message: `Participant #${targetId} supprimé avec succès` });
  } catch (err) {
    console.error('Erreur deleteParticipant:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression du participant' });
  }
};
