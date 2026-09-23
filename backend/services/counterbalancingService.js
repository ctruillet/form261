/**
 * Service de génération des conditions expérimentales et de contrebalancement
 * (Carré Latin de Williams, Carré Latin standard, Plan par Macro-Blocs / Split-Plot).
 */

// Générer le produit cartésien de tous les facteurs
function generateCartesianConditions(factors) {
  if (!factors || factors.length === 0) return [];

  // Filtrer les facteurs qui ont au moins une valeur
  const validFactors = factors.filter(f => f.name && Array.isArray(f.values) && f.values.length > 0);
  if (validFactors.length === 0) return [];

  return validFactors.reduce((acc, factor) => {
    const nextAcc = [];
    factor.values.forEach(val => {
      if (acc.length === 0) {
        nextAcc.push({ [factor.name]: val });
      } else {
        acc.forEach(combo => {
          nextAcc.push({ ...combo, [factor.name]: val });
        });
      }
    });
    return nextAcc;
  }, []);
}

// Helper pour nommer les blocs : 0 -> "A", 1 -> "B", ..., 25 -> "Z", 26 -> "AA"
function getBlockName(index) {
  let name = '';
  let i = index;
  while (i >= 0) {
    name = String.fromCharCode(65 + (i % 26)) + name;
    i = Math.floor(i / 26) - 1;
  }
  return name;
}

/**
 * Génération du Carré Latin équilibré de Williams
 * Pour K pair : 1 carré de K lignes
 * Pour K impair : 2 carrés (2K lignes) pour équilibrer les effets de report
 */
function generateWilliamsLatinSquare(conditions) {
  const K = conditions.length;
  if (K === 0) return {};
  if (K === 1) return { A: [conditions[0]] };

  // Construire la première ligne selon la formule de Williams (0-indexé)
  // [0, 1, K-1, 2, K-2, 3, K-3, ...]
  const firstRow = [];
  let left = 0;
  let right = K - 1;
  for (let j = 0; j < K; j++) {
    if (j % 2 === 0) {
      firstRow.push(left);
      left++;
    } else {
      firstRow.push(right);
      right--;
    }
  }

  // Générer le premier carré (K lignes) par décalage modulaire
  const rows = [];
  for (let i = 0; i < K; i++) {
    const row = firstRow.map(idx => (idx + i) % K);
    rows.push(row);
  }

  // Si K est impair, ajouter le carré miroir (inversé)
  if (K % 2 !== 0) {
    for (let i = 0; i < K; i++) {
      const mirrorRow = [...rows[i]].reverse();
      rows.push(mirrorRow);
    }
  }

  // Mapper sur les conditions réelles et structurer en objet de Blocs { "A": [...], "B": [...] }
  const blocks = {};
  rows.forEach((rowIndices, rIdx) => {
    const blockLetter = getBlockName(rIdx);
    blocks[blockLetter] = rowIndices.map((cIdx, trialIndex) => ({
      trialOrder: trialIndex + 1,
      ...conditions[cIdx]
    }));
  });

  return blocks;
}

/**
 * Génération du Carré Latin Cyclique / Standard
 */
function generateCyclicLatinSquare(conditions) {
  const K = conditions.length;
  if (K === 0) return {};
  if (K === 1) return { A: [conditions[0]] };

  const blocks = {};
  for (let i = 0; i < K; i++) {
    const blockLetter = getBlockName(i);
    blocks[blockLetter] = [];
    for (let j = 0; j < K; j++) {
      const cIdx = (i + j) % K;
      blocks[blockLetter].push({
        trialOrder: j + 1,
        ...conditions[cIdx]
      });
    }
  }
  return blocks;
}

/**
 * Génération d'un plan par Macro-Blocs (Blocked / Split-Plot Design)
 * Le facteur principal (ex: Technique) est bloqué (les essais d'une même modalité sont consécutifs).
 * Pour chaque technique, toutes les sous-conditions (ex: Tâche T1, T2) sont exécutées consécutivement.
 * L'ordre des sous-conditions est inversé / contrebalancé (ex: blocs A1, A2, B1, B2...).
 */
function generateBlockedLatinSquare({ factors, blockedFactorName, method = 'williams' }) {
  if (!factors || factors.length === 0) return {};

  const blockedFactor = factors.find(f => f.name === blockedFactorName) || factors[0];
  const subFactors = factors.filter(f => f.name !== blockedFactor.name);

  // 1. Modalités du facteur bloqué
  const macroConditions = (blockedFactor.values || []).map(val => ({ [blockedFactor.name]: val }));
  if (macroConditions.length === 0) return {};

  // 2. Combinaisons des sous-facteurs
  const subConditions = generateCartesianConditions(subFactors);
  const hasSubConditions = subConditions.length > 0;

  // Si aucun sous-facteur, c'est simplement le carré latin du facteur principal
  if (!hasSubConditions) {
    return method === 'cyclic'
      ? generateCyclicLatinSquare(macroConditions)
      : generateWilliamsLatinSquare(macroConditions);
  }

  // 3. Générer le carré latin des macro-blocs
  const K = macroConditions.length;
  let macroRows = [];

  if (method === 'cyclic') {
    for (let i = 0; i < K; i++) {
      const row = [];
      for (let j = 0; j < K; j++) row.push((i + j) % K);
      macroRows.push(row);
    }
  } else {
    // Williams
    const firstRow = [];
    let left = 0;
    let right = K - 1;
    for (let j = 0; j < K; j++) {
      if (j % 2 === 0) {
        firstRow.push(left++);
      } else {
        firstRow.push(right--);
      }
    }
    for (let i = 0; i < K; i++) {
      macroRows.push(firstRow.map(idx => (idx + i) % K));
    }
    if (K % 2 !== 0) {
      for (let i = 0; i < K; i++) {
        macroRows.push([...macroRows[i]].reverse());
      }
    }
  }

  // 4. Générer les ordres des sous-conditions (permutations / inversions)
  const S = subConditions.length;
  const subOrders = [];
  for (let s = 0; s < S; s++) {
    const order = [];
    for (let j = 0; j < S; j++) {
      order.push((s + j) % S);
    }
    subOrders.push(order);
  }

  // 5. Générer les blocs dédoublés (A1, A2, B1, B2, C1, C2, D1, D2...)
  const blocks = {};

  macroRows.forEach((macroRowIndices, rIdx) => {
    const baseLetter = getBlockName(rIdx);

    // Pour chaque permutation de sous-ordre (v = 0 ... S-1)
    for (let v = 0; v < S; v++) {
      const blockName = S > 1 ? `${baseLetter}${v + 1}` : baseLetter;
      const trialList = [];
      let globalTrialIndex = 1;

      macroRowIndices.forEach((macroIdx, mStep) => {
        const currentMacro = macroConditions[macroIdx];
        // Alterner l'ordre des sous-conditions au fil des macro-blocs
        // pour équilibrer l'ordre intra-sujet (design ABBA)
        const subOrderIdx = (v + mStep) % S;
        const currentSubOrder = subOrders[subOrderIdx];

        currentSubOrder.forEach((subIdx, subStep) => {
          const currentSub = subConditions[subIdx];
          trialList.push({
            trialOrder: globalTrialIndex++,
            macroBlock: mStep + 1,
            subTrial: subStep + 1,
            ...currentMacro,
            ...currentSub
          });
        });
      });

      blocks[blockName] = trialList;
    }
  });

  return blocks;
}

/**
 * Générateur principal de protocole
 */
function buildProtocol({ factors, method = 'williams', blockedFactorName = null }) {
  const conditions = generateCartesianConditions(factors);
  let blocks = {};

  if (method === 'blocked') {
    const activeBlockedFactor = (blockedFactorName && factors.some(f => f.name === blockedFactorName))
      ? blockedFactorName
      : factors[0]?.name;

    blocks = generateBlockedLatinSquare({
      factors,
      blockedFactorName: activeBlockedFactor,
      method: 'williams'
    });
  } else if (method === 'cyclic') {
    blocks = generateCyclicLatinSquare(conditions);
  } else {
    // Par défaut : Williams
    blocks = generateWilliamsLatinSquare(conditions);
  }

  return {
    factors: factors || [],
    conditionsCount: conditions.length,
    conditions,
    counterbalancingMethod: method,
    blockedFactorName: method === 'blocked' ? (blockedFactorName || factors[0]?.name) : null,
    blocksCount: Object.keys(blocks).length,
    blocks
  };
}

module.exports = {
  generateCartesianConditions,
  generateWilliamsLatinSquare,
  generateCyclicLatinSquare,
  generateBlockedLatinSquare,
  buildProtocol,
  getBlockName
};
