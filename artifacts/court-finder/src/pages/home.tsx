import { useState, useEffect } from "react"
import { useListCourts, Court } from "@workspace/api-client-react"
import { AnimatePresence } from "framer-motion"
import { CourtMap } from "@/components/court-map"
import { SummaryHUD } from "@/components/summary-hud"
import { MapOverlay } from "@/components/map-overlay"
import { AiPromptBar } from "@/components/ai-prompt-bar"
import { CourtPanel } from "@/components/court-panel"
import { IntroSplash } from "@/components/intro-splash"
import { Link } from "wouter"
import { List } from "lucide-react"

export default function Home() {
  const { data: courts, isLoading, isError } = useListCourts()
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 2400)
    return () => clearTimeout(t)
  }, [])

  const ready = !!courts && !isLoading
  // Never trap the user behind the splash if the API fails.
  const showIntro = !isError && (!ready || !minElapsed)

  if (isError && !courts) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#06080b] text-center p-8">
        <div className="max-w-sm">
          <p className="text-white font-bold text-lg">Couldn't load courts</p>
          <p className="text-muted-foreground text-sm mt-2">
            We couldn't reach the server. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Map mounts (and begins its cinematic intro) behind the splash */}
      {courts && (
        <CourtMap
          courts={courts}
          selectedCourtId={selectedCourt?.id ?? null}
          onSelectCourt={setSelectedCourt}
        />
      )}

      {/* Overlays reveal once the intro clears */}
      {!showIntro && (
        <>
          <div className="pointer-events-none fixed inset-0 z-30 [background:radial-gradient(ellipse_at_center,transparent_58%,rgba(0,0,0,0.55)_100%)]" />
          <SummaryHUD />
          <MapOverlay />
          <AiPromptBar />
          <div className="fixed bottom-6 right-6 z-50">
            <Link
              href="/courts"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold uppercase tracking-wider shadow-lg hover:shadow-primary/25 transition-all hover:scale-105 active:scale-95"
            >
              <List className="w-5 h-5" />
              List View
            </Link>
          </div>
        </>
      )}

      <CourtPanel court={selectedCourt} onClose={() => setSelectedCourt(null)} />

      <AnimatePresence>{showIntro && <IntroSplash key="intro" />}</AnimatePresence>
    </div>
  )
}
