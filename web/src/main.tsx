import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { ReactKeycloakProvider } from '@react-keycloak/web'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { Providers } from './lib/providers'
import keycloak from "./keycloak"
import { EmailEntry } from './components/EmailEntry'

const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';

const initOptions: Keycloak.KeycloakInitOptions = {
  onLoad: "login-required",
  pkceMethod: isSecureContext ? "S256" : undefined,
  responseMode: "query",
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 800)

        const url = `${keycloak.authServerUrl}/realms/${keycloak.realm}/.well-known/openid-configuration`
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          // If 404 or 500, it's an error
          throw new Error(`HTTP ${response.status}: ${response.statusText} (URL: ${url})`)
        }

        setIsLoading(false)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error("Keycloak pre-check failed:", err)
        setErrorMessage(errorMsg)
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [])

  const onEvent = (event: string, error: unknown) => {
    if (event === 'onInitError') {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
      setErrorMessage(`Keycloak init error: ${errorMsg}`)
    }
  }

  if (errorMessage) {
    return <ServiceUnavailable error={errorMessage} />
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
  const isAdminRoute = window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/content-manager");
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
