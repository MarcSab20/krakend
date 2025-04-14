# krakend 

# Microservices Application with Keycloak and KrakenD

This project demonstrates a secure microservices architecture using Keycloak for authentication, KrakenD as an API Gateway, and Spring Boot microservices.

## Architecture

The project consists of the following components:

- **Keycloak**: Authentication server
- **KrakenD**: API Gateway
- **MS-Produit**: Product microservice (Java/Spring Boot)
- **MS-Commande**: Order microservice (Java/Spring Boot)
- **Frontend**: React application with Keycloak integration

## Prerequisites

- Docker and Docker Compose
- JDK 17
- Maven
- Node.js and npm

## Project Structure

```
microservices-keycloak-project/
├── docker-compose.yml        # For running all services together
├── keycloak/                 # Keycloak configuration
│   └── realm-export.json     # Pre-configured realm settings (optional)
├── krakend/                  # KrakenD API Gateway config
│   └── krakend.json          # Gateway configuration
├── frontend/                 # React frontend application
│   ├── public/
│   └── src/
├── ms-produit/              # Java Product microservice
│   ├── src/
│   └── pom.xml
└── ms-commande/             # Java Order microservice
    ├── src/
    └── pom.xml
```

## Configuration Guide

### 1. Network Setup

First, create a Docker network:

```bash
docker network create app-network
```

### 2. Keycloak Setup

1. Start Keycloak:

```bash
docker-compose up -d keycloak
```

2. Access Keycloak at http://localhost:8080/
   - Login with admin/admin
   - Create a new realm called "microservices-demo"

3. Configure the client:
   - Create a client "frontend-client" with:
     - Client ID: frontend-client
     - Client Protocol: openid-connect
     - Access Type: public
     - Standard Flow Enabled: ON
     - Direct Access Grants Enabled: ON
     - Valid Redirect URIs: http://localhost:3000/*
     - Web Origins: *

4. Create a test user:
   - Username: testuser
   - Email: test@example.com
   - Password: password (disable "Temporary" option)

### 3. KrakenD Setup

1. Create a directory for KrakenD configuration:

```bash
mkdir -p krakend
```

2. Create a `krakend.json` configuration file:

```json
{
  "$schema": "https://www.krakend.io/schema/v2.5/krakend.json",
  "version": 3,
  "name": "Microservices API Gateway",
  "timeout": "3000ms",
  "cache_ttl": "300s",
  "extra_config": {
    "telemetry/logging": {
      "level": "DEBUG",
      "prefix": "[KRAKEND]",
      "syslog": false,
      "stdout": true
    },
    "security/cors": {
      "allow_origins": ["*"],
      "allow_methods": ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"],
      "allow_headers": ["Origin", "Authorization", "Content-Type"],
      "expose_headers": ["Content-Length"],
      "allow_credentials": true,
      "max_age": "12h"
    }
  },
  "endpoints": [
    {
      "endpoint": "/api/products",
      "method": "GET",
      "output_encoding": "no-op",
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "http://keycloak:8080/realms/microservices-demo/protocol/openid-connect/certs",
          "disable_jwk_security": true,
          "propagate_claims": [
            ["sub", "x-user"]
          ]
        }
      },
      "backend": [
        {
          "url_pattern": "/api/products",
          "host": ["http://ms-produit:8081"],
          "encoding": "no-op"
        }
      ]
    },
    {
      "endpoint": "/api/orders",
      "method": "GET",
      "output_encoding": "no-op",
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "http://keycloak:8080/realms/microservices-demo/protocol/openid-connect/certs",
          "disable_jwk_security": true,
          "propagate_claims": [
            ["sub", "x-user"]
          ]
        }
      },
      "backend": [
        {
          "url_pattern": "/api/orders",
          "host": ["http://ms-commande:8082"],
          "encoding": "no-op"
        }
      ]
    }
  ]
}
```

3. Start KrakenD:

```bash
docker-compose up -d krakend
```

### 4. Product Microservice Setup

