const fs = require('fs');
const path = require('path');

const participantsFilePath = path.join(__dirname, '../participants.json');
const answersFolderPath = path.join(__dirname, '../answers/');

const ensureParticipantsFileExists = () => {
  if (!fs.existsSync(participantsFilePath)) {
    fs.writeFileSync(participantsFilePath, JSON.stringify([], null, 2), 'utf8');
  }
};

const getAnswersFiles = () => {
  if (!fs.existsSync(answersFolderPath)) return [];
  try {
    const files = fs.readdirSync(answersFolderPath);
    return (files || []).filter((f) => path.extname(f) === '.json');
  } catch (e) {
    return [];
  }
};

// Récupérer tous les participants avec leurs statistiques de complétion
exports.getParticipants = (req, res) => {
  ensureParticipantsFileExists();

  try {
    const rawData = fs.readFileSync(participantsFilePath, 'utf8');
    const participants = JSON.parse(rawData || '[]');

    // Charger les réponses pour compter les formulaires complétés
    const answerFiles = getAnswersFiles();
    const statsMap = {};

    answerFiles.forEach((file) => {
      try {
        const fileContent = JSON.parse(fs.readFileSync(path.join(answersFolderPath, file), 'utf8') || '[]');
        if (Array.isArray(fileContent)) {
          fileContent.forEach((resp) => {
            const uid = resp.parametersFields?.UserID;
            if (!uid) return;
            const uidStr = String(uid);
            if (!statsMap[uidStr]) {
              statsMap[uidStr] = { formCount: 0, forms: new Set(), blocks: new Set(), techniques: new Set() };
            }
            statsMap[uidStr].formCount += 1;
            if (resp.name) statsMap[uidStr].forms.add(resp.name);
            if (resp.parametersFields?.Block) statsMap[uidStr].blocks.add(resp.parametersFields.Block);
            if (resp.parametersFields?.Technique) statsMap[uidStr].techniques.add(resp.parametersFields.Technique);
          });
        }
      } catch (e) {
        // Ignorer les erreurs ponctuelles de lecture de fichier
      }
    });

    const enriched = participants.map((p) => {
      const uidStr = String(p.UserID || p.id);
      const stats = statsMap[uidStr] || { formCount: 0, forms: new Set(), blocks: new Set(), techniques: new Set() };
      return {
        ...p,
        id: uidStr,
        UserID: uidStr,
        formCount: stats.formCount,
        forms: Array.from(stats.forms),
        blocks: Array.from(stats.blocks),
        techniques: Array.from(stats.techniques),
      };
    });

    // Trier naturellement par UserID (1, 2, ... 10)
    enriched.sort((a, b) => {
      const numA = parseInt(a.UserID, 10);
      const numB = parseInt(b.UserID, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a.UserID).localeCompare(String(b.UserID));
    });

    res.json(enriched);
  } catch (err) {
    console.error('Erreur getParticipants:', err);
    res.status(500).json({ message: 'Erreur lors de la lecture des participants' });
  }
};

// Créer un nouveau participant
exports.createParticipant = (req, res) => {
  ensureParticipantsFileExists();

  const data = req.body || {};
  const userId = String(data.UserID || data.id || '').trim();

  if (!userId) {
    return res.status(400).json({ message: 'Identifiant UserID requis' });
  }

  try {
    const rawData = fs.readFileSync(participantsFilePath, 'utf8');
    const participants = JSON.parse(rawData || '[]');

    const exists = participants.some((p) => String(p.UserID || p.id) === userId);
    if (exists) {
      return res.status(409).json({ message: `Le participant #${userId} existe déjà` });
    }

    const protocolFilePath = path.join(__dirname, '../protocol.json');
    let defaultBlock = data.Block;
    if (!defaultBlock) {
      try {
        if (fs.existsSync(protocolFilePath)) {
          const protocol = JSON.parse(fs.readFileSync(protocolFilePath, 'utf8') || '{}');
          const blockKeys = Object.keys(protocol.blocks || {});
          if (blockKeys.length > 0) {
            const counts = {};
            blockKeys.forEach(k => { counts[k] = 0; });
            participants.forEach(p => {
              if (p.Block && counts[p.Block] !== undefined) counts[p.Block]++;
            });
            let minCount = Infinity;
            blockKeys.forEach(k => {
              if (counts[k] < minCount) {
                minCount = counts[k];
                defaultBlock = k;
              }
            });
          }
        }
      } catch (e) {
        defaultBlock = 'A';
      }
    }

    const newParticipant = {
      id: userId,
      UserID: userId,
      currentTrialIndex: 1,
      ...data,
      Block: defaultBlock || 'A',
    };

    participants.push(newParticipant);
    fs.writeFileSync(participantsFilePath, JSON.stringify(participants, null, 2), 'utf8');

    res.status(201).json(newParticipant);
  } catch (err) {
    console.error('Erreur createParticipant:', err);
    res.status(500).json({ message: "Erreur lors de la création du participant" });
  }
};

