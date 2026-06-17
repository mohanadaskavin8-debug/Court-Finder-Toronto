import { useState } from "react"
import { useListCourts, Court } from "@workspace/api-client-react"
import { CourtMap } from "@/components/court-map"
import { SummaryHUD } from "@/components/summary-hud"
import { CourtPanel } from "@/components/court-panel"
import { Link } from "wouter"
import { List } from "lucide-react"

export default function Home() {
  const { data: courts, isLoading } = useListCourts()
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)

  if (isLoading || !courts) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <SummaryHUD />
      
      <CourtMap 
        courts={courts} 
        selectedCourtId={selectedCourt?.id || null}
        onSelectCourt={setSelectedCourt} 
      />
      
      <CourtPanel 
        court={selectedCourt} 
        onClose={() => setSelectedCourt(null)} 
      />

      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/courts" className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/25 transition-all hover:scale-105 active:scale-95">
          <List className="w-5 h-5" />
          List View
        </Link>
      </div>
    </div>
  )
}
