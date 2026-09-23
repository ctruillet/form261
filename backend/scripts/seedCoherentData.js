const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const backendDir = path.join(__dirname, '..');
const answersDir = path.join(backendDir, 'answers');
const participantsPath = path.join(backendDir, 'participants.json');

if (!fs.existsSync(answersDir)) {
  fs.mkdirSync(answersDir, { recursive: true });
}

// 1. Définition des participants
const participants = [
  { id: 'P01', UserID: 'P01', Block: 'A1', currentTrialIndex: 7, notes: 'Sujet très attentif, habitué aux jeux vidéo' },
  { id: 'P02', UserID: 'P02', Block: 'A2', currentTrialIndex: 7, notes: 'Pratique occasionnelle de la VR' },
  { id: 'P03', UserID: 'P03', Block: 'B1', currentTrialIndex: 7, notes: 'Première expérience avec guidage 3D' },
  { id: 'P04', UserID: 'P04', Block: 'B2', currentTrialIndex: 7, notes: 'Ingénieur en robotique, bonne dextérité' },
  { id: 'P05', UserID: 'P05', Block: 'C1', currentTrialIndex: 7, notes: 'Léger temps d\'adaptation sur l\'IMU' },
  { id: 'P06', UserID: 'P06', Block: 'C2', currentTrialIndex: 7, notes: 'Excellente compréhension des consignes' }
];

fs.writeFileSync(participantsPath, JSON.stringify(participants, null, 2), 'utf8');
console.log('✓ participants.json mis à jour (6 sujets)');

// Techniques du protocole
const techniques = ['Joystick', 'GoTo', 'IMU'];

// 2. Formulaire 0 : Démographie (Pré-expérience, param: UserID_Block.json)
const demographicsData = [
  {
    UserID: 'P01',
    Block: 'A1',
    consent: 'Oui',
    genre: 'Femme',
    age: '26',
    profession: 'Doctorant'
  },
  {
    UserID: 'P02',
    Block: 'A2',
    consent: 'Oui',
    genre: 'Homme',
    age: '29',
    profession: 'Ingénieur'
  },
  {
    UserID: 'P03',
    Block: 'B1',
    consent: 'Oui',
    genre: 'Femme',
    age: '23',
    profession: 'Etudiant'
  },
  {
    UserID: 'P04',
    Block: 'B2',
    consent: 'Oui',
    genre: 'Homme',
    age: '34',
    profession: 'Enseignant'
  },
  {
    UserID: 'P05',
    Block: 'C1',
    consent: 'Oui',
    genre: 'Femme',
    age: '27',
    profession: 'Ingénieur'
  },
  {
    UserID: 'P06',
    Block: 'C2',
    consent: 'Oui',
    genre: 'Homme',
    age: '31',
    profession: 'Doctorant'
  }
];

const answers0 = demographicsData.map((d) => ({
  id: crypto.randomUUID(),
  name: 'Questionnaire démographique',
  formID: 0,
  fieldsFile: 'Participant.json',
  paramFile: 'UserID_Block.json',
  parametersFields: {
    UserID: d.UserID,
    Block: d.Block
  },
  fieldsFields: {
    "J'ai bien signé le formulaire de consentement.": d.consent,
    Genre: d.genre,
    Âge: d.age,
    Profession: d.profession,
    "Droit à l'oubli": ''
  }
}));

fs.writeFileSync(path.join(answersDir, '0.json'), JSON.stringify(answers0, null, 2), 'utf8');
console.log('✓ answers/0.json généré (Démographie : 6 réponses)');

// Helper de bruit aléatoire
const jitter = (base, range = 5) => {
  const delta = Math.floor(Math.random() * (range * 2 + 1)) - range;
  return Math.max(0, base + delta);
};

