import React, { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Button, Card, Alert } from 'react-bootstrap';
import axios from 'axios';

function App() {
  const { keycloak, initialized } = useKeycloak();
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

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!keycloak.authenticated) {
    return (
      <Container>
        <h1>Welcome to Microservices Demo</h1>
        <p>Please login to continue.</p>
        <Button onClick={() => keycloak.login()}>Login</Button>
      </Container>
    );
  }

  return (
    <Container>
      <h1>Microservices Demo</h1>
      <p>Welcome, {keycloak.tokenParsed.preferred_username}!</p>
      
      <div className="d-flex">
        <Button variant="primary" onClick={fetchProducts}>
          Call Product Service
        </Button>
        <Button variant="success" onClick={fetchOrders}>
          Call Order Service
        </Button>
        <Button variant="secondary" onClick={refreshPage}>
          Reload Page
        </Button>
        <Button variant="danger" onClick={() => keycloak.logout()}>
          Logout
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {products && (
        <Card className="mt-3">
          <Card.Header>Products</Card.Header>
          <Card.Body>
            <pre>{JSON.stringify(products, null, 2)}</pre>
          </Card.Body>
        </Card>
      )}

      {orders && (
        <Card className="mt-3">
          <Card.Header>Orders</Card.Header>
          <Card.Body>
            <pre>{JSON.stringify(orders, null, 2)}</pre>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default App;