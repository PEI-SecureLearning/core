import { createFileRoute } from '@tanstack/react-router'
import ComplianceAgreement from '@/components/Compliance';

export const Route = createFileRoute('/')({
  component: Index,
})


function Index() {

  return (
    <div>
      <div>
        <b>boas pessoal</b>
      </div>
      <div className="container mx-auto py-8 px-4">        
          <ComplianceAgreement></ComplianceAgreement>
      </div>
    </div>

  )
}