1. Create the directory structure:
```bash
mkdir -p ms-produit/src/main/java/com/example/msproduit/controller
mkdir -p ms-produit/src/main/java/com/example/msproduit/config
mkdir -p ms-produit/src/main/resources
```

2. Create the `pom.xml` file:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>ms-produit</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>ms-produit</name>
    <description>Product Microservice</description>

    <properties>
        <java.version>17</java.version>
        <keycloak.version>23.0.3</keycloak.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

3. Create `application.properties`:
```properties
server.port=8081
spring.application.name=ms-produit

# Keycloak configuration
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://keycloak:8080/realms/microservices-demo
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://keycloak:8080/realms/microservices-demo/protocol/openid-connect/certs
```

4. Create the main application class:
```java
package com.example.msproduit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MsProduitApplication {
    public static void main(String[] args) {
        SpringApplication.run(MsProduitApplication.class, args);
    }
}
```

5. Create a security configuration:
```java
package com.example.msproduit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(new KeycloakJwtAuthenticationConverter()))
            );
        return http.build();
    }
}
```

6. Create a Keycloak JWT converter:
```java
package com.example.msproduit.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter defaultGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                defaultGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractResourceRoles(jwt).stream()
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(jwt, authorities, getPrincipalClaimName(jwt));
    }

    private String getPrincipalClaimName(Jwt jwt) {
        return jwt.getClaim("preferred_username");
    }

    private Collection<? extends GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess == null) {
            return java.util.Collections.emptySet();
        }

        Map<String, Object> resource = (Map<String, Object>) resourceAccess.get("frontend-client");
        if (resource == null) {
            return java.util.Collections.emptySet();
        }

        Collection<String> roles = (Collection<String>) resource.get("roles");
        if (roles == null) {
            return java.util.Collections.emptySet();
        }

        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toSet());
    }
}
```

7. Create a product controller:
```java
package com.example.msproduit.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @GetMapping
    public List<Map<String, Object>> getProducts() {
        return List.of(
            Map.of(
                "id", 1,
                "name", "Product 1", 
                "price", 19.99,
                "description", "This is product 1"
            ),
            Map.of(
                "id", 2,
                "name", "Product 2", 
                "price", 29.99,
                "description", "This is product 2"
            ),
            Map.of(
                "id", 3,
                "name", "Product 3", 
                "price", 39.99,
                "description", "This is product 3"
            )
        );
    }
}
```

8. Create a Dockerfile:
```dockerfile
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 5. Order Microservice Setup

Follow the same steps as the Product Microservice, but with appropriate naming changes:

1. Directory structure:
```bash
mkdir -p ms-commande/src/main/java/com/example/mscommande/controller
mkdir -p ms-commande/src/main/java/com/example/mscommande/config
mkdir -p ms-commande/src/main/resources
```

2. Create equivalent files with appropriate naming (use ms-commande instead of ms-produit, OrderController instead of ProductController, etc.)

3. For the OrderController, use this implementation:
```java
package com.example.mscommande.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping
    public List<Map<String, Object>> getOrders() {
        return List.of(
            Map.of(
                "id", 1,
                "customerName", "John Doe",
                "orderDate", LocalDate.now().toString(),
                "total", 59.97,
                "items", List.of(
                    Map.of("productId", 1, "quantity", 2, "price", 19.99),
                    Map.of("productId", 2, "quantity", 1, "price", 29.99)
                )
            ),
            Map.of(
                "id", 2,
                "customerName", "Jane Smith",
                "orderDate", LocalDate.now().minusDays(1).toString(),
                "total", 39.99,
                "items", List.of(
                    Map.of("productId", 3, "quantity", 1, "price", 39.99)
                )
            )
        );
    }
}
```

### 6. Frontend Setup

1. Create the directory structure:
```bash
mkdir -p frontend/public frontend/src/components frontend/src/services
```

2. Create `package.json`:
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@react-keycloak/web": "^3.4.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.6.2",
    "bootstrap": "^5.3.2",
    "keycloak-js": "^23.0.3",
    "react": "^18.2.0",
    "react-bootstrap": "^2.9.1",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

3. Create `public/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Microservices with Keycloak and KrakenD"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Microservices Demo</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

