const { buildParameterConfigs } = require('../services/protocolService');

// Les paramètres (UserID, Block, facteurs...) sont déduits du protocole actif.

// Liste des jeux de paramètres
exports.getParameters = (req, res) => {
  try {
    const configs = buildParameterConfigs();
    res.json(Object.entries(configs).map(([file, config]) => ({ ...config, file })));
  } catch (err) {
    console.error('Erreur getParameters:', err);
    res.status(500).send('Erreur lors de la lecture des paramètres');
  }
};

// Un jeu de paramètres, par nom (avec ou sans .json)
exports.getParameterByName = (req, res) => {
  try {
    const raw = String(req.params.parameterName || '');
    const name = raw.toLowerCase().endsWith('.json') ? raw : `${raw}.json`;
    const configs = buildParameterConfigs();
    if (!Object.prototype.hasOwnProperty.call(configs, name)) {
      return res.status(404).send('Parameter not found');
    }
    res.json(configs[name]);
  } catch (err) {
    console.error('Erreur getParameterByName:', err);
    res.status(500).send('Erreur lors de la lecture du paramètre');
  }
};
