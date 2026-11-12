const path = require('path');
const { readJson, writeJson } = require('./fileService');
const { buildProtocol } = require('./counterbalancingService');

// protocol.json ne contient que la DÉFINITION du protocole (nom, facteurs, méthode).
// Les conditions, les blocs de contrebalancement et les paramètres des questionnaires
// en sont déduits à chaque lecture : rien de recalculable n'est stocké.
const protocolFilePath = path.join(__dirname, '../protocol.json');

const DEFAULT_DEFINITION = {
  name: 'Protocole Expérimental',
  counterbalancingMethod: 'blocked',
  blockedFactorName: 'Technique',
  factors: [
    { name: 'Technique', values: ['vMirrorAR', 'BalloonProbeAR', 'ConeProbeAR', 'ARPortal'] },
    { name: 'Tache', values: ['T1', 'T2'] },
  ],
};

// Protocole complet (facteurs + conditions + blocs) à partir de sa définition
const expandProtocol = (definition) => {
  const protocol = buildProtocol({
    factors: definition.factors || [],
    method: definition.counterbalancingMethod || 'blocked',
    blockedFactorName: definition.blockedFactorName || null,
  });
  return { name: definition.name || 'Protocole Expérimental', ...protocol };
};

const saveProtocolDefinition = ({ name, factors, counterbalancingMethod, blockedFactorName }) => {
  const protocol = expandProtocol({ name, factors, counterbalancingMethod, blockedFactorName });
  writeJson(protocolFilePath, {
    name: protocol.name,
    counterbalancingMethod: protocol.counterbalancingMethod,
    blockedFactorName: protocol.blockedFactorName,
    factors: protocol.factors.map(({ name: factorName, values }) => ({ name: factorName, values })),
  });
  return protocol;
};

// Charge le protocole actif (le crée avec des valeurs par défaut au premier lancement)
const loadProtocol = () => {
  const definition = readJson(protocolFilePath, null);
  if (!definition) {
    return saveProtocolDefinition(DEFAULT_DEFINITION);
  }
  return expandProtocol(definition);
};

// Paramètres enregistrés avec chaque réponse, selon le moment de passation du questionnaire.
// Ils se déduisent du protocole ; les noms de « fichiers » sont conservés car les
// questionnaires (forms.json) les référencent.
const buildParameterConfigs = (protocol = loadProtocol()) => {
  const factors = protocol.factors || [];
  const blockNames = Object.keys(protocol.blocks || {});
  const blockedFactor = factors.find((f) => f.name === protocol.blockedFactorName) || factors[0];

  const field = (label, extra = {}) => ({
    label,
    sublabel: '',
    type: 'text',
    placeholder: label,
    required: true,
    category: 'parameter',
    ...extra,
  });
  const userID = field('UserID', { sublabel: 'Identifiant du participant' });
  const block = field('Block', { sublabel: 'Bloc de contrebalancement', type: 'drop-down', options: blockNames });
  const factorField = (f) => field(f.name, { sublabel: `Facteur : ${f.name}`, type: 'drop-down', options: f.values });

  const configs = {
    'UserID_Block.json': {
      title: 'Paramètres de Session',
      name: 'UserID Block',
      description: 'Session : UserID et Block',
      fields: [userID, block],
    },
    'Active_Protocol.json': {
      title: "Paramètres d'Essai",
      name: 'Active_Protocol',
      description: `Essais : UserID, TrialOrder, ${factors.map((f) => f.name).join(', ')}, Block`,
      fields: [
        userID,
        field('TrialOrder', { sublabel: "Numéro d'ordre de l'essai", required: false }),
        ...factors.map(factorField),
        block,
      ],
    },
  };

  if (blockedFactor) {
    configs['UserID_TI_Block.json'] = {
      title: `Paramètres de Modalité (${blockedFactor.name})`,
      name: 'UserID TI Block',
      description: `Modalité : UserID, ${blockedFactor.name} et Block`,
      fields: [userID, factorField(blockedFactor), block],
    };
  }

  return configs;
};

module.exports = { loadProtocol, saveProtocolDefinition, buildParameterConfigs };
