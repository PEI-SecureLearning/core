import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";

// Componentes Visuais
import ProfileBasicInfo from "@/components/sending-profiles/new/ProfileBasicInfo";
import ProfileSmtpConfig from "@/components/sending-profiles/new/ProfileSmtpConfig";
import CustomHeadersSection from "@/components/sending-profiles/new/CustomHeadersSection";
import ProfilePreview from "@/components/sending-profiles/new/ProfilePreview";
import ProfileFooter from "@/components/sending-profiles/new/ProfileFooter";

// API e Tipos
import { createSendingProfile } from "@/services/sendingProfilesApi";
import {
  type SendingProfileCreate,
  type CustomHeader,
} from "@/types/sendingProfile";

export default function NewSendingProfile() {
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();

  // --- 1. Sacar o Realm do Token (A tal lógica "marafada") ---
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
  const [password, setPassword] = useState("");

  const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([]);

  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Handlers de Headers ---
  const addHeader = useCallback((header: CustomHeader) => {
    setCustomHeaders((prev) => [...prev, header]);
  }, []);

  const removeHeader = useCallback((index: number) => {
    setCustomHeaders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Handler de Submit (A Integração da API) ---
  const handleSubmit = async () => {
    // 1. Validação Básica
    if (!realm) {
      setStatus("Error: Could not determine Realm. Are you logged in?");
      return;
    }

    if (!name || !fromEmail || !smtpHost || !username || !password) {
      setStatus("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setStatus(null);

    // 2. Preparar o Payload
    const payload: SendingProfileCreate = {
      name,
      from_fname: fromFname,
      from_lname: fromLname,
      from_email: fromEmail,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      username,
      password,
      custom_headers: customHeaders.map((h) => ({
        name: h.name,
        value: h.value,
      })), // Garante formato limpo
    };

    try {
      // 3. Chamar a API (Aqui é que a magia acontece!)
      await createSendingProfile(realm, payload, keycloak.token);

      setStatus("Profile created successfully!");

      // Redirecionar após sucesso
      setTimeout(() => {
        navigate({ to: "/sending-profiles" });
      }, 1000);
    } catch (err: any) {
      console.error(err);
      // Se a API mandar uma mensagem de erro, mostramos essa.
      setStatus(err.message || "Failed to create profile. Check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="liquid-glass-container h-full w-full animate-fade-in relative overflow-hidden">
      {/* Background Blobs (Tema Azul para Perfis) */}
      <div className="liquid-blob liquid-blob-1 bg-blue-400"></div>
      <div className="liquid-blob liquid-blob-2 bg-indigo-400"></div>
      <div className="liquid-blob liquid-blob-3 bg-cyan-400"></div>

      {/* Cabeçalho */}
      <div className="liquid-glass-header flex-shrink-0 border-b border-white/20 py-3 px-6 animate-slide-down">
        <h3 className="text-xl font-semibold text-gray-800 tracking-tight">
          New Sending Profile
        </h3>
        <h2 className="text-sm font-medium text-gray-600">
          Configure identity and SMTP settings
        </h2>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* Coluna Esquerda: Formulários */}
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

        {/* Coluna Direita: Preview */}
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

      {/* Rodapé com Botões */}
      <div
        className="liquid-glass-footer flex-shrink-0 border-t border-white/20 py-4 animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <ProfileFooter
          onSubmit={handleSubmit}
          isValid={
            !!name && !!fromEmail && !!smtpHost && !!username && !!password
          }
          isLoading={isLoading}
          status={status}
        />
      </div>
    </div>
  );
}
