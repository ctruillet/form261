const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const answersDir = '/home/ctruillet/form261/backend/answers';

if (!fs.existsSync(answersDir)) {
  fs.mkdirSync(answersDir, { recursive: true });
}

// 1. DATASET DEMOGRAPHIQUE (FormID 0)
const demoAnswers = [];
const participants = [
  { id: '1', genre: 'Femme', age: '24', job: 'Doctorant' },
  { id: '2', genre: 'Homme', age: '28', job: 'Ingénieur' },
  { id: '3', genre: 'Femme', age: '22', job: 'Etudiant' },
  { id: '4', genre: 'Homme', age: '35', job: 'Enseignant' },
  { id: '5', genre: 'Femme', age: '26', job: 'Doctorant' },
  { id: '6', genre: 'Homme', age: '29', job: 'Ingénieur' },
  { id: '7', genre: 'Homme', age: '23', job: 'Etudiant' },
  { id: '8', genre: 'Femme', age: '31', job: 'Ingénieur' }
];

participants.forEach(p => {
  demoAnswers.push({
    id: uuidv4(),
    formID: 0,
    name: 'Questionnaire démographique',
    fieldsFile: 'Participant.json',
    paramFile: 'UserID_Block.json',
    parametersFields: {
      UserID: p.id,
      Block: 'A'
    },
    fieldsFields: {
      "J'ai bien signé le formulaire de consentement.": 'Oui',
      'Genre': p.genre,
      'Âge': p.age,
      'Profession': p.job
    }
  });
});

fs.writeFileSync(path.join(answersDir, '0.json'), JSON.stringify(demoAnswers, null, 2), 'utf8');
console.log(`0.json généré (${demoAnswers.length} réponses).`);

// 2. DATASET NASA-TLX (FormID 3)
// 8 participants x 2 techniques (vMirrorAR, ConeProbeAR) x 1 block
const ntlxAnswers = [];
const techniques = [
  { name: 'vMirrorAR', mental: 35, phys: 20, temp: 30, perf: 85, effort: 30, frust: 20 },
  { name: 'ConeProbeAR', mental: 65, phys: 50, temp: 60, perf: 60, effort: 70, frust: 55 },
  { name: 'BalloonProbeAR', mental: 45, phys: 35, temp: 40, perf: 75, effort: 45, frust: 35 }
];

// Helper pour petite variation gaussienne
const jitter = (base, range = 10, min = 0, max = 100) => {
  const delta = (Math.random() - 0.5) * 2 * range;
  const val = Math.round(base + delta);
  return Math.max(min, Math.min(max, Math.round(val / 5) * 5)); // multiple de 5 pour NASA-TLX
};

participants.forEach(p => {
  techniques.forEach(t => {
    ntlxAnswers.push({
      id: uuidv4(),
      formID: 3,
      name: 'NASA-TLX',
      fieldsFile: 'NASA-TLX.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.id,
        Technique: t.name,
        Block: 'A'
      },
      fieldsFields: {
        'Demande Mentale': jitter(t.mental, 15),
        'Demande Physique': jitter(t.phys, 15),
        'Demande Temporelle': jitter(t.temp, 15),
        'Performance': jitter(t.perf, 15),
        'Effort': jitter(t.effort, 15),
        'Frustration': jitter(t.frust, 15)
      }
    });
  });
});

fs.writeFileSync(path.join(answersDir, '3.json'), JSON.stringify(ntlxAnswers, null, 2), 'utf8');
console.log(`3.json (NASA-TLX) généré (${ntlxAnswers.length} réponses).`);

// 3. DATASET SUS (FormID 5)
// Échelle de Likert 1 à 5
const susAnswers = [];
const clampLikert = (val) => Math.max(1, Math.min(5, Math.round(val)));

