import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  ChevronLeft,
  Save,
  AlertTriangle,
  Calendar,
  Type,
  AlignLeft,
  Ban,
  Clock,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

interface CampaignEditForm {
  name: string;
  description: string;
  begin_date: string;
  end_date: string;
  status: string;
}

export default function CampaignDetails() {
  const { id: paramId } = useParams({ from: "/campaigns/$id" });
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignEditForm | null>(null);

  // Ir buscar a campanha à API
  useEffect(() => {
    const realm = (keycloak.tokenParsed as any)?.iss?.split("/realms/")[1];
    if (!realm || !paramId) return;

    const fetchCampaign = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/org-manager/${encodeURIComponent(realm)}/campaigns/${paramId}`,
          {
            headers: {
              Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
            },
          }
        );

        if (!res.ok) throw new Error("Não consegui apanhar a campanha, môço!");

        console.log(res);
        const data = await res.json();
        console.log("Campaign data:", data);

        // Formata as datas para o input type="date" (YYYY-MM-DD)
        const begin = data.begin_date
          ? new Date(data.begin_date).toISOString().split("T")[0]
          : "";
        const end = data.end_date
          ? new Date(data.end_date).toISOString().split("T")[0]
          : "";

        setFormData({
          name: data.name,
          description: data.description || "",
          begin_date: begin,
          end_date: end,
          status: data.status,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [paramId, keycloak.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const realm = (keycloak.tokenParsed as any)?.iss?.split("/realms/")[1];
    setSaving(true);

    try {
      // ATENÇÃO: Precisas de criar este endpoint (PUT) no campaign.py!
      const res = await fetch(
        `${API_BASE}/org-manager/${encodeURIComponent(realm)}/campaigns/${paramId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            begin_date: new Date(formData.begin_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Fogo, deu erro a gravar!");
      }

      // Se correr bem, volta pa casa
      navigate({ to: "/campaigns" });
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p>Aguenta aí que estou a carregar...</p>
        </div>
      </div>
    );

  // A Lógica Algarvia: Se não for "scheduled", ninguém mexe!
  const isEditable = formData?.status === "scheduled";

  return (
    <div className="overflow-y-scroll p-8 space-y-8 font-[Inter,system-ui,sans-serif] min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 animate-[fadeIn_0.5s_ease-out] ">
      <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>

      {/* Header com Navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/campaigns"
            className="p-2.5 rounded-xl bg-white/60 backdrop-blur-md text-slate-500 hover:text-purple-600 hover:bg-white transition-all shadow-sm hover:shadow-md border border-slate-200/60"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {isEditable ? "Editar Campanha" : "Detalhes da Campanha"}
            </h1>
            <p className="text-slate-500 mt-1 text-[14px]">
              {isEditable
                ? "Podes mudar os dados aqui, mas despacha-te."
                : "Só podes ver. Tira as mãos daí!"}
            </p>
          </div>
        </div>
        {formData?.status && (
          <div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium ${
              isEditable
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {isEditable ? <Clock size={16} /> : <Ban size={16} />}
            Status:{" "}
            <span className="uppercase tracking-wide">{formData.status}</span>
          </div>
        )}
      </div>

      {/* Warning Banner se não for editável */}
      {!isEditable && formData && (
        <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4 flex items-start md:items-center gap-3 text-amber-800 shadow-sm animate-pulse">
          <Ban className="text-amber-600 mt-0.5 md:mt-0 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Edição Bloqueada</p>
            <p className="text-[13px] opacity-90">
              Môço, esta campanha já não está agendada. O estado é{" "}
              <strong>{formData.status}</strong>. Só podes editar campanhas que
              ainda estejam em <em>Scheduled</em>.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 shadow-sm">
          <AlertTriangle className="text-rose-600" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Formulário Vidro */}
      <div className="max-w-4xl mx-auto ">
        <div className="  bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-xl shadow-slate-200/40 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 ">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                <Type size={14} className="text-purple-500" />
                Nome da Campanha
              </label>
              <input
                type="text"
                disabled={!isEditable}
                value={formData?.name || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                className="w-full px-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed placeholder:text-slate-400 font-medium text-slate-700"
                placeholder="Ex: Campanha de Phishing Q1"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                <AlignLeft size={14} className="text-purple-500" />
                Descrição
              </label>
              <textarea
                disabled={!isEditable}
                rows={4}
                value={formData?.description || ""}
                onChange={(e) =>
                  setFormData((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
                className="w-full px-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all resize-none disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed placeholder:text-slate-400 text-slate-600"
                placeholder="Escreve aí os detalhes da brincadeira..."
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <Calendar size={14} className="text-purple-500" />
                  Data de Início
                </label>
                <input
                  type="date"
                  disabled={!isEditable}
                  value={formData?.begin_date || ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, begin_date: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                  <Calendar size={14} className="text-purple-500" />
                  Data de Fim
                </label>
                <input
                  type="date"
                  disabled={!isEditable}
                  value={formData?.end_date || ""}
                  onChange={(e) =>
                    setFormData((prev) =>
                      prev ? { ...prev, end_date: e.target.value } : null
                    )
                  }
                  className="w-full px-4 py-3 bg-white/50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-700 font-medium"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/campaigns"
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-sm"
              >
                Cancelar
              </Link>
              {isEditable && (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-95 disabled:opacity-70 disabled:cursor-wait text-sm"
                >
                  {saving ? (
                    "A gravar..."
                  ) : (
                    <>
                      {" "}
                      <Save size={18} /> Gravar Alterações{" "}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
