# Étape 1 : Choisir une image de base Node.js (alpine est légère)
FROM node:18-alpine AS base

# Étape 2 : Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Étape 3 : Copier les fichiers de dépendances et les installer
# On copie package.json et package-lock.json en premier pour profiter du cache Docker
COPY package.json package-lock.json* ./
RUN npm install

# Étape 4 : Copier le reste du code de l'application
COPY . .

# Étape 5 : Exposer le port sur lequel l'application tourne
EXPOSE 3000

# Étape 6 : Définir la commande pour démarrer l'application
CMD [ "npm", "start" ]
