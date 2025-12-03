import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ReactKeycloakProvider } from '@react-keycloak/web'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { Providers } from './lib/providers'
import keycloak from "./keycloak"
import { EmailEntry } from './components/EmailEntry'

const initOptions = {
  onLoad: "login-required",
  pkceMethod: "S256",
};

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  const userRealm = localStorage.getItem('user_realm');
  const hasValidRealm = isAdminRoute || !!userRealm;

  if (!hasValidRealm) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <StrictMode>
        <EmailEntry />
      </StrictMode>
    )
  } else {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
        <StrictMode>
          <Providers>
            <RouterProvider router={router} />
          </Providers>
        </StrictMode>,
      </ReactKeycloakProvider>
    )
  }
}