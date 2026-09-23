const fs = require('fs');
const path = require('path');
const { buildProtocol } = require('../services/counterbalancingService');

const protocolFilePath = path.join(__dirname, '../protocol.json');
const participantsFilePath = path.join(__dirname, '../participants.json');
const parametersFolderPath = path.join(__dirname, '../parameters');

const syncParameterFiles = (protocol) => {
  if (!protocol || !protocol.factors || !protocol.blocks) return;
  try {
    const factors = protocol.factors;
    const blockNames = Object.keys(protocol.blocks);
    const blockedFactorName = protocol.blockedFactorName;
    const blockedFactor = factors.find(f => f.name === blockedFactorName) || factors[0];

    // 1. Active_Protocol.json (Trial parameters: UserID + TrialOrder + All factors + Block)
    const paramFields = [
      {
        label: 'UserID',
        sublabel: 'UserID unique du participant',
        type: 'text',
        placeholder: 'UserID',
        required: true,
        category: 'parameter'
      },
      {
        label: 'TrialOrder',
        sublabel: "Numéro d'ordre de l'essai",
        type: 'text',
        placeholder: 'TrialOrder',
        required: false,
        category: 'parameter'
      },
      ...factors.map(f => ({
        label: f.name,
        sublabel: `Facteur : ${f.name}`,
        type: 'drop-down',
        placeholder: f.name,
        options: f.values,
        required: true,
        category: 'parameter'
      })),
      {
        label: 'Block',
        sublabel: 'Bloc de contrebalancement',
        type: 'drop-down',
        placeholder: 'Block',
        options: blockNames,
        required: true,
        category: 'parameter'
      }
    ];

    const activeParamConfig = {
      title: "Paramètres d'Essai (Protocole Actif)",
      name: 'Active_Protocol',
      description: `Essais : UserID, TrialOrder, ${factors.map(f => f.name).join(', ')}, Block`,
      fields: paramFields
    };

    fs.writeFileSync(
      path.join(parametersFolderPath, 'Active_Protocol.json'),
      JSON.stringify(activeParamConfig, null, 2),
      'utf8'
    );

    // 2. UserID_TI_Block.json (UserID + Blocked Factor + Block)
    if (blockedFactor) {
      const modalityParamConfig = {
        title: `Paramètres de Modalité (${blockedFactor.name})`,
        name: 'UserID TI Block',
        description: `Modalité : UserID, ${blockedFactor.name} et Block`,
        fields: [
          {
            label: 'UserID',
            sublabel: 'UserID unique',
            type: 'text',
            placeholder: 'UserID',
            required: true,
            category: 'parameter'
          },
          {
            label: blockedFactor.name,
            sublabel: `Modalité : ${blockedFactor.name}`,
            type: 'drop-down',
            placeholder: blockedFactor.name,
            options: blockedFactor.values,
            required: true,
            category: 'parameter'
          },
          {
            label: 'Block',
            sublabel: "Bloc de l'expérience",
            type: 'drop-down',
            placeholder: 'Block',
            options: blockNames,
            required: true,
            category: 'parameter'
          }
        ]
      };

      fs.writeFileSync(
        path.join(parametersFolderPath, 'UserID_TI_Block.json'),
        JSON.stringify(modalityParamConfig, null, 2),
        'utf8'
      );
    }

    // 3. UserID_Block.json (UserID + Block)
    const generalParamConfig = {
      title: 'Paramètres de Session',
      name: 'UserID Block',
      description: 'Session : UserID et Block',
      fields: [
        {
          label: 'UserID',
          sublabel: 'UserID unique',
          type: 'text',
          placeholder: 'UserID',
          required: true,
          category: 'parameter'
        },
        {
          label: 'Block',
          sublabel: "Bloc de l'expérience",
          type: 'drop-down',
          placeholder: 'Block',
          options: blockNames,
          required: true,
          category: 'parameter'
        }
      ]
    };

    fs.writeFileSync(
      path.join(parametersFolderPath, 'UserID_Block.json'),
      JSON.stringify(generalParamConfig, null, 2),
      'utf8'
    );
  } catch (paramSyncErr) {
    console.error('Erreur synchronisation paramètre:', paramSyncErr);
  }
};

