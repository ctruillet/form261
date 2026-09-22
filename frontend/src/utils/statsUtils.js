// statsUtils.js
// Fonctions statistiques pour le calcul des tests de significativité (t-test de Welch, ANOVA à 1 facteur)

// Approximation de Lanczos pour la fonction log-gamma ln(Gamma(z))
function logGamma(z) {
  const c = [
    57.156235665863, -59.597960354276,
    14.136097974742, -0.491913816098,
    0.3399464998e-4, 0.4652362893e-4,
    -0.983744753e-4, 0.1580887032e-3,
    -0.2102644417e-3, 0.2174396181e-3,
    -0.1643181065e-3, 0.8441822398e-4,
    -0.261908384e-4, 0.3689918266e-5,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  const w = z - 1;
  const base = w + 5.242187565691;
  let sum = 1.0;
  for (let i = 0; i < c.length; i++) {
    sum += c[i] / (w + i + 1);
  }
  return 0.5 * Math.log(2 * Math.PI) + (w + 0.5) * Math.log(base) - base + Math.log(sum);
}

// Fonction Beta Incomplète Régularisée Ix(a, b) par fraction continue de Lentz
function betaInc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  if (x > (a + 1) / (a + b + 2)) {
    return 1 - betaInc(1 - x, b, a);
  }

  const factor = Math.exp(
    a * Math.log(x) + b * Math.log(1 - x) - logGamma(a) - logGamma(b) + logGamma(a + b)
  ) / a;

  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= 200; m++) {
    // Étape 2m
    let num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    // Étape 2m + 1
    num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < 1e-12) break;
  }

  return factor * h;
}

// Calcul de la p-value de l'ANOVA (distribution F de Fisher-Snedecor)
export function pValueANOVA(f, df1, df2) {
  if (f <= 0 || isNaN(f)) return 1;
  const x = df2 / (df2 + df1 * f);
  return betaInc(x, df2 / 2, df1 / 2);
}

// Calcul de la p-value bilatérale du t-test de Student / Welch
export function pValueTTest(t, df) {
  if (isNaN(t) || df <= 0) return 1;
  const t2 = t * t;
  const x = df / (df + t2);
  return Math.min(1, Math.max(0, betaInc(x, df / 2, 0.5)));
}

// Notation des étoiles de significativité standard en recherche
export function getSignificanceStars(p) {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  return 'ns';
}

// Formatage lisible de la p-value
export function formatPValue(p) {
  if (p < 0.001) return '< 0.001';
  return p.toFixed(3);
}