participants.forEach(p => {
  ['vMirrorAR', 'ConeProbeAR'].forEach(tech => {
    const isGood = tech === 'vMirrorAR';
    // Pour SUS : questions impaires = positif, questions paires = négatif
    susAnswers.push({
      id: uuidv4(),
      formID: 5,
      name: 'SUS',
      fieldsFile: 'SUS.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.id,
        Technique: tech,
        Block: 'A'
      },
      fieldsFields: {
        'Question 1': clampLikert(isGood ? 4.3 + (Math.random() - 0.5) : 2.5 + (Math.random() - 0.5)),
        'Question 2': clampLikert(isGood ? 1.8 + (Math.random() - 0.5) : 3.8 + (Math.random() - 0.5)),
        'Question 3': clampLikert(isGood ? 4.5 + (Math.random() - 0.5) : 2.7 + (Math.random() - 0.5)),
        'Question 4': clampLikert(isGood ? 1.5 + (Math.random() - 0.5) : 3.6 + (Math.random() - 0.5)),
        'Question 5': clampLikert(isGood ? 4.2 + (Math.random() - 0.5) : 2.9 + (Math.random() - 0.5)),
        'Question 6': clampLikert(isGood ? 1.9 + (Math.random() - 0.5) : 3.5 + (Math.random() - 0.5)),
        'Question 7': clampLikert(isGood ? 4.4 + (Math.random() - 0.5) : 2.8 + (Math.random() - 0.5)),
        'Question 8': clampLikert(isGood ? 1.6 + (Math.random() - 0.5) : 3.9 + (Math.random() - 0.5)),
        'Question 9': clampLikert(isGood ? 4.3 + (Math.random() - 0.5) : 2.6 + (Math.random() - 0.5)),
        'Question 10': clampLikert(isGood ? 1.7 + (Math.random() - 0.5) : 3.7 + (Math.random() - 0.5))
      }
    });
  });
});

fs.writeFileSync(path.join(answersDir, '5.json'), JSON.stringify(susAnswers, null, 2), 'utf8');
console.log(`5.json (SUS) généré (${susAnswers.length} réponses).`);

// 4. DATASET AGENCY (FormID 2)
// Échelle de Likert 1 à 7
const agencyAnswers = [];
participants.forEach(p => {
  ['vMirrorAR', 'ConeProbeAR'].forEach(tech => {
    const isGood = tech === 'vMirrorAR';
    agencyAnswers.push({
      id: uuidv4(),
      formID: 2,
      name: 'Sense of Agency Scale',
      fieldsFile: 'Agency.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.id,
        Technique: tech,
        Block: 'A'
      },
      fieldsFields: {
        'Item 1 (SoPA)': Math.max(1, Math.min(7, Math.round(isGood ? 6 + (Math.random() - 0.5) * 1.5 : 3.5 + (Math.random() - 0.5) * 2))),
        'Item 3 (SoNA)': Math.max(1, Math.min(7, Math.round(isGood ? 2 + (Math.random() - 0.5) * 1.5 : 4.8 + (Math.random() - 0.5) * 2))),
        'Item 7 (SoNA)': Math.max(1, Math.min(7, Math.round(isGood ? 2.2 + (Math.random() - 0.5) * 1.5 : 5.0 + (Math.random() - 0.5) * 2))),
        'Item 8 (SoPA)': Math.max(1, Math.min(7, Math.round(isGood ? 5.8 + (Math.random() - 0.5) * 1.5 : 3.2 + (Math.random() - 0.5) * 2))),
        'Item 9 (SoPA)': Math.max(1, Math.min(7, Math.round(isGood ? 6.1 + (Math.random() - 0.5) * 1.5 : 3.6 + (Math.random() - 0.5) * 2))),
        'Item 13 (SoPA)': Math.max(1, Math.min(7, Math.round(isGood ? 5.9 + (Math.random() - 0.5) * 1.5 : 3.4 + (Math.random() - 0.5) * 2)))
      }
    });
  });
});

fs.writeFileSync(path.join(answersDir, '2.json'), JSON.stringify(agencyAnswers, null, 2), 'utf8');
console.log(`2.json (Agency) généré (${agencyAnswers.length} réponses).`);

console.log('>>> JEU DE DONNÉES GÉNÉRÉ AVEC SUCCÈS ! <<<');
