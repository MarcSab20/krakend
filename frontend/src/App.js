import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

// Composant principal qui attend l'initialisation de Keycloak avant de rendre l'application
function App() {
  const { initialized } = useKeycloak();
  
  if (!initialized) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// Composant spécial pour la redirection initiale qui vérifie l'état d'authentification
const RootRedirect = () => {
  const { keycloak } = useKeycloak();
  
  // Si déjà authentifié, aller au tableau de bord
  if (keycloak.authenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  // Sinon, aller à la page de connexion personnalisée
  return <Navigate to="/login" />;
};

// Composant pour protéger les routes qui nécessitent une authentification
const PrivateRoute = ({ children }) => {
  const { keycloak } = useKeycloak();
  const location = useLocation();

  // Si pas authentifié, rediriger vers login avec l'emplacement actuel en state
  if (!keycloak.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default App;