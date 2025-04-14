# krakend 

# Application Microservices avec Keycloak et KrakenD

Ce projet démontre une architecture microservices sécurisée utilisant Keycloak pour l'authentification, KrakenD comme API Gateway, et des microservices Spring Boot.

## Architecture

Le projet est composé des éléments suivants :

- **Keycloak** : Serveur d'authentification
- **KrakenD** : API Gateway
- **MS-Produit** : Microservice de produits (Java/Spring Boot)
- **MS-Commande** : Microservice de commandes (Java/Spring Boot)
- **Frontend** : Application React avec intégration Keycloak

## Prérequis

- Docker et Docker Compose
- JDK 17
- Maven
- Node.js et npm

## Structure du Projet

```
microservices-keycloak-project/
├── docker-compose.yml        # Pour exécuter tous les services ensemble
├── keycloak/                 # Configuration Keycloak
├── krakend/                  # Configuration de l'API Gateway KrakenD
│   └── krakend.json          # Configuration de la passerelle
├── frontend/                 # Application frontend React
├── ms-produit/              # Microservice Produit Java
└── ms-commande/             # Microservice Commande Java
```

## Guide de Configuration

### 1. Configuration du Réseau

Créez d'abord un réseau Docker :

```bash
docker network create app-network
```

### 2. Configuration de Keycloak

1. Démarrez Keycloak :

```bash
docker-compose up -d keycloak
```

2. Accédez à Keycloak via http://localhost:8080/
   - Connectez-vous avec admin/admin
   - Créez un nouveau realm appelé "microservices-demo"

3. Configurez le client :
   - Créez un client "frontend-client" avec :
     - ID Client : frontend-client
     - Protocole Client : openid-connect
     - Type d'accès : public
     - Flux standard activé : ON
     - Accès direct aux subventions activé : ON
     - URIs de redirection valides : http://localhost:3000/*
     - Origines Web : *

4. Créez un utilisateur de test :
   - Nom d'utilisateur : testuser
   - Email : test@example.com
   - Mot de passe : password (désactivez l'option "Temporaire")

### 3. Configuration de KrakenD

1. Créez un répertoire pour la configuration de KrakenD :

```bash
mkdir -p krakend
```

2. Créez un fichier de configuration `krakend.json` :
   - Définissez les endpoints pour les microservices
   - Configurez la validation JWT
   - Activez CORS
   - Utilisez "no-op" pour l'encodage des requêtes et réponses

3. Démarrez KrakenD :

```bash
docker-compose up -d krakend
```

### 4. Configuration du Microservice Produit

1. Créez la structure de répertoires pour ms-produit
2. Configurez le fichier pom.xml avec les dépendances Spring Boot, Spring Security et OAuth2
3. Configurez application.properties avec les URLs Keycloak
4. Implémentez les classes Java pour :
   - L'application principale
   - Configuration de sécurité
   - Convertisseur JWT Keycloak
   - Contrôleur de produits simple
5. Démarrez le microservice :

```bash
docker-compose up -d ms-produit
```

### 5. Configuration du Microservice Commande

1. Suivez les mêmes étapes que pour le Microservice Produit
2. Adaptez les noms et implémentez un contrôleur pour les commandes
3. Démarrez le microservice :

```bash
docker-compose up -d ms-commande
```

### 6. Configuration du Frontend

1. Créez la structure de répertoires pour le frontend React
2. Configurez package.json avec les dépendances React et Keycloak
3. Implémentez les composants React pour :
   - Initialisation Keycloak
   - Affichage du tableau de bord
   - Appels aux services via KrakenD
4. Démarrez le frontend :

```bash
docker-compose up -d frontend
```

### 7. Configuration Docker Compose

Créez un fichier `docker-compose.yml` dans le répertoire racine avec la configuration pour tous les services.

## Exécution de l'Application

1. Créez le réseau Docker si ce n'est pas déjà fait :
```bash
docker network create app-network
```

2. Démarrez tous les services :
```bash
docker-compose up -d
```

3. Accédez à l'application :
   - Frontend : http://localhost:3000
   - Console d'administration Keycloak : http://localhost:8080 (admin/admin)
   - KrakenD : http://localhost:8090
   - Service Produit (direct) : http://localhost:8081/api/products
   - Service Commande (direct) : http://localhost:8082/api/orders

## Test du flux

1. Ouvrez http://localhost:3000 dans votre navigateur
2. Vous serez redirigé vers Keycloak pour l'authentification
3. Connectez-vous avec testuser/password
4. Après connexion réussie, vous verrez le tableau de bord avec des boutons
5. Cliquez sur "Call Product Service" pour tester le microservice produit via KrakenD
6. Cliquez sur "Call Order Service" pour tester le microservice commande via KrakenD
7. Les réponses devraient apparaître dans des cartes en dessous des boutons

## Dépannage

### Problèmes CORS
Assurez-vous que la configuration CORS dans KrakenD est correcte et que les Origines Web dans les paramètres du client Keycloak incluent l'URL de votre frontend.

### Problèmes de Connexion
Vérifiez que tous les services peuvent communiquer entre eux via le réseau Docker.

### Erreurs KrakenD
Si KrakenD renvoie des erreurs 500, vérifiez les paramètres d'encodage dans krakend.json. Définir `output_encoding` et `encoding` sur `"no-op"` assure un traitement correct des formats de réponse.

### Problèmes d'Authentification
Vérifiez que le client Keycloak est correctement configuré et que le token JWT est validé correctement par KrakenD.

