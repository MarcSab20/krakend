import Keycloak from 'keycloak-js';

// Configuration de l'instance Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080/',
  realm: 'microservices-demo',
  clientId: 'frontend-client'
});

// Ajout d'une méthode pour vérifier si un token est valide
keycloak.isTokenValid = () => {
  if (!keycloak.token) return false;
  
  try {
    // Vérifier si le token a expiré
    if (keycloak.isTokenExpired()) {
      return false;
    }
    
    // Vérifier si le token est bien formé (contient les parties attendues)
    const parts = keycloak.token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
};

// Extension de l'objet keycloak avec une méthode pour persister le token en localStorage
// Cela permet de conserver la session même après un rafraîchissement de la page
keycloak.saveTokens = () => {
  if (keycloak.token && keycloak.refreshToken) {
    localStorage.setItem('kc_token', keycloak.token);
    localStorage.setItem('kc_refreshToken', keycloak.refreshToken);
    if (keycloak.idToken) {
      localStorage.setItem('kc_idToken', keycloak.idToken);
    }
    localStorage.setItem('kc_authenticated', 'true');
  }
};

// Méthode pour restaurer les tokens depuis localStorage
keycloak.restoreTokens = () => {
  const token = localStorage.getItem('kc_token');
  const refreshToken = localStorage.getItem('kc_refreshToken');
  const idToken = localStorage.getItem('kc_idToken');
  const authenticated = localStorage.getItem('kc_authenticated') === 'true';
  
  if (token && refreshToken && authenticated) {
    keycloak.token = token;
    keycloak.refreshToken = refreshToken;
    if (idToken) keycloak.idToken = idToken;
    keycloak.authenticated = authenticated;
    
    // Décodage du token pour obtenir les informations utilisateur
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      keycloak.tokenParsed = JSON.parse(jsonPayload);
      return true;
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      keycloak.clearTokens();
      return false;
    }
  }
  return false;
};

// Méthode pour effacer les tokens du localStorage
keycloak.clearTokens = () => {
  localStorage.removeItem('kc_token');
  localStorage.removeItem('kc_refreshToken');
  localStorage.removeItem('kc_idToken');
  localStorage.removeItem('kc_authenticated');
  keycloak.authenticated = false;
};

// Modification du logout pour effacer les tokens en localStorage
const originalLogout = keycloak.logout;
keycloak.logout = (options) => {
  keycloak.clearTokens();
  return originalLogout.call(keycloak, options);
};

// Tentative de restauration des tokens au démarrage
keycloak.restoreTokens();

export default keycloak;