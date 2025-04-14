import React, { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Button, Card, Alert, Navbar, Nav } from 'react-bootstrap';
import axios from 'axios';

function Dashboard() {
  const { keycloak } = useKeycloak();
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setError(null);
      // Ensure we have a valid token by refreshing if necessary
      if (keycloak.isTokenExpired(30)) { // Refresh if less than 30 seconds left
        await keycloak.updateToken(60);
      }
      const response = await axios.get('http://localhost:8090/api/products', {
        headers: {
          Authorization: `Bearer ${keycloak.token}`
        }
      });
      console.log('Products response:', response);
      setProducts(response.data);
      setOrders(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products. Please try again.');
    }
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      // Ensure we have a valid token by refreshing if necessary
      if (keycloak.isTokenExpired(30)) { // Refresh if less than 30 seconds left
        await keycloak.updateToken(60);
      }
      const response = await axios.get('http://localhost:8090/api/orders', {
        headers: {
          Authorization: `Bearer ${keycloak.token}`
        }
      });
      console.log('Orders response:', response);
      setOrders(response.data);
      setProducts(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Microservices Demo</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              <Button variant="outline-light" onClick={() => keycloak.logout()}>
                Déconnexion
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <h2>Tableau de bord</h2>
        <p>Bienvenue, {keycloak.tokenParsed.preferred_username}!</p>
        
        <div className="d-flex mb-4">
          <Button variant="primary" onClick={fetchProducts} className="me-2">
            Appeler Service Produit
          </Button>
          <Button variant="success" onClick={fetchOrders} className="me-2">
            Appeler Service Commande
          </Button>
          <Button variant="secondary" onClick={refreshPage}>
            Rafraîchir
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}

        {products && (
          <Card className="mt-3">
            <Card.Header>Produits</Card.Header>
            <Card.Body>
              <pre>{JSON.stringify(products, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}

        {orders && (
          <Card className="mt-3">
            <Card.Header>Commandes</Card.Header>
            <Card.Body>
              <pre>{JSON.stringify(orders, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
}

export default Dashboard;