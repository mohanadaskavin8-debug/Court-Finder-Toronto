import { Court } from "@workspace/api-client-react"
import { getTypeColor, getTypeHex, getTypeLabel } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MapPin, Landmark, X } from "lucide-react"

interface CourtPanelProps {
  court: Court | null
  onClose: () => void
}

export function CourtPanel({ court, onClose }: CourtPanelProps) {
  if (!court) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none md:top-0 md:bottom-auto md:left-4 md:right-auto md:w-96 md:h-screen md:p-0 md:flex md:items-center">
      <div className="bg-card/95 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-6 pointer-events-auto relative overflow-hidden flex flex-col gap-5 w-full">
        {/* Glow behind */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: getTypeHex(court.courtType) }}
        />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-3 ${getTypeColor(court.courtType)}`}>
              {getTypeLabel(court.courtType)}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">{court.name}</h2>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <Landmark className="w-3 h-3 mr-1 shrink-0" />
              {court.neighborhood}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0 -mr-2 -mt-2 w-11 h-11 text-white/50 hover:text-white"
            onClick={onClose}
            aria-label="Close court details"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Address */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5 relative z-10">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: getTypeHex(court.courtType) }} />
          <div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-0.5">Address</span>
            <span className="text-sm font-bold text-white">{court.address}</span>
          </div>
        </div>

        {court.courtType === "school" && (
          <p className="text-xs text-muted-foreground relative z-10 -mt-2">
            School courts are estimated from school grounds and may not be publicly accessible or verified.
          </p>
        )}
      </div>
    </div>
  )
}
