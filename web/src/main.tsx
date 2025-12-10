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
  checkLoginIframe: false,
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
import { useState, useEffect } from 'react'
import { ServiceUnavailable } from './components/ServiceUnavailable'
import ErrorBoundary from './components/ErrorBoundary'

const App = () => {
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 800) // 800ms timeout for "instant" feel

        // Construct the URL manually to be safe, or use keycloak instance properties if reliable
        // keycloak.authServerUrl might be undefined if not initialized, so we use the config from keycloak.ts logic if possible, 
        // but here we only have the instance. 
        // Let's assume the instance has the config we passed.
        // Actually, keycloak-js instance usually has 'authServerUrl' set from config.

        const response = await fetch(`${keycloak.authServerUrl}/realms/${keycloak.realm}/.well-known/openid-configuration`, {
          method: 'HEAD',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          // If 404 or 500, it's an error
          throw new Error('Service unavailable')
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Keycloak pre-check failed:", err)
        setIsError(true)
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [])

  const onEvent = (event: string, _error: unknown) => {
    if (event === 'onInitError') {
      setIsError(true)
    }
  }

  if (isError) {
    return <ServiceUnavailable />
  }

  if (isLoading) {
    return null // Or a minimal loading spinner
  }

  return (
    <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions} onEvent={onEvent}>
      <ErrorBoundary>
        <StrictMode>
          <Providers>
            <RouterProvider router={router} />
          </Providers>
        </StrictMode>
      </ErrorBoundary>
    </ReactKeycloakProvider>
  )
}

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
    root.render(<App />)
  }
}