// 3. Formulaire 3 : NASA-TLX (Post-modalité, param: UserID_TI_Block.json)
// Évaluation par technique (6 participants * 3 techniques = 18 réponses)
const answers3 = [];
participants.forEach((p) => {
  techniques.forEach((tech) => {
    let mentale, physique, temporelle, performance, effort, frustration;

    if (tech === 'Joystick') {
      // Facile, intuitif, très peu frustrant
      mentale = jitter(25, 5);
      physique = jitter(15, 5);
      temporelle = jitter(20, 5);
      performance = jitter(20, 5); // 0=Bonne, 100=Faible
      effort = jitter(25, 5);
      frustration = jitter(15, 5);
    } else if (tech === 'GoTo') {
      // Moyen, demande de la précision dans les ordres
      mentale = jitter(45, 5);
      physique = jitter(25, 5);
      temporelle = jitter(35, 5);
      performance = jitter(35, 5);
      effort = jitter(45, 5);
      frustration = jitter(30, 5);
    } else {
      // IMU : plus physique, fatigue du bras/poignet, plus exigeant
      mentale = jitter(65, 5);
      physique = jitter(60, 5);
      temporelle = jitter(55, 5);
      performance = jitter(55, 5);
      effort = jitter(70, 5);
      frustration = jitter(55, 5);
    }

    answers3.push({
      id: crypto.randomUUID(),
      name: 'NASA-TLX',
      formID: 3,
      fieldsFile: 'NASA-TLX.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.UserID,
        Technique: tech,
        Block: p.Block
      },
      fieldsFields: {
        'Demande Mentale': Math.min(100, mentale),
        'Demande Physique': Math.min(100, physique),
        'Demande Temporelle': Math.min(100, temporelle),
        Performance: Math.min(100, performance),
        Effort: Math.min(100, effort),
        Frustration: Math.min(100, frustration)
      }
    });
  });
});

fs.writeFileSync(path.join(answersDir, '3.json'), JSON.stringify(answers3, null, 2), 'utf8');
console.log('✓ answers/3.json généré (NASA-TLX : 18 réponses)');

// 4. Formulaire 5 : SUS (Post-modalité, param: UserID_TI_Block.json)
// System Usability Scale (10 questions, Likert 1 à 5)
const answers5 = [];
participants.forEach((p) => {
  techniques.forEach((tech) => {
    let responses = {};
    for (let q = 1; q <= 10; q++) {
      const isPositive = q % 2 === 1; // 1, 3, 5, 7, 9 = questions positives
      let val;
      if (tech === 'Joystick') {
        val = isPositive ? (Math.random() > 0.3 ? 5 : 4) : (Math.random() > 0.3 ? 1 : 2);
      } else if (tech === 'GoTo') {
        val = isPositive ? (Math.random() > 0.5 ? 4 : 3) : (Math.random() > 0.5 ? 2 : 3);
      } else {
        val = isPositive ? (Math.random() > 0.4 ? 3 : 2) : (Math.random() > 0.4 ? 4 : 3);
      }
      responses[`Question ${q}`] = val;
    }

    answers5.push({
      id: crypto.randomUUID(),
      name: 'SUS',
      formID: 5,
      fieldsFile: 'SUS.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.UserID,
        Technique: tech,
        Block: p.Block
      },
      fieldsFields: responses
    });
  });
});

fs.writeFileSync(path.join(answersDir, '5.json'), JSON.stringify(answers5, null, 2), 'utf8');
console.log('✓ answers/5.json généré (SUS : 18 réponses)');

// 5. Formulaire 2 : Sense of Agency Scale (Post-modalité, param: UserID_TI_Block.json)
const answers2 = [];
participants.forEach((p) => {
  techniques.forEach((tech) => {
    let sopaBase = tech === 'Joystick' ? 6 : tech === 'GoTo' ? 5 : 4;
    let sonaBase = tech === 'Joystick' ? 2 : tech === 'GoTo' ? 3 : 5;

    const clamp7 = (v) => Math.min(7, Math.max(1, v));

    answers2.push({
      id: crypto.randomUUID(),
      name: 'Sense of Agency Scale',
      formID: 2,
      fieldsFile: 'Agency.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.UserID,
        Technique: tech,
        Block: p.Block
      },
      fieldsFields: {
        'Item 1 (SoPA)': clamp7(sopaBase + Math.floor(Math.random() * 2)),
        'Item 3 (SoNA)': clamp7(sonaBase + Math.floor(Math.random() * 2)),
        'Item 7 (SoNA)': clamp7(sonaBase + Math.floor(Math.random() * 2)),
        'Item 8 (SoPA)': clamp7(sopaBase + Math.floor(Math.random() * 2)),
        'Item 9 (SoPA)': clamp7(sopaBase + Math.floor(Math.random() * 2)),
        'Item 11 (SoNA)': clamp7(sonaBase + Math.floor(Math.random() * 2)),
        'Item 13 (SoPA)': clamp7(sopaBase + Math.floor(Math.random() * 2))
      }
    });
  });
});

