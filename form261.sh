#!/bin/bash

# Démarre le serveur dans le dossier backend
echo "Lancement du serveur dans le dossier backend..."
cd backend || { echo "Le dossier backend est introuvable."; exit 1; }
node server.js &
BACKEND_PID=$!

# Démarre le serveur de prévisualisation dans le dossier frontend
echo "Lancement de la prévisualisation dans le dossier frontend..."
cd ../frontend || { echo "Le dossier frontend est introuvable."; kill $BACKEND_PID; exit 1; }
npm run dev &
FRONTEND_PID=$!

# Attente de l'interruption de l'utilisateur
echo "Les deux services sont en cours d'exécution. Appuyez sur Ctrl+C pour arrêter."

# Nettoyage des processus en cas d'interruption
trap 'echo "Arrêt des services..."; kill $BACKEND_PID $FRONTEND_PID; exit 0' SIGINT

# Boucle infinie pour garder le script en cours d'exécution
while true; do
    sleep 1
done
