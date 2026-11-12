# form261

Plateforme de gestion de formulaires et de recueil de données pour expérimentations (Igroup Presence, NASA-TLX, SUS, UEQ, Sense of Agency, etc.).

## 🚀 Démarrage rapide (Recommandé)

### Option 1 : Commande unique npm (Cross-platform)
À la racine du projet :
```bash
npm run dev
```
> Démarre simultanément le backend Express (port 5000) et le frontend Vite (port 8888).

### Option 2 : Script Linux / WSL / macOS
```bash
./form261.sh
```
> Installe automatiquement les dépendances manquantes si nécessaire et lance les deux services. Appuyez sur `Ctrl+C` pour tout arrêter proprement.

---

## 📦 Installation initiale (si nécessaire)

Pour installer toutes les dépendances (racine, backend et frontend) en une seule commande :
```bash
npm run install:all
```

---

## 🌐 Accès aux services

- **Application Web (Frontend)** : [http://localhost:8888](http://localhost:8888)
- **API REST (Backend)** : [http://localhost:5000](http://localhost:5000)

Pour utiliser un autre port côté API, définir `PORT` pour le backend et `API_URL` pour le frontend :
```bash
PORT=5055 node backend/server.js
API_URL=http://localhost:5055 npm run dev --prefix frontend
```

---

## 🧭 Utilisation

L'application a deux modes, selon qu'une session est en cours ou non :

- **Mode admin** (aucune session, avec le menu) :
  - **Sessions** — démarrer ou reprendre la session d'un sujet.
  - **Questionnaires** — créer, modifier, tester, supprimer les questionnaires.
  - **Protocole** — facteurs, modalités et contrebalancement.
  - **Réponses** — les réponses de tous les sujets, par questionnaire.
  - **Résultats** — graphiques, tests statistiques et exports (Excel, CSV, JSON).
- **Mode participant** (session active, sans menu) : seuls le déroulé de la session et les
  questionnaires sont accessibles. La carte « Prochaine étape » indique l'unique action à faire ;
  les questionnaires d'une même étape s'enchaînent automatiquement.
  « Terminer la session » ramène au mode admin.

## 🗄️ Données (dossier `backend/`)

| Fichier | Contenu |
|---|---|
| `protocol.json` | Définition du protocole uniquement (nom, facteurs, méthode). Les blocs et les paramètres en sont déduits à la lecture. |
| `forms.json` | Liste des questionnaires (nom, fichier de questions, moment de passation). |
| `fields/<nom>.json` | Questions d'un questionnaire. |
| `participants.json` | Sujets, bloc attribué, essai courant. |
| `answers/<id>.json` | Réponses d'un questionnaire : une réponse par ligne, sans les champs déductibles de `forms.json`. |

---

## 🛠️ Commandes utiles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le backend et le frontend en parallèle |
| `npm run install:all` | Installe les dépendances racine, backend et frontend |
| `npm run build` | Compile l'application frontend pour la production |
| `npm run lint` | Exécute la vérification ESLint sur le frontend |
