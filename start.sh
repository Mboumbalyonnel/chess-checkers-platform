#!/bin/bash

echo "🎮 Démarrage de la Plateforme Chess & Checkers"
echo "=============================================="
echo ""

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB n'est pas installé!"
    echo "Installation de MongoDB..."
    
    # Détecter l'OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        sudo apt-get update
        sudo apt-get install -y mongodb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew tap mongodb/brew
        brew install mongodb-community
    fi
fi

# Démarrer MongoDB
echo "🔄 Démarrage de MongoDB..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start mongodb
    sudo systemctl status mongodb --no-pager
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start mongodb-community
fi

echo ""

# Vérifier si node_modules existe dans le backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installation des dépendances du backend..."
    cd backend
    npm install
    cd ..
fi

# Vérifier si node_modules existe dans le frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installation des dépendances du frontend..."
    cd frontend
    npm install
    cd ..
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f "backend/.env" ]; then
    echo "📝 Création du fichier .env..."
    cp backend/.env.example backend/.env
    echo "⚠️  N'oubliez pas de modifier backend/.env avec vos paramètres!"
fi

echo ""
echo "✅ Configuration terminée!"
echo ""

# Démarrer le backend
echo "🚀 Démarrage du backend sur http://localhost:5000..."
cd backend
npm run dev &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend
echo "🚀 Démarrage du frontend sur http://localhost:3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "=============================================="
echo "✅ Application démarrée avec succès!"
echo "=============================================="
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:5000"
echo ""
echo "Pour arrêter l'application, appuyez sur Ctrl+C"
echo ""

# Fonction de nettoyage à l'arrêt
cleanup() {
    echo ""
    echo "🛑 Arrêt de l'application..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Application arrêtée"
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Attendre que l'utilisateur arrête l'application
wait $BACKEND_PID $FRONTEND_PID
