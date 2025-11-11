import { useState } from 'react';
import { X, FileText, Check, Sparkles } from 'lucide-react';

// Types
interface ComplianceAgreementProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAccept?: () => void;
  title?: string;
  subtitle?: string;
  terms?: string | React.ReactNode;
  checkboxLabel?: string;
  acceptButtonText?: string;
  successTitle?: string;
  successMessage?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function PDFViewer() {
  return (
    <iframe
      src="../../public/compliance.pdf"
      width="100%"
      height="100%"
      title="PDF Viewer"
    />
  );
}

// Modal Overlay Component
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div 
      className="h-full w-full fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// Modal Container Component
function ModalContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[95dvh] w-[70dvw] bg-white rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50 -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-300 rounded-full blur-3xl opacity-40 -ml-20 -mb-20" />
      <div className="relative">{children}</div>
    </div>
  );
}

// Header Component
function ModalHeader({ 
  title, 
  subtitle, 
  icon: Icon = FileText, 
  onClose 
}: { 
  title: string; 
  subtitle: string; 
  icon?: React.ComponentType<{ className?: string }>; 
  onClose: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-6 py-4 z-10 relative overflow-hidden">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3 relative">
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-purple-100 text-sm">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// Terms Content Component
function TermsContent() {
  return (
    <div className="h-[77%] bg-purple-50 rounded-2xl p-2 overflow-y-auto border border-purple-100">
      <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2 text-base sm:text-m md:text-lg lg:text-lg">
        <Sparkles className="w-5 h-5" />
        Terms & Conditions
      </h3>
      <div className="h-[100%] text-sm text-purple-800 space-y-2 leading-relaxed">
        <PDFViewer></PDFViewer>
      </div>
    </div>
  );
}

// Checkbox Component
function AgreementCheckbox({ 
  checked, 
  onChange, 
  label 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label: string;
}) {
  return (
    <label className="py-1 flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-6 h-6 rounded-lg border-2 transition-all ${
            checked
              ? 'bg-purple-600 border-purple-600'
              : 'bg-white border-purple-300 group-hover:border-purple-400'
          }`}
        >
          {checked && (
            <Check className="w-4 h-4 text-white m-0.5" strokeWidth={3} />
          )}
        </div>
      </div>
      <span className="text-m text-gray-700 leading-relaxed">{label}</span>
    </label>
  );
}

// Accept Button Component
function AcceptButton({ 
  onClick, 
  disabled, 
  children 
}: { 
  onClick: () => void; 
  disabled: boolean; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all transform ${
        !disabled
          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
      }`}
    >
      {children}
    </button>
  );
}


// Success State Component
function SuccessState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-8 text-center space-y-4">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full">
        <Check className="w-10 h-10 text-white" strokeWidth={3} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-purple-900 mb-1">{title}</h3>
        <p className="text-purple-600">{message}</p>
      </div>
    </div>
  );
}

// Main Component
export default function Index({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onAccept: controlledOnAccept,
  title = "Compliance Agreement",
  subtitle = "Please review and accept",
  terms,
  checkboxLabel = "I have read and agree to the compliance terms and conditions",
  acceptButtonText = "Accept & Continue",
  successTitle = "All Set! ✨",
  successMessage = "Thank you for accepting our terms",
  icon = FileText,
}: ComplianceAgreementProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = controlledOnClose || setInternalIsOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleAccept = () => {
    if (isChecked) {
      setIsAccepted(true);
      if (controlledOnAccept) {
        controlledOnAccept();
      }
      setTimeout(() => handleClose(), 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={handleClose}>
      <ModalContainer>
        <ModalHeader 
          title={title} 
          subtitle={subtitle} 
          icon={icon}
          onClose={handleClose} 
        />
        
        {!isAccepted ? (
          <div className="h-[84dvh] p-2 space-y-6">
            <TermsContent>
            </TermsContent>
            
            <div className='h-[23%]'>
              <AgreementCheckbox
                checked={isChecked}
                onChange={setIsChecked}
                label={checkboxLabel}
              />

              <AcceptButton onClick={handleAccept} disabled={!isChecked}>
                {acceptButtonText}
              </AcceptButton>
            </div>

          </div>
        ) : (
          <SuccessState title={successTitle} message={successMessage} />
        )}
      </ModalContainer>
    </ModalOverlay>
  );
}