4. Create `public/manifest.json`:
```json
{
  "short_name": "Microservices Demo",
  "name": "Microservices with Keycloak and KrakenD",
  "icons": [],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}
```

5. Create `src/index.js`:
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ReactKeycloakProvider authClient={keycloak} initOptions={{
      onLoad: 'login-required',
      checkLoginIframe: false,
    }}>
      <App />
    </ReactKeycloakProvider>
  </React.StrictMode>
);
```

6. Create `src/index.css`:
```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 20px;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

.btn {
  margin: 5px;
}

.container {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
}
```

7. Create `src/keycloak.js`:
```javascript
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080/',
  realm: 'microservices-demo',
  clientId: 'frontend-client'
});

export default keycloak;
```

8. Create `src/App.js`:
```javascript
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
      const response = await axios.get('http://localhost:8090/api/products', {
        headers: {
          Authorization: `Bearer ${keycloak.token}`
        }
      });
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
      const response = await axios.get('http://localhost:8090/api/orders', {
        headers: {
          Authorization: `Bearer ${keycloak.token}`
        }
      });
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
```

9. Create a Dockerfile for the frontend:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

10. Create nginx.conf:
```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # redirect server error pages to the static page /50x.html
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
```

### 7. Docker Compose Setup

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3'

services:
  keycloak:
    image: quay.io/keycloak/keycloak:23.0.3
    container_name: keycloak
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - KC_DB=dev-file
    ports:
      - "8080:8080"
    command: start-dev
    networks:
      - app-network

  krakend:
    image: devopsfaith/krakend:2.5.0
    container_name: krakend
    volumes:
      - ./krakend:/etc/krakend
    ports:
      - "8090:8080"
    depends_on:
      - keycloak
    networks:
      - app-network

  ms-produit:
    build: ./ms-produit
    container_name: ms-produit
    ports:
      - "8081:8081"
    depends_on:
      - keycloak
      - krakend
    networks:
      - app-network

  ms-commande:
    build: ./ms-commande
    container_name: ms-commande
    ports:
      - "8082:8082"
    depends_on:
      - keycloak
      - krakend
    networks:
      - app-network

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "3000:80"
    depends_on:
      - keycloak
      - krakend
      - ms-produit
      - ms-commande
    networks:
      - app-network

networks:
  app-network:
    external: true
```

## Running the Application

1. Create the Docker network if it doesn't exist:
```bash
docker network create app-network
```

2. Start all services:
```bash
docker-compose up -d
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Keycloak Admin Console: http://localhost:8080 (admin/admin)
   - KrakenD: http://localhost:8090
   - Product Service (direct): http://localhost:8081/api/products
   - Order Service (direct): http://localhost:8082/api/orders

## Testing the flow

1. Open http://localhost:3000 in your browser
2. You will be redirected to Keycloak for authentication
3. Log in with testuser/password
4. After successful login, you'll see the dashboard with buttons
5. Click "Call Product Service" to test the product microservice through KrakenD
6. Click "Call Order Service" to test the order microservice through KrakenD
7. The responses should appear in cards below the buttons

## Troubleshooting

### CORS Issues
If you encounter CORS issues, ensure that the CORS configuration in KrakenD is correct and that Web Origins in Keycloak client settings include your frontend URL.

### Connection Issues
Ensure all services can communicate with each other through the Docker network. Use the following command to verify network connections:
```bash
docker network inspect app-network
```

### KrakenD Error Responses
If KrakenD returns 500 errors, check the encoding settings in krakend.json. Setting both `output_encoding` and `encoding` to `"no-op"` ensures proper handling of response formats.

### Authentication Issues
Verify that the Keycloak client is properly configured and that the JWT token is correctly validated by KrakenD.

## Security Considerations

This setup is suitable for development and demonstration purposes. For production environments, consider:

1. Using persistent storage for Keycloak
2. Implementing HTTPS
3. Securing sensitive endpoints
4. Implementing proper role-based access control
5. Setting up proper logging and monitoring
