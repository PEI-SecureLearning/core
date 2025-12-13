import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { TimelineView } from "../../components/campaigns/timeline";
import { fetchCampaigns, type Campaign } from "@/services/campaignsApi"; // Importa do serviço que criámos acima

export const Route = createFileRoute("/campaigns/timeline")({
  component: TimelinePage,
});

function TimelinePage() {
  const { keycloak } = useKeycloak();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Sacar o Realm do Token (A clássica lógica marafada) ---
  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  // --- 2. Ir à pesca dos dados (Fetch) ---
  useEffect(() => {
    if (!realm) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        // Chama a função que bate no endpoint GET /campaigns
        const data = await fetchCampaigns(realm, keycloak.token);

        // Opcional: Converter IDs para string se o TimelineView refilar com números
        // Mas se o backend mandar números, o TypeScript vai ajudar-te.
        setCampaigns(data);
      } catch (err) {
        console.error("Deu barraca ao carregar as campanhas:", err);
        setError("Failed to load timeline data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [realm, keycloak.token]);

  return (
    <div className="w-full p-6 flex flex-col h-full font-[Inter,system-ui,sans-serif] bg-gradient-to-br from-slate-50 via-white to-purple-50/30 animate-[fadeIn_0.5s_ease-out]">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header with Back Button */}
      <div className="h-[6%] flex items-center gap-4 mb-4 flex-shrink-0">
        <Link
          to="/campaigns"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Campaign Timeline
          </h1>
          <p className="text-slate-500 mt-0.5 text-[14px] font-normal">
            View scheduled campaigns across time
          </p>
        </div>
      </div>

      {/* Timeline View - Full Height */}
      <div className="h-[90%] flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p>Loading timeline...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-red-50/50 rounded-xl border border-red-100">
            {error}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            Não há campanhas para mostrar, mô. Cria uma!
          </div>
        ) : (
          // Aqui passamos os dados reais para o componente visual
          // Nota: O TimelineView tem de estar preparado para receber estes dados
          <TimelineView campaigns={campaigns} />
        )}
      </div>
    </div>
  );
}