// Calcul des statistiques descriptives d'un échantillon
export function getDescriptives(values) {
  const valid = (values || []).filter((v) => typeof v === 'number' && !isNaN(v));
  const n = valid.length;
  if (n === 0) return { n: 0, mean: 0, variance: 0, stdDev: 0, min: 0, max: 0 };

  const sum = valid.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const sumSq = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const variance = n > 1 ? sumSq / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  return {
    n,
    mean: Number(mean.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}

// Test t de Welch pour 2 groupes
export function welchTTest(group1, group2) {
  const d1 = getDescriptives(group1.values);
  const d2 = getDescriptives(group2.values);

  if (d1.n < 2 || d2.n < 2) return null;

  const meanDiff = d1.mean - d2.mean;
  const se1 = d1.variance / d1.n;
  const se2 = d2.variance / d2.n;
  const seDiff = Math.sqrt(se1 + se2);

  if (seDiff === 0) {
    return {
      t: 0,
      df: d1.n + d2.n - 2,
      pValue: 1,
      isSignificant: false,
      stars: 'ns',
      pFormatted: '1.000',
      meanDiff: 0,
      d1,
      d2,
    };
  }

  const t = Math.abs(meanDiff) / seDiff;
  const df = Math.pow(se1 + se2, 2) / (Math.pow(se1, 2) / (d1.n - 1) + Math.pow(se2, 2) / (d2.n - 1));
  const p = pValueTTest(t, df);

  return {
    t: Number(t.toFixed(2)),
    df: Number(df.toFixed(1)),
    pValue: p,
    pFormatted: formatPValue(p),
    isSignificant: p < 0.05,
    stars: getSignificanceStars(p),
    meanDiff: Number(meanDiff.toFixed(2)),
    d1,
    d2,
  };
}

// ANOVA à 1 facteur pour k >= 2 groupes
export function oneWayANOVA(groups) {
  const validGroups = (groups || []).filter((g) => g && g.values && g.values.length > 0);
  const k = validGroups.length;

  if (k < 2) return null;

  let totalN = 0;
  let grandSum = 0;
  validGroups.forEach((g) => {
    totalN += g.values.length;
    grandSum += g.values.reduce((a, b) => a + b, 0);
  });

  if (totalN <= k) return null;
  const grandMean = grandSum / totalN;

  let ssBetween = 0;
  let ssWithin = 0;

  validGroups.forEach((g) => {
    const n_i = g.values.length;
    const mean_i = g.values.reduce((a, b) => a + b, 0) / n_i;
    ssBetween += n_i * Math.pow(mean_i - grandMean, 2);
    g.values.forEach((v) => {
      ssWithin += Math.pow(v - mean_i, 2);
    });
  });

  const df1 = k - 1;
  const df2 = totalN - k;
  const msBetween = ssBetween / df1;
  const msWithin = df2 > 0 ? ssWithin / df2 : 0;

  const f = msWithin > 0 ? msBetween / msWithin : 0;
  const p = pValueANOVA(f, df1, df2);

  // Comparaisons post-hoc deux-à-deux (avec correction de Bonferroni)
  const numComparisons = (k * (k - 1)) / 2;
  const pairwise = [];

  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const gA = validGroups[i];
      const gB = validGroups[j];
      const tRes = welchTTest(gA, gB);
      if (tRes) {
        const meanA = tRes.d1?.mean ?? 0;
        const meanB = tRes.d2?.mean ?? 0;
        const diff = Number((meanA - meanB).toFixed(2));
        const pAdj = Math.min(1, tRes.pValue * numComparisons);
        const starsAdj = getSignificanceStars(pAdj);
        pairwise.push({
          groupA: gA.name,
          groupB: gB.name,
          meanA,
          meanB,
          diff,
          diffFormatted: diff > 0 ? `+${diff}` : `${diff}`,
          pRaw: tRes.pValue,
          pAdj,
          pFormatted: formatPValue(pAdj),
          stars: starsAdj,
          isSignificant: pAdj < 0.05,
        });
      }
    }
  }

  const significantPairs = pairwise.filter((p) => p.isSignificant);

  return {
    k,
    f: Number(f.toFixed(2)),
    df1,
    df2,
    pValue: p,
    pFormatted: formatPValue(p),
    stars: getSignificanceStars(p),
    isSignificant: p < 0.05,
    pairwise,
    significantPairs,
  };
}

// Fonction d'analyse globale pour un facteur donné
export function analyzeFactorSignificance(groups) {
  if (!groups || groups.length < 2) {
    return {
      hasTest: false,
      message: 'Données insuffisantes (au moins 2 conditions requises)',
    };
  }

  if (groups.length === 2) {
    const tRes = welchTTest(groups[0], groups[1]);
    if (!tRes) return { hasTest: false, message: 'Échantillon trop faible' };

    const m1 = tRes.d1?.mean ?? 0;
    const m2 = tRes.d2?.mean ?? 0;

    return {
      hasTest: true,
      testType: 't-test',
      testName: 'Test t de Welch',
      statistic: `t(${tRes.df}) = ${tRes.t}`,
      pValue: tRes.pValue,
      pFormatted: tRes.pFormatted,
      stars: tRes.stars,
      isSignificant: tRes.isSignificant,
      details: `${groups[0].name} (M=${m1}) vs ${groups[1].name} (M=${m2}) : diff = ${tRes.meanDiff > 0 ? '+' : ''}${tRes.meanDiff}`,
      significantPairs: tRes.isSignificant
        ? [
            {
              groupA: groups[0].name,
              groupB: groups[1].name,
              pFormatted: tRes.pFormatted,
              stars: tRes.stars,
              diff: tRes.meanDiff,
            },
          ]
        : [],
    };
  }

  // Si 3 groupes ou plus : ANOVA
  const anovaRes = oneWayANOVA(groups);
  if (!anovaRes) return { hasTest: false, message: 'Données insuffisantes' };

  return {
    hasTest: true,
    testType: 'anova',
    testName: 'ANOVA à 1 facteur',
    statistic: `F(${anovaRes.df1}, ${anovaRes.df2}) = ${anovaRes.f}`,
    pValue: anovaRes.pValue,
    pFormatted: anovaRes.pFormatted,
    stars: anovaRes.stars,
    isSignificant: anovaRes.isSignificant,
    significantPairs: anovaRes.significantPairs,
    pairwise: anovaRes.pairwise,
  };
}
