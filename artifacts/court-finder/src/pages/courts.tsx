import { useState } from "react"
import { useListCourts } from "@workspace/api-client-react"
import { SummaryHUD } from "@/components/summary-hud"
import { Link } from "wouter"
import { Map as MapIcon, Users } from "lucide-react"
import { getCourtStatus, getStatusColor } from "@/lib/utils"

export default function CourtsList() {
  const { data: courts, isLoading } = useListCourts()
  const [filter, setFilter] = useState("All")
  const [district, setDistrict] = useState("All")

  if (isLoading || !courts) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const districts = ["All", ...Array.from(new Set(courts.map(c => c.neighborhood))).sort()]

  const filteredCourts = courts.filter(court => {
    const statusOk = filter === "All" || getCourtStatus(court) === filter
    const districtOk = district === "All" || court.neighborhood === district
    return statusOk && districtOk
  })

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-4 md:px-8">
      <SummaryHUD />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Toronto Courts</h1>
            <p className="text-muted-foreground mt-1 font-medium">{filteredCourts.length} courts citywide</p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {["All", "Open", "Filling Up", "Full"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {districts.map(d => (
            <button
              key={d}
              onClick={() => setDistrict(d)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border ${
                district === d
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-white/5 text-muted-foreground border-white/10 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court, i) => {
            const status = getCourtStatus(court)
            return (
              <div 
                key={court.id} 
                className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 hover:border-primary/50 transition-colors"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: "both" }}
              >
                <div className="flex justify-between items-start">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(status)}`}>
                    {status}
                  </div>
                  <div className="text-muted-foreground text-sm flex items-center bg-white/5 px-2 py-1 rounded-md">
                    <Users className="w-3 h-3 mr-1.5" />
                    <span className="font-mono">{court.currentPlayers}/{court.maxPlayers}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold leading-tight mb-1">{court.name}</h3>
                  <p className="text-muted-foreground text-sm">{court.neighborhood}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-bold block mb-1">Needed</span>
                    <span className="text-xl font-black">{court.playersNeeded}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-bold block mb-1">Type</span>
                    <span className="text-sm font-bold capitalize">{court.courtType}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/25 transition-all hover:scale-105 active:scale-95">
          <MapIcon className="w-5 h-5" />
          Map View
        </Link>
      </div>
    </div>
  )
}