fs.writeFileSync(path.join(answersDir, '2.json'), JSON.stringify(answers2, null, 2), 'utf8');
console.log('✓ answers/2.json généré (Agency : 18 réponses)');

// 6. Formulaire 4 : UEQ (Post-modalité, param: UserID_TI_Block.json)
const answers4 = [];
participants.forEach((p) => {
  techniques.forEach((tech) => {
    const fields = {};
    for (let q = 1; q <= 26; q++) {
      let base = tech === 'Joystick' ? 6 : tech === 'GoTo' ? 5 : 3;
      fields[`Question ${q}`] = Math.min(7, Math.max(1, base + Math.floor(Math.random() * 3) - 1));
    }

    answers4.push({
      id: crypto.randomUUID(),
      name: 'UEQ',
      formID: 4,
      fieldsFile: 'UEQ.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.UserID,
        Technique: tech,
        Block: p.Block
      },
      fieldsFields: fields
    });
  });
});

fs.writeFileSync(path.join(answersDir, '4.json'), JSON.stringify(answers4, null, 2), 'utf8');
console.log('✓ answers/4.json généré (UEQ : 18 réponses)');

// 7. Formulaire 1 : IPQ (Post-modalité, param: UserID_TI_Block.json)
const answers1 = [];
const ipqLabels = ['G1', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'INV1', 'INV2', 'INV3', 'INV4', 'REAL1', 'REAL2', 'REAL3', 'REAL4'];
participants.forEach((p) => {
  techniques.forEach((tech) => {
    const fields = {};
    ipqLabels.forEach((label) => {
      let base = tech === 'Joystick' ? 2 : tech === 'GoTo' ? 1 : 0;
      fields[label] = Math.min(3, Math.max(-3, base + Math.floor(Math.random() * 3) - 1));
    });

    answers1.push({
      id: crypto.randomUUID(),
      name: 'Igroup Presence',
      formID: 1,
      fieldsFile: 'IPQ.json',
      paramFile: 'UserID_TI_Block.json',
      parametersFields: {
        UserID: p.UserID,
        Technique: tech,
        Block: p.Block
      },
      fieldsFields: fields
    });
  });
});

fs.writeFileSync(path.join(answersDir, '1.json'), JSON.stringify(answers1, null, 2), 'utf8');
console.log('✓ answers/1.json généré (IPQ : 18 réponses)');

// 8. Formulaire 6 : Ranking (Clôture / Post-expérience, param: UserID_Block.json)
const rankingsData = [
  {
    UserID: 'P01',
    Block: 'A1',
    jScore: 9,
    gScore: 7,
    iScore: 5,
    order: ['Joystick', 'GoTo', 'IMU'],
    comment: 'Le Joystick est de loin le plus précis et le plus reposant. L\'IMU demande trop de tension dans l\'avant-bras.'
  },
  {
    UserID: 'P02',
    Block: 'A2',
    jScore: 8,
    gScore: 8,
    iScore: 4,
    order: ['GoTo', 'Joystick', 'IMU'],
    comment: 'GoTo est très agréable pour les longues distances. Joystick très précis pour l\'ajustement fin.'
  },
  {
    UserID: 'P03',
    Block: 'B1',
    jScore: 9,
    gScore: 6,
    iScore: 5,
    order: ['Joystick', 'GoTo', 'IMU'],
    comment: 'Prise en main immédiate du Joystick. Le GoTo manque parfois d\'anticipation.'
  },
  {
    UserID: 'P04',
    Block: 'B2',
    jScore: 8,
    gScore: 9,
    iScore: 6,
    order: ['GoTo', 'Joystick', 'IMU'],
    comment: 'GoTo permet d\'aller très vite sur les cibles éloignées. L\'IMU a du potentiel mais tremble un peu.'
  },
  {
    UserID: 'P05',
    Block: 'C1',
    jScore: 9,
    gScore: 7,
    iScore: 4,
    order: ['Joystick', 'GoTo', 'IMU'],
    comment: 'Excellente fluidité avec le joystick physique. L\'IMU m\'a semblé fatiguant après quelques minutes.'
  },
  {
    UserID: 'P06',
    Block: 'C2',
    jScore: 10,
    gScore: 7,
    iScore: 5,
    order: ['Joystick', 'GoTo', 'IMU'],
    comment: 'Très nette préférence pour le Joystick. GoTo est intéressant en complément.'
  }
];

