import { useState, useEffect, useCallback } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useNavigate } from 'react-router-dom';

/**
 * Hook personnalisé pour gérer l'authentification
 */
export const useAuth = () => {
  const { keycloak, initialized } = useKeycloak();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Vérifier la validité du token à chaque rendu et tenter un refresh si nécessaire
  useEffect(() => {
    const checkToken = async () => {
      if (initialized && keycloak.authenticated) {
        // Si le token est expiré mais que le refresh token est valide
        if (keycloak.isTokenExpired() && !keycloak.isTokenExpired(3600)) { // Check if refresh token is valid for at least an hour
          try {
            // Tenter de rafraîchir le token
            const refreshed = await keycloak.updateToken(30);
            if (refreshed) {
              keycloak.saveTokens(); // Sauvegarder les nouveaux tokens
              console.log('Token rafraîchi avec succès');
            }
          } catch (err) {
            console.error('Impossible de rafraîchir le token', err);
            keycloak.clearTokens();
            navigate('/login');
          }
        }
      }
    };
    
    checkToken();
  }, [initialized, keycloak, navigate]);
  
  // Fonction de connexion personnalisée
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtention d'un token en utilisant l'API direct grant
      const response = await fetch(`${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: keycloak.clientId,
          username,
          password,
          grant_type: 'password',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Échec de connexion');
      }
      
      const tokenData = await response.json();
      
      // Mise à jour de l'instance Keycloak
      keycloak.token = tokenData.access_token;
      keycloak.refreshToken = tokenData.refresh_token;
      keycloak.idToken = tokenData.id_token;
      keycloak.authenticated = true;
      
      // Décodage du token pour obtenir les informations utilisateur
      const base64Url = keycloak.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      keycloak.tokenParsed = JSON.parse(jsonPayload);
      
      // Sauvegarde des tokens
      keycloak.saveTokens();
      
      return true;
    } catch (err) {
      setError(err.message || 'Échec de connexion');
      return false;
    } finally {
      setLoading(false);
    }
  }, [keycloak]);
  
  // Fonction de déconnexion
  const logout = useCallback(() => {
    keycloak.clearTokens();
    keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }, [keycloak]);
  
  // Fonction d'inscription
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Tentative d'utilisation de l'API publique d'inscription
      const response = await fetch(
        `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/registrations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            enabled: true,
            credentials: [
              {
                type: 'password',
                value: userData.password,
                temporary: false
              }
            ]
          })
        }
      );
      
      // Si l'API publique n'est pas disponible, utiliser l'API admin
      if (!response.ok && (response.status === 403 || response.status === 404)) {
        return await registerWithAdminAPI(userData);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errorMessage || 'Échec de l\'inscription');
      }
      
      return true;
    } catch (err) {
      setError(err.message || 'Échec de l\'inscription');
      return false;
    } finally {
      setLoading(false);
    }
  }, [keycloak]);
  
  // Fonction d'inscription via l'API admin (fallback)
  const registerWithAdminAPI = async (userData) => {
    try {
      // Obtention d'un token admin
      const tokenResponse = await fetch(
        `${keycloak.authServerUrl}/realms/master/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: 'admin-cli',
            username: 'admin',
            password: 'admin',
            grant_type: 'password'
          })
        }
      );
      
      if (!tokenResponse.ok) {
        throw new Error('Échec d\'authentification admin');
      }
      
      const tokenData = await tokenResponse.json();
      const adminToken = tokenData.access_token;
      
      // Création de l'utilisateur via l'API admin
      const createUserResponse = await fetch(
        `${keycloak.authServerUrl}/admin/realms/${keycloak.realm}/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            username: userData.username,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            enabled: true,
            credentials: [
              {
                type: 'password',
                value: userData.password,
                temporary: false
              }
            ]
          })
        }
      );
      
      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(errorData.errorMessage || 'Échec de création de l\'utilisateur');
      }
      
      return true;
    } catch (err) {
      throw err;
    }
  };
  
  return {
    initialized,
    authenticated: keycloak.authenticated,
    user: keycloak.tokenParsed,
    login,
    logout,
    register,
    loading,
    error,
    clearError: () => setError(null)
  };
};