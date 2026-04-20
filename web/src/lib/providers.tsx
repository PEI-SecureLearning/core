import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ui/confirm-modal";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
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
    );
}