const ensureProtocolFileExists = () => {
  if (!fs.existsSync(protocolFilePath)) {
    const defaultProtocol = buildProtocol({
      factors: [
        {
          name: 'Technique',
          type: 'within',
          values: ['vMirrorAR', 'BalloonProbeAR', 'ConeProbeAR', 'ARPortal']
        },
        {
          name: 'Tache',
          type: 'within',
          values: ['T1', 'T2']
        }
      ],
      method: 'blocked',
      blockedFactorName: 'Technique'
    });
    defaultProtocol.name = 'Protocole Expérimental';
    fs.writeFileSync(protocolFilePath, JSON.stringify(defaultProtocol, null, 2), 'utf8');
    syncParameterFiles(defaultProtocol);
    return defaultProtocol;
  }
  try {
    const data = fs.readFileSync(protocolFilePath, 'utf8');
    const parsed = JSON.parse(data || '{}');
    syncParameterFiles(parsed);
    return parsed;
  } catch (e) {
    console.error('Erreur lecture protocol.json:', e);
    return null;
  }
};

// Récupérer la configuration du protocole actif
exports.getProtocol = (req, res) => {
  try {
    const protocol = ensureProtocolFileExists();
    res.json(protocol);
  } catch (error) {
    console.error('Erreur getProtocol:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du protocole' });
  }
};

// Mettre à jour les facteurs et recalculer les blocs
exports.updateProtocol = (req, res) => {
  try {
    const { name, factors, counterbalancingMethod, blockedFactorName } = req.body;

    if (!factors || !Array.isArray(factors) || factors.length === 0) {
      return res.status(400).json({ message: 'Au moins un facteur expérimental est requis' });
    }

    const newProtocol = buildProtocol({
      factors,
      method: counterbalancingMethod || 'blocked',
      blockedFactorName: blockedFactorName || null
    });
    newProtocol.name = name || 'Protocole Expérimental';

    // Sauvegarder dans protocol.json
    fs.writeFileSync(protocolFilePath, JSON.stringify(newProtocol, null, 2), 'utf8');

    // Mettre à jour en miroir tous les fichiers de paramètres
    syncParameterFiles(newProtocol);

    res.json(newProtocol);
  } catch (error) {
    console.error('Erreur updateProtocol:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du protocole' });
  }
};

// Récupérer les statistiques d'équilibrage des Blocs et le prochain bloc suggéré
exports.getProtocolStats = (req, res) => {
  try {
    const protocol = ensureProtocolFileExists();
    const blocks = protocol.blocks || {};
    const blockKeys = Object.keys(blocks);

    let participants = [];
    if (fs.existsSync(participantsFilePath)) {
      try {
        participants = JSON.parse(fs.readFileSync(participantsFilePath, 'utf8') || '[]');
      } catch (e) {
        participants = [];
      }
    }

    // Compter les participants par bloc
    const counts = {};
    blockKeys.forEach(k => {
      counts[k] = 0;
    });

    participants.forEach(p => {
      const b = p.Block;
      if (b && counts[b] !== undefined) {
        counts[b] += 1;
      }
    });

    // Fusion des groupes de contrebalancement (ex: A1 et A2 -> Groupe A)
    const groupCounts = {};
    blockKeys.forEach(k => {
      const groupRoot = k.replace(/[0-9]+$/, '') || k;
      if (!groupCounts[groupRoot]) {
        groupCounts[groupRoot] = {
          group: groupRoot,
          count: 0,
          blocks: []
        };
      }
      groupCounts[groupRoot].count += (counts[k] || 0);
      groupCounts[groupRoot].blocks.push(k);
    });

    // Trouver le bloc le moins représenté (Load Balancing)
    let minCount = Infinity;
    let suggestedBlock = blockKeys[0] || 'A';

    blockKeys.forEach(k => {
      if (counts[k] < minCount) {
        minCount = counts[k];
        suggestedBlock = k;
      }
    });

    res.json({
      blocks: blockKeys,
      distribution: counts,
      groupDistribution: groupCounts,
      suggestedBlock,
      totalParticipants: participants.length
    });
  } catch (error) {
    console.error('Erreur getProtocolStats:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques de protocole' });
  }
};
