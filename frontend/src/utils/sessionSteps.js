// sessionSteps.js
// Déroulé d'une session : liste ordonnée des questionnaires qu'un sujet doit remplir,
// avec leur état (fait / à faire). Sert à proposer UNE seule action : la prochaine étape.

const INTERNAL_TRIAL_KEYS = ['trialOrder', 'macroBlock', 'subTrial'];

// Facteurs expérimentaux d'un essai (sans les clés internes)
export const getTrialFactors = (trial) =>
  Object.fromEntries(Object.entries(trial || {}).filter(([k]) => !INTERNAL_TRIAL_KEYS.includes(k)));

/**
 * Regroupe les essais d'un bloc en phases (une phase = une modalité du facteur principal).
 * Retourne [{ index, mainKey, mainValue, trials }].
 */
export const buildPhases = (trials, blockedFactorName) => {
  if (!Array.isArray(trials) || trials.length === 0) return [];

  const factorKeys = Object.keys(getTrialFactors(trials[0]));
  const mainKey = factorKeys.includes(blockedFactorName) ? blockedFactorName : factorKeys[0];
  if (!mainKey) return [];

  const hasMacroBlocks = trials[0].macroBlock !== undefined;
  const phases = [];
  const byId = new Map();

  trials.forEach((trial) => {
    // Avec macro-blocs : une phase par macro-bloc. Sinon : une phase par modalité, dans l'ordre d'apparition.
    const id = hasMacroBlocks ? `m${trial.macroBlock}` : `v${trial[mainKey]}`;
    if (!byId.has(id)) {
      const phase = { index: phases.length + 1, mainKey, mainValue: String(trial[mainKey]), trials: [] };
      byId.set(id, phase);
      phases.push(phase);
    }
    byId.get(id).trials.push(trial);
  });

  return phases;
};

/**
 * Construit la liste ordonnée des étapes de la session d'un sujet.
 *
 * @param {object[]} forms      formulaires (GET /api/forms)
 * @param {object[]} trials     essais du bloc du sujet (protocol.blocks[Block])
 * @param {string}   blockedFactorName facteur bloqué du protocole (peut être absent)
 * @param {object[]} responses  réponses (GET /api/data/responses : [{ file, content }])
 * @param {string}   userId     identifiant du sujet
 * @returns {{ steps: object[], phases: object[] }}
 *   Chaque étape : { key, group, groupLabel, form, params, phase, trial, done, responseId }.
 *   `group` réunit les questionnaires que le participant enchaîne sans intervention.
 */
export const buildSessionSteps = ({ forms, trials, blockedFactorName, responses, userId }) => {
  const allForms = Array.isArray(forms) ? forms : [];
  const phases = buildPhases(trials, blockedFactorName);

  const mine = [];
  (responses || []).forEach((file) => {
    (Array.isArray(file?.content) ? file.content : []).forEach((resp) => {
      if (resp && String(resp.parametersFields?.UserID) === String(userId)) mine.push(resp);
    });
  });

  // Dernière réponse du sujet pour ce formulaire et ces paramètres
  const findResponse = (form, params) => {
    const matches = mine.filter(
      (resp) =>
        resp.fieldsFile === form.fields &&
        Object.entries(params).every(([k, v]) => String(resp.parametersFields?.[k]) === String(v))
    );
    return matches[matches.length - 1] || null;
  };

  const steps = [];
  const addStep = (group, groupLabel, form, params = {}, matchParams = params, extra = {}) => {
    const response = findResponse(form, matchParams);
    steps.push({
      key: `${group}|${form.fields}`,
      group,
      groupLabel,
      form,
      params,
      phase: null,
      trial: null,
      ...extra,
      done: Boolean(response),
      responseId: response?.id || null,
    });
  };

  const byTiming = (timing) => allForms.filter((f) => f.timing === timing);
  const trialForms = byTiming('trial');
  const modalityForms = byTiming('post-modality');

  // 1. Avant l'expérience
  byTiming('pre').forEach((form) => addStep('pre', "Avant l'expérience", form));

  // 2. Pendant : questionnaires par essai, puis évaluation de chaque modalité
  if (phases.length > 0) {
    phases.forEach((phase) => {
      phase.trials.forEach((trial) => {
        trialForms.forEach((form) =>
          addStep(
            `trial-${trial.trialOrder}`,
            `Après l'essai ${trial.trialOrder}`,
            form,
            { TrialOrder: trial.trialOrder, ...getTrialFactors(trial) },
            { TrialOrder: trial.trialOrder },
            { phase, trial }
          )
        );
      });
      modalityForms.forEach((form) =>
        addStep(
          `phase-${phase.index}`,
          `Après ${phase.mainValue}`,
          form,
          { [phase.mainKey]: phase.mainValue },
          { [phase.mainKey]: phase.mainValue },
          { phase }
        )
      );
    });
  } else {
    // Pas de protocole exploitable : les questionnaires sont simplement proposés une fois
    [...trialForms, ...modalityForms].forEach((form) => addStep('during', "Pendant l'expérience", form));
  }

  // 3. Après l'expérience
  byTiming('post').forEach((form) => addStep('post', "Fin de l'expérience", form));

  return { steps, phases };
};

/** Adresse de la page de saisie pour une étape (ouvre la réponse existante si elle est déjà faite). */
export const buildStepUrl = (step, participantData) => {
  const query = new URLSearchParams();
  query.set('fields', step.form.fields || '');
  query.set('param', step.form.param || '');
  if (step.responseId) query.set('id', step.responseId);
  if (participantData?.UserID) query.set('UserID', participantData.UserID);
  if (participantData?.Block) query.set('Block', participantData.Block);
  Object.entries(step.params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
  });
  return `/form?${query.toString()}`;
};

/** Étape correspondant au questionnaire affiché (même fichier de questions, mêmes paramètres). */
export const findCurrentStep = (steps, fieldsName, values) =>
  (steps || []).find(
    (step) =>
      step.form.fields === fieldsName &&
      Object.entries(step.params || {}).every(([k, v]) => String(values?.[k]) === String(v))
  ) || null;
