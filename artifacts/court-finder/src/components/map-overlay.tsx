import { motion } from "framer-motion"
import { Dribbble } from "lucide-react"

const COURT_TYPES = [
  { label: "Park", color: "#00ff66" },
  { label: "School", color: "#ff9900" },
  { label: "Community Centre", color: "#ff0055" },
]

const EASE = [0.16, 1, 0.3, 1] as const

export function MapOverlay() {
  return (
    <>
      {/* Brand wordmark */}
      <motion.div
        initial={{ opacity: 0, x: -24, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        className="fixed top-4 left-4 z-40 pointer-events-none"
      >
        <div className="flex items-center gap-3 bg-background/70 backdrop-blur-xl border border-white/10 rounded-2xl pl-2.5 pr-4 py-2 shadow-2xl">
          <div className="relative w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, ease: "linear", repeat: Infinity }}
            >
              <Dribbble className="w-5 h-5 text-primary" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary/25 blur-md -z-10"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-black text-white tracking-tight">COURT FINDER</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
              Toronto · Live
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status legend */}
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-3 md:left-4 z-40 pointer-events-none"
      >
        <div className="bg-background/70 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 shadow-2xl">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Court Type</div>
          <div className="flex flex-col gap-1.5">
            {COURT_TYPES.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}
                />
                <span className="text-xs text-white/80 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}
