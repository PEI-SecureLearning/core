import { useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { Loader2 } from "lucide-react";

// TENS DE CRIAR ESTES COMPONENTES DEPOIS (Explico abaixo)
import SendingProfilesHeader from "@/components/sending-profiles/SendingProfilesHeader";
import SendingProfilesGrid from "@/components/sending-profiles/SendingProfilesGrid";
import SendingProfilesTable from "@/components/sending-profiles/SendingProfilesTable";

import {
  fetchSendingProfiles,
  deleteSendingProfile,
} from "@/services/sendingProfilesApi";
import { type SendingProfileDisplayInfo } from "@/types/sendingProfile";

export default function SendingProfilesPage() {
  const { keycloak } = useKeycloak();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [profiles, setProfiles] = useState<SendingProfileDisplayInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. Sacar o Realm do Token (A tua lógica "marafada") ---
  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  // --- 2. Carregar a "Mercadoria" ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Aqui não precisas do Promise.all marado dos grupos,
      // porque o perfil já traz tudo o que precisas. É mais leve!
      const data = await fetchSendingProfiles(
        realm,
        keycloak.token || undefined
      );
      setProfiles(data);
    } catch (err) {
      console.error("Deu sarilho ao carregar os perfis", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. O "Arranco" Inicial ---
  useEffect(() => {
    if (realm) {
      loadData();
    }
  }, [realm]);

  // --- 4. Função de Apagar ---
  const handleDelete = async (id: number) => {
    if (!realm) return;
    const confirmed = window.confirm(
      "Tens a certeza, mô? Vais apagar este perfil para sempre!"
    );
    if (!confirmed) return;

    try {
      await deleteSendingProfile(realm, id, keycloak.token || undefined);
      // Recarrega a lista para ficar tudo atualizado
      loadData();
    } catch (err) {
      console.error("Não deu para apagar o perfil", err);
      alert("Erro ao apagar. Vê lá se o servidor não está de folga.");
    }
  };

  return (
    <div className="h-full w-full animate-[fadeIn_0.4s_ease-out]">
      {/* Mantivemos os teus estilos de animação */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDelay {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* --- O Cabeçalho (Header) --- */}
      <div className="h-1/12 w-full border-b flex items-center px-4 font-semibold text-lg">
        <SendingProfilesHeader view={view} setView={setView} />
      </div>

      {/* --- O Conteúdo (Grid ou Tabela) --- */}
      <div
        className="h-11/12 w-full overflow-y-auto p-4 space-y-4"
        style={{ animation: "fadeInDelay 0.5s ease-out 0.1s both" }}
      >
        {view === "grid" ? (
          <SendingProfilesGrid
            profiles={profiles}
            isLoading={isLoading && !profiles.length}
            onDelete={handleDelete}
          />
        ) : (
          <SendingProfilesTable profiles={profiles} onDelete={handleDelete} />
        )}

        {/* Loading State do Realm */}
        {!realm && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />A descobrir em que Realm
            estamos...
          </div>
        )}
      </div>
    </div>
  );
}
