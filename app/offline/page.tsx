import { WifiOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Offline() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="w-24 h-24 mx-auto bg-white/50 rounded-2xl backdrop-blur-sm border flex items-center justify-center shadow-xl">
          <WifiOff className="w-12 h-12 text-slate-400" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-slate-900">You're Offline</h1>
          <p className="text-slate-600">
            Your dashboard data is cached locally. 
            Connect to internet to sync latest expenses and invoices.
          </p>
        </div>
        
        <Button 
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold shadow-lg"
          onClick={() => window.location.reload()}
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Retry Connection
        </Button>
      </div>
    </div>
  )
}