const answers6 = rankingsData.map((r) => ({
  id: crypto.randomUUID(),
  name: 'Ranking',
  formID: 6,
  fieldsFile: 'Ranking.json',
  paramFile: 'UserID_Block.json',
  parametersFields: {
    UserID: r.UserID,
    Block: r.Block
  },
  fieldsFields: {
    'Note : Joystick': r.jScore,
    'Note : GoTo': r.gScore,
    'Note : IMU': r.iScore,
    'Classement global': r.order,
    'Commentaires et nuances': r.comment
  }
}));

fs.writeFileSync(path.join(answersDir, '6.json'), JSON.stringify(answers6, null, 2), 'utf8');
console.log('✓ answers/6.json généré (Ranking : 6 réponses)');

// 9. Formulaire 7 : Commentaires libres (Clôture / Post-expérience, param: UserID_Block.json)
const commentsData = [
  {
    UserID: 'P01',
    Block: 'A1',
    joystick: 'Très naturel, aucune latence perceptible.',
    goto: 'Utile pour des déplacements rapides mais parfois difficile de s\'arrêter exactement au bon endroit.',
    imu: 'Sensibilité trop élevée, nécessite une calibration régulière.',
    general: 'Expérience fluide et consignes claires.'
  },
  {
    UserID: 'P02',
    Block: 'A2',
    joystick: 'Efficace et stable.',
    goto: 'Ma modalité préférée pour explorer la scène globale.',
    imu: 'Difficile à maîtriser au début, mais s\'améliore au fil des essais.',
    general: 'Bonne organisation des blocs d\'essais.'
  },
  {
    UserID: 'P03',
    Block: 'B1',
    joystick: 'Repose bien la main, contrôle continu parfait.',
    goto: 'Bien pour aller droit au but.',
    imu: 'Léger tremblement visible lors des pointages fins.',
    general: 'Les questionnaires inter-modalités sont rapides à remplir.'
  },
  {
    UserID: 'P04',
    Block: 'B2',
    joystick: 'Classique et robuste.',
    goto: 'Excellente idée, gain de temps appréciable.',
    imu: 'Intéressant mais fatigant sans accoudoir.',
    general: 'Protocole bien rythmé.'
  },
  {
    UserID: 'P05',
    Block: 'C1',
    joystick: 'Zéro frustration, navigation intuitive.',
    goto: 'Fonctionne bien pour les cibles nettes.',
    imu: 'Fatigue musculaire au niveau de l\'épaule.',
    general: 'Interface très agréable.'
  },
  {
    UserID: 'P06',
    Block: 'C2',
    joystick: '10/10 en termes de confort et de précision.',
    goto: 'Bon compromis vitesse/précision.',
    imu: 'Nécessite plus de pratique pour être compétitif.',
    general: 'Expérience globalement très positive.'
  }
];

const answers7 = commentsData.map((c) => ({
  id: crypto.randomUUID(),
  name: 'Commentaires',
  formID: 7,
  fieldsFile: 'techniques.json',
  paramFile: 'UserID_Block.json',
  parametersFields: {
    UserID: c.UserID,
    Block: c.Block
  },
  fieldsFields: {
    Joystick: c.joystick,
    GoTo: c.goto,
    IMU: c.imu,
    Général: c.general
  }
}));

fs.writeFileSync(path.join(answersDir, '7.json'), JSON.stringify(answers7, null, 2), 'utf8');
console.log('✓ answers/7.json généré (Commentaires : 6 réponses)');

console.log('\n=== JEU DE DONNÉES COHÉRENT ET COMPLET GÉNÉRÉ AVEC SUCCÈS ===');
