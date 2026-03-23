import { Eye, AlertTriangle, Link as LinkIcon, ShieldCheck } from 'lucide-react'

export function SimulationOops() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 relative z-10">

        {/* Simplified Header */}
        <div className="bg-amber-50 p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            Wait! That was a simulation.
          </h1>
          <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
            You just fell for a simulated phishing attack. Don't worry, your account is safe. This is how we help you stay sharp!
          </p>
        </div>

        {/* Skimmable Red Flags */}
        <div className="px-10 pb-10 pt-5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 text-center">
            3 Red Flags to Watch For:
          </h2>

          <div className="grid grid-cols-1 gap-8">
            {/* Flag 1 */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Check the Sender</h3>
                <p className="text-sm text-slate-500 leading-snug">Always verify the actual email address, not just the display name.</p>
              </div>
            </div>

            {/* Flag 2 */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <LinkIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Hover Before Clicking</h3>
                <p className="text-sm text-slate-500 leading-snug">Hover over links to see their real destination before you click.</p>
              </div>
            </div>

            {/* Flag 3 */}
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Spot the Urgency</h3>
                <p className="text-sm text-slate-500 leading-snug">Be wary of "immediate action" requests that create fear or panic.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-10 py-5 text-center text-xs font-medium text-slate-400 border-t border-slate-100">
          Learning keeps us safe. Treat this as a learning opportunity.
        </div>
      </div>

      <div className="absolute bottom-8 text-center text-slate-400 text-xs">
        &copy; SecureLearning {new Date().getFullYear()}. All rights reserved.
      </div>
    </div>
  )
}
