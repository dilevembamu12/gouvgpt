#!/bin/bash

# set -e : Arrête le script si une commande échoue
set -e

# --- 1. Définir les variables ---

# Lire les arguments
# $1 est le port hôte (ex: 8080)
# $2 est le nom du conteneur (ex: gouv-gpt-prod)
HOST_PORT=$1
CONTAINER_NAME=$2

# NOUVEAU : Correction pour les fins de ligne Windows (\r)
# Cela supprime les caractères \r parasites qui peuvent être ajoutés
# si le fichier est édité sur Windows.
HOST_PORT=${HOST_PORT//$'\r'/}
CONTAINER_NAME=${CONTAINER_NAME//$'\r'/}

# Variables statiques
IMAGE_NAME="gouv-gpt-app"
CONTAINER_PORT=3000 # Port interne de l'application Node.js
VOLUME_PATH="$(pwd)/emails.json" # Chemin absolu vers votre fichier emails.json

# --- 2. Valider les arguments ---
if [ -z "$HOST_PORT" ] || [ -z "$CONTAINER_NAME" ]; then
  echo "Erreur : Arguments manquants."
  echo "Usage: ./deploy.sh <port-hote> <nom-du-conteneur>"
  echo "Exemple: ./deploy.sh 8080 gouv-gpt-prod"
  exit 1
fi

# --- 3. Nettoyer les anciens conteneurs ---
echo "--- Étape 1/4 : Arrêt et suppression de l'ancien conteneur ($CONTAINER_NAME)..."
# 2>/dev/null : Supprime les messages d'erreur si le conteneur n'existe pas
# || true : Empêche le script de s'arrêter si la commande échoue (car le conteneur n'existe pas)
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# --- 4. Construire l'image Docker ---
echo "--- Étape 2/4 : Construction de l'image Docker ($IMAGE_NAME)..."
docker build -t "$IMAGE_NAME" .

# --- 5. Lancer le nouveau conteneur ---
echo "--- Étape 3/4 : Lancement du nouveau conteneur ($CONTAINER_NAME)..."
docker run -d \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  --name "$CONTAINER_NAME" \
  -v "$VOLUME_PATH":/usr/src/app/emails.json \
  "$IMAGE_NAME"

# --- 6. Fin ---
echo "--- Étape 4/4 : Déploiement terminé !"
echo "Votre application GouvGPT est maintenant accessible à l'adresse :"
echo "http://localhost:$HOST_PORT"

