import { Court, useUpdateCourtPlayers, getListCourtsQueryKey, getGetCourtsSummaryQueryKey } from "@workspace/api-client-react"
import { getCourtStatus, getStatusColor, getStatusGlow } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Lightbulb, Activity, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface CourtPanelProps {
  court: Court | null
  onClose: () => void
}

export function CourtPanel({ court, onClose }: CourtPanelProps) {
  const queryClient = useQueryClient()
  const updatePlayers = useUpdateCourtPlayers()
  
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [playersNeeded, setPlayersNeeded] = useState(0)

  useEffect(() => {
    if (court) {
      setCurrentPlayers(court.currentPlayers)
      setPlayersNeeded(court.playersNeeded)
    }
  }, [court])

  if (!court) return null

  const status = getCourtStatus({ ...court, currentPlayers, playersNeeded })
  const statusColorClass = getStatusColor(status)
  
  const handleUpdate = () => {
    updatePlayers.mutate(
      { params: { id: court.id }, data: { currentPlayers, playersNeeded } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCourtsQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetCourtsSummaryQueryKey() })
          toast.success("Court status updated!")
          onClose()
        },
        onError: () => {
          toast.error("Failed to update court status.")
        }
      }
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] p-4 pointer-events-none md:top-0 md:bottom-auto md:left-4 md:right-auto md:w-96 md:h-screen md:p-0 md:flex md:items-center">
      <div className="bg-card/95 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl p-6 pointer-events-auto relative overflow-hidden flex flex-col gap-6 transform transition-all duration-300 w-full">
        {/* Glow behind */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 transition-colors duration-500`} style={{ backgroundColor: getStatusColor(status).split('-')[1]?.replace(']', '') || '#fff' }} />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-3 ${statusColorClass}`}>
              {status}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{court.name}</h2>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {court.neighborhood}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 -mr-2 -mt-2 text-white/50 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Type</span>
            <span className="text-sm font-bold text-white capitalize">{court.courtType}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Lights</span>
            <div className="flex items-center text-sm font-bold text-white">
              <Lightbulb className={`w-4 h-4 mr-1.5 ${court.hasLights ? 'text-yellow-400' : 'text-white/30'}`} />
              {court.hasLights ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Update Controls */}
        <div className="space-y-4 relative z-10 mt-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <Activity className="w-4 h-4 mr-2 text-primary" />
            Update Status
          </h3>
          
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Current Players</span>
                <span className="text-xs text-muted-foreground">People at the court</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1 border border-white/10">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setCurrentPlayers(Math.max(0, currentPlayers - 1))}>-</Button>
                <span className="text-lg font-black w-6 text-center tabular-nums">{currentPlayers}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setCurrentPlayers(Math.min(court.maxPlayers, currentPlayers + 1))}>+</Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Players Needed</span>
                <span className="text-xs text-muted-foreground">For a full game</span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1 border border-white/10">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setPlayersNeeded(Math.max(0, playersNeeded - 1))}>-</Button>
                <span className="text-lg font-black w-6 text-center tabular-nums">{playersNeeded}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => setPlayersNeeded(playersNeeded + 1)}>+</Button>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-base font-bold tracking-wide uppercase mt-4" 
            onClick={handleUpdate}
            disabled={updatePlayers.isPending}
          >
            {updatePlayers.isPending ? "Updating..." : "Broadcast Status"}
          </Button>
        </div>
      </div>
    </div>
  )
}
