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

### Option 3 : Windows (Double-clic)
Double-cliquez sur `run.bat` ou lancez dans le terminal :
```cmd
run.bat
```

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

---

## 🛠️ Commandes utiles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le backend et le frontend en parallèle |
| `npm run install:all` | Installe les dépendances racine, backend et frontend |
| `npm run build` | Compile l'application frontend pour la production |
| `npm run lint` | Exécute la vérification ESLint sur le frontend |
