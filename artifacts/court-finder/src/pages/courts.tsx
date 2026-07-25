import { useState } from "react"
import { useListCourts } from "@workspace/api-client-react"
import { SummaryHUD } from "@/components/summary-hud"
import { Link } from "wouter"
import { Map as MapIcon, MapPin } from "lucide-react"
import { COURT_TYPES, getTypeColor, getTypeLabel } from "@/lib/utils"

export default function CourtsList() {
  const { data: courts, isLoading } = useListCourts()
  const [typeFilter, setTypeFilter] = useState("All")
  const [district, setDistrict] = useState("All")

  if (isLoading || !courts) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const districts = ["All", ...Array.from(new Set(courts.map(c => c.neighborhood))).sort()]

  const filteredCourts = courts.filter(court => {
    const typeOk = typeFilter === "All" || court.courtType === typeFilter
    const districtOk = district === "All" || court.neighborhood === district
    return typeOk && districtOk
  })

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 md:pt-32 pb-32 md:pb-24 px-4 md:px-8">
      <SummaryHUD />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Toronto Courts</h1>
            <p className="text-muted-foreground mt-1 font-medium">{filteredCourts.length} courts citywide</p>
            <p className="text-muted-foreground/70 text-xs mt-1">School courts are estimated from school grounds — not verified by the City.</p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
            {[{ type: "All", label: "All" }, ...COURT_TYPES].map(f => (
              <button
                key={f.type}
                onClick={() => setTypeFilter(f.type)}
                className={`shrink-0 px-3 md:px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${
                  typeFilter === f.type
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {districts.map(d => (
            <button
              key={d}
              onClick={() => setDistrict(d)}
              className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border ${
                district === d
                  ? "bg-primary text-primary-foreground border-primary shadow-lg"
                  : "bg-white/5 text-muted-foreground border-white/10 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredCourts.map((court, i) => (
            <div
              key={court.id}
              className="bg-card border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-8 hover:border-primary/50 transition-colors"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: "both" }}
            >
              <div className={`self-start inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getTypeColor(court.courtType)}`}>
                {getTypeLabel(court.courtType)}
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-bold leading-tight mb-1">{court.name}</h3>
                <p className="text-muted-foreground text-sm">{court.neighborhood}</p>
              </div>

              <div className="mt-auto pt-3 border-t border-white/10 flex items-center text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {court.address}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 md:right-6 z-50">
        <Link href="/" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/25 transition-all hover:scale-105 active:scale-95">
          <MapIcon className="w-5 h-5" />
          Map View
        </Link>
      </div>
    </div>
  )
}
