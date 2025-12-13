import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { Loader2 } from "lucide-react";

// Componentes Visuais (Reutilizamos os do 'new' porque são iguais!)
import ProfileBasicInfo from "@/components/sending-profiles/new/ProfileBasicInfo";
import ProfileSmtpConfig from "@/components/sending-profiles/new/ProfileSmtpConfig";
import CustomHeadersSection from "@/components/sending-profiles/new/CustomHeadersSection";
import ProfilePreview from "@/components/sending-profiles/new/ProfilePreview";

// Footer Novo (Específico para Edição)
import EditProfileFooter from "@/components/sending-profiles/id/EditProfileFooter";

// API e Tipos
import {
  fetchSendingProfileById,
  updateSendingProfile,
  deleteSendingProfile,
} from "@/services/sendingProfilesApi";
import {
  type SendingProfileCreate,
  type CustomHeader,
} from "@/types/sendingProfile";

export default function EditSendingProfile() {
  const navigate = useNavigate();
  // Se usares outra versão do router, o useParams pode vir de outro lado
  const { id: paramId } = useParams({ from: "/sending-profiles/$id" });
  const profileId = Number(paramId);

  const { keycloak } = useKeycloak();

  // --- Realm ---
  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  // --- Estados do Formulário ---
  const [name, setName] = useState("");
  const [fromFname, setFromFname] = useState("");
  const [fromLname, setFromLname] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // Nota: A password pode vir vazia do backend por segurança

  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([]);

  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // --- Carregar Dados Iniciais ---
  useEffect(() => {
    if (!realm || !profileId) return;

    const loadProfile = async () => {
      try {
        setIsFetching(true);
        const data = await fetchSendingProfileById(
          realm,
          profileId,
          keycloak.token
        );

        // Preencher o formulário
        setName(data.name);
        setFromFname(data.from_fname);
        setFromLname(data.from_lname);
        setFromEmail(data.from_email);
        setSmtpHost(data.smtp_host);
        setSmtpPort(data.smtp_port);
        setUsername(data.username);
        // A password normalmente não vem do backend por segurança.
        // Se vier, preenchemos. Se não, o user tem de meter nova se quiser mudar.
        setPassword(data.password || "");

        if (data.custom_headers) {
          setCustomHeaders(data.custom_headers);
        }
      } catch (err) {
        console.error(err);
        setStatus("Failed to load profile data.");
      } finally {
        setIsFetching(false);
      }
    };

    loadProfile();
  }, [realm, profileId, keycloak.token]);

  // --- Handlers de Headers ---
  const addHeader = useCallback((header: CustomHeader) => {
    setCustomHeaders((prev) => [...prev, header]);
  }, []);

  const removeHeader = useCallback((index: number) => {
    setCustomHeaders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Update (PUT) ---
  const handleSave = async () => {
    if (!realm) return;

    // Validação simples
    if (!name || !fromEmail || !smtpHost || !username) {
      setStatus("Please fill in required fields.");
      return;
    }

    setIsSaving(true);
    setStatus(null);

    const payload: SendingProfileCreate = {
      name,
      from_fname: fromFname,
      from_lname: fromLname,
      from_email: fromEmail,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      username,
      password, // Envia a password (nova ou antiga)
      custom_headers: customHeaders.map((h) => ({
        name: h.name,
        value: h.value,
      })),
    };

    try {
      await updateSendingProfile(realm, profileId, payload, keycloak.token);
      setStatus("Profile updated successfully!");

      // Feedback visual antes de sair (opcional)
      setTimeout(() => {
        navigate({ to: "/sending-profiles" });
      }, 800);
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;

    try {
      setIsSaving(true); // Bloqueia botões
      await deleteSendingProfile(realm, profileId, keycloak.token);
      navigate({ to: "/sending-profiles" });
    } catch (err) {
      setStatus("Failed to delete profile.");
      setIsSaving(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass-container h-full w-full animate-fade-in relative overflow-hidden">
      {/* Blobs (Mesmo tema Azul) */}
      <div className="liquid-blob liquid-blob-1 bg-blue-400"></div>
      <div className="liquid-blob liquid-blob-2 bg-indigo-400"></div>
      <div className="liquid-blob liquid-blob-3 bg-cyan-400"></div>

      {/* Header */}
      <div className="liquid-glass-header flex-shrink-0 border-b border-white/20 py-3 px-6 animate-slide-down">
        <h3 className="text-xl font-semibold text-gray-800 tracking-tight">
          Edit Profile: {name}
        </h3>
        <h2 className="text-sm font-medium text-gray-600">
          Update identity and SMTP settings
        </h2>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* Formulários (Reutilizados) */}
        <div className="h-full w-full lg:w-[65%] purple-scrollbar overflow-y-auto pr-2 space-y-5">
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <ProfileBasicInfo
              name={name}
              setName={setName}
              fromFname={fromFname}
              setFromFname={setFromFname}
              fromLname={fromLname}
              setFromLname={setFromLname}
              fromEmail={fromEmail}
              setFromEmail={setFromEmail}
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <ProfileSmtpConfig
              host={smtpHost}
              setHost={setSmtpHost}
              port={smtpPort}
              setPort={setSmtpPort}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
            />
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CustomHeadersSection
              headers={customHeaders}
              onAddHeader={addHeader}
              onRemoveHeader={removeHeader}
            />
          </div>
        </div>

        {/* Preview (Reutilizado) */}
        <div
          className="h-full w-full lg:w-[35%] animate-slide-left overflow-hidden"
          style={{ animationDelay: "0.1s" }}
        >
          <ProfilePreview
            name={name}
            fromEmail={fromEmail}
            smtpHost={smtpHost}
            smtpPort={smtpPort}
            headerCount={customHeaders.length}
          />
        </div>
      </div>

      {/* Footer de Edição */}
      <div
        className="liquid-glass-footer flex-shrink-0 border-t border-white/20 py-4 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <EditProfileFooter
          onSave={handleSave}
          onDelete={handleDelete}
          isValid={!!name && !!fromEmail && !!smtpHost && !!username} // Password pode ser opcional na edição dependendo da tua lógica
          isLoading={isSaving}
          status={status}
        />
      </div>
    </div>
  );
}
