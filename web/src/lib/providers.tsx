import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools/production";
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ui/confirm-modal";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient();
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <NuqsAdapter>
                <QueryClientProvider client={queryClient}>
                    <ConfirmProvider>
                        {children}
                    </ConfirmProvider>
                    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                </QueryClientProvider>
                <Toaster />
            </NuqsAdapter>
        </ThemeProvider>
    );
}