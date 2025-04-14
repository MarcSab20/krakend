import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const { keycloak } = useKeycloak();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Si nous sommes déjà authentifiés, rediriger vers le tableau de bord
  useEffect(() => {
    if (keycloak.authenticated) {
      navigate('/dashboard');
    }
  }, [keycloak.authenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Obtention d'un token en utilisant l'API direct grant (Resource Owner Password Credentials)
      const response = await fetch(`${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: keycloak.clientId,
          username: username,
          password: password,
          grant_type: 'password',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Échec de connexion');
      }
      
      const tokenData = await response.json();
      
      // Mise à jour manuelle de Keycloak avec le token
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
      
      // Mise à jour de la session Keycloak
      keycloak.updateToken(-1);
      
      // Redirection vers le tableau de bord ou la page précédente
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      setError('Échec de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectKeycloakLogin = () => {
    // Redirection vers la page de connexion native de Keycloak (fallback)
    keycloak.login({
      redirectUri: `${window.location.origin}/dashboard`
    });
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '400px' }} className="shadow">
        <Card.Header className="text-center bg-primary text-white">
          <h3>Connexion</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Nom d'utilisateur</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Entrez votre nom d'utilisateur" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Entrez votre mot de passe" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>

            <div className="d-grid gap-2 mt-4">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Connexion en cours...
                  </>
                ) : 'Se connecter'}
              </Button>
            </div>
          </Form>
          
          <div className="text-center mt-3">
            <Link to="/signup" className={loading ? 'disabled-link' : ''}>
              Pas encore inscrit ? Créer un compte
            </Link>
          </div>
          
          <hr />
          
          <div className="text-center">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleDirectKeycloakLogin}
              disabled={loading}
            >
              Utiliser l'interface Keycloak native
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;