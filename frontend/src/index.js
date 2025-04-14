import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';

// Configuration pour le keycloak provider qui EMPÊCHE la redirection automatique
const keycloakProviderInitConfig = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  checkLoginIframe: false,
  enableLogging: true,
  // C'est important - désactive COMPLÈTEMENT la redirection vers Keycloak 
  // vous permettant d'utiliser votre interface personnalisée
  flow: 'standard',  // utilise le flux standard sans redirection automatique
  pkceMethod: 'S256', // Recommandé pour la sécurité
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
      LoadingComponent={<div>Chargement de l'application...</div>}
    >
      <App />
    </ReactKeycloakProvider>
  </React.StrictMode>
);