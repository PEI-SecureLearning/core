import CustomScrollbar from "./reusables/Scrollbar";

// missing the endpoint to get the certificates data

export default function CertificatesList() {
  const certificates = [
    { id: 1, name: 'Certificate number 1', validUntil: '27/08/2026', href: '#' },
    { id: 2, name: 'Certificate number 2', validUntil: '15/03/2027', href: '#' },
    { id: 3, name: 'Certificate number 3', validUntil: '10/11/2026', href: '#' },
    { id: 4, name: 'Certificate number 4', validUntil: '22/06/2028', href: '#' },
    { id: 5, name: 'Certificate number 5', validUntil: '22/06/2028', href: '#' }
  ];

  return (
    <div className="w-1/2 bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your certificates</h2>
      
      <CustomScrollbar maxHeight="16rem">
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div 
              key={cert.id}
              className="bg-gray-50 rounded-lg p-4 flex justify-between items-start"
            >
              <a
                href={cert.href}
                className="text-gray-900 font-medium hover:text-purple-600 transition-colors"
              >
                {cert.name}
              </a>
              <span className="text-purple-600 text-sm font-medium whitespace-nowrap ml-4">
                Valid until: {cert.validUntil}
              </span>
            </div>
          ))}
        </div>
      </CustomScrollbar>
    </div>
  );
}