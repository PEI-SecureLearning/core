import { ReactKeycloakProvider } from '@react-keycloak/web'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ui/confirm-modal";
import { ThemeProvider } from "next-themes";
import keycloak from "@/keycloak";

const isSecureContext = globalThis.isSecureContext || globalThis.location.hostname === 'localhost';

const initOptions: Keycloak.KeycloakInitOptions = {
    onLoad: "login-required",
    pkceMethod: isSecureContext ? "S256" : undefined,
    responseMode: "query",
    checkLoginIframe: false,
};

export function Providers({
    children,
    onKeycloakEvent,
}: {
    children: React.ReactNode;
    onKeycloakEvent?: (event: string, error: unknown) => void;
}) {
    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={initOptions}
            onEvent={onKeycloakEvent}
        >
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                themes={['light', 'dark', 'deuteranopia', 'protanopia', 'tritanopia', 'system']}
            >
                <NuqsAdapter>
                    <ConfirmProvider>
                        {children}
                    </ConfirmProvider>
                    <Toaster />
                </NuqsAdapter>
            </ThemeProvider>
        </ReactKeycloakProvider>
    );
}