// Modifier un participant existant
exports.updateParticipant = (req, res) => {
  ensureParticipantsFileExists();

  const targetId = String(req.params.id).trim();
  const updatedData = req.body || {};
  const newUserId = String(updatedData.UserID || targetId).trim();

  try {
    const rawData = fs.readFileSync(participantsFilePath, 'utf8');
    let participants = JSON.parse(rawData || '[]');

    const index = participants.findIndex((p) => String(p.UserID || p.id) === targetId);
    if (index === -1) {
      return res.status(404).json({ message: `Participant #${targetId} introuvable` });
    }

    const oldParticipant = participants[index];
    const oldUserId = String(oldParticipant.UserID || oldParticipant.id);

    participants[index] = {
      ...oldParticipant,
      ...updatedData,
      id: newUserId,
      UserID: newUserId,
    };

    fs.writeFileSync(participantsFilePath, JSON.stringify(participants, null, 2), 'utf8');

    // Si le UserID a changé ou si le Block a changé, répercuter en cascade sur les réponses
    const hasIdChanged = oldUserId !== newUserId;
    const hasBlockChanged = updatedData.Block && updatedData.Block !== oldParticipant.Block;

    if (hasIdChanged || hasBlockChanged) {
      const answerFiles = getAnswersFiles();
      answerFiles.forEach((file) => {
        const filePath = path.join(answersFolderPath, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
          let modified = false;

          content.forEach((resp) => {
            if (resp.parametersFields && String(resp.parametersFields.UserID) === oldUserId) {
              if (hasIdChanged) resp.parametersFields.UserID = newUserId;
              if (hasBlockChanged) resp.parametersFields.Block = updatedData.Block;
              modified = true;
            }
          });

          if (modified) {
            fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
          }
        } catch (e) {
          console.error(`Erreur mise à jour cascade réponses ${file}:`, e);
        }
      });
    }

    res.json(participants[index]);
  } catch (err) {
    console.error('Erreur updateParticipant:', err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du participant" });
  }
};

// Supprimer un participant
exports.deleteParticipant = (req, res) => {
  ensureParticipantsFileExists();

  const targetId = String(req.params.id).trim();

  try {
    const rawData = fs.readFileSync(participantsFilePath, 'utf8');
    let participants = JSON.parse(rawData || '[]');

    const initialLength = participants.length;
    participants = participants.filter((p) => String(p.UserID || p.id) !== targetId);

    if (participants.length === initialLength) {
      return res.status(404).json({ message: `Participant #${targetId} introuvable` });
    }

    fs.writeFileSync(participantsFilePath, JSON.stringify(participants, null, 2), 'utf8');

    // Supprimer également les réponses associées à ce participant dans answers/
    const answerFiles = getAnswersFiles();
    answerFiles.forEach((file) => {
      const filePath = path.join(answersFolderPath, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
        const filtered = content.filter((resp) => !resp.parametersFields || String(resp.parametersFields.UserID) !== targetId);
        if (filtered.length !== content.length) {
          fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf8');
        }
      } catch (e) {
        console.error(`Erreur suppression cascade réponses ${file}:`, e);
      }
    });

    res.json({ message: `Participant #${targetId} supprimé avec succès` });
  } catch (err) {
    console.error('Erreur deleteParticipant:', err);
    res.status(500).json({ message: "Erreur lors de la suppression du participant" });
  }
};
