import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Si nous sommes déjà authentifiés, rediriger vers le tableau de bord
  useEffect(() => {
    if (keycloak.authenticated) {
      navigate('/dashboard');
    }
  }, [keycloak.authenticated, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validation basique
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }
    
    try {
      // Utilisation de l'API d'inscription publique de Keycloak (si activée dans le realm)
      const response = await axios.post(
        `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/registrations`,
        {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          enabled: true,
          credentials: [
            {
              type: 'password',
              value: formData.password,
              temporary: false
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
      
      // Redirection vers la page de connexion après quelques secondes
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Signup error:', err);
      // Si l'API d'inscription publique échoue, utiliser l'API admin en fallback
      if (err.response?.status === 403 || err.response?.status === 404) {
        try {
          await signupWithAdminAPI();
        } catch (adminErr) {
          setError('Échec de l\'inscription. ' + (adminErr.message || 'Veuillez réessayer.'));
        }
      } else {
        setError('Échec de l\'inscription. ' + (err.response?.data?.errorMessage || 'Veuillez réessayer.'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour s'inscrire via l'API Admin (fallback)
  const signupWithAdminAPI = async () => {
    try {
      // Obtention d'un token admin pour pouvoir créer un utilisateur
      const adminToken = await getAdminToken();
      
      // Appel à l'API Keycloak pour créer un utilisateur
      await axios.post(
        `${keycloak.authServerUrl}/admin/realms/${keycloak.realm}/users`,
        {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          enabled: true,
          credentials: [
            {
              type: 'password',
              value: formData.password,
              temporary: false
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          }
        }
      );
      
      setSuccess('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
      
      // Redirection vers la page de connexion après quelques secondes
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Admin signup error:', err);
      throw new Error(err.response?.data?.errorMessage || 'Échec de création du compte');
    }
  };
  
  // Fonction pour obtenir un token admin (dans un environnement de production, ceci serait géré côté serveur)
  const getAdminToken = async () => {
    try {
      const response = await axios.post(
        `${keycloak.authServerUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          client_id: 'admin-cli',
          username: 'admin',  // Admin credentials - should be secured in production
          password: 'admin',  // Admin credentials - should be secured in production
          grant_type: 'password'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to get admin token:', error);
      throw new Error('Échec d\'authentification admin');
    }
  };
  
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '500px' }} className="shadow">
        <Card.Header className="text-center bg-primary text-white">
          <h3>Créer un compte</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSignup}>
            <Form.Group className="mb-3">
              <Form.Label>Nom d'utilisateur</Form.Label>
              <Form.Control 
                type="text" 
                name="username"
                placeholder="Choisissez un nom d'utilisateur" 
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                placeholder="Entrez votre email" 
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="firstName"
                    placeholder="Prénom" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="lastName"
                    placeholder="Nom" 
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control 
                type="password" 
                name="password"
                placeholder="Choisissez un mot de passe" 
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirmer le mot de passe</Form.Label>
              <Form.Control 
                type="password" 
                name="confirmPassword"
                placeholder="Confirmez votre mot de passe" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>

            <div className="d-grid gap-2 mt-4">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Inscription en cours...
                  </>
                ) : 'S\'inscrire'}
              </Button>
            </div>
          </Form>
          
          <div className="text-center mt-3">
            <Link to="/login" className={loading ? 'disabled-link' : ''}>
              Déjà inscrit ? Se connecter
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Signup;