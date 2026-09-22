#!/bin/bash

# Détermine le dossier racine du projet quel que soit l'endroit d'exécution
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$ROOT_DIR" || { echo "Impossible d'accéder au dossier $ROOT_DIR"; exit 1; }

echo "=========================================="
echo "    Initialisation de Form261"
echo "=========================================="

# Vérification et installation automatique des dépendances si nécessaire
if [ ! -d "backend/node_modules" ]; then
    echo "⚙️ Dépendances backend manquantes. Installation..."
    (cd backend && npm install) || { echo "Erreur lors de l'installation des dépendances backend"; exit 1; }
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "⚙️ Dépendances frontend manquantes. Installation..."
    (cd frontend && npm install) || { echo "Erreur lors de l'installation des dépendances frontend"; exit 1; }
fi

# Nettoyage des processus au signal d'interruption
cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo "🛑 Arrêt des services..."
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null
    fi
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null
    fi
    wait "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" 2>/dev/null
    echo "✅ Tous les services ont été arrêtés avec succès."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Démarrage du backend
echo "🚀 Démarrage du backend Express..."
(cd backend && node server.js) &
BACKEND_PID=$!

# 2. Démarrage du frontend
echo "🚀 Démarrage du frontend Vite..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "✨ Form261 est prêt !"
echo "🌐 Frontend (Interface) : http://localhost:8888"
echo "🔌 Backend (API)        : http://localhost:5000"
echo "👉 Appuyez sur Ctrl+C pour arrêter les deux services."
echo "=========================================="
echo ""

# Attente des processus
wait
