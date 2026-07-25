import { useGetCourtsSummary } from "@workspace/api-client-react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useRef } from "react"

function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, mv])
  return <motion.span>{text}</motion.span>
}

export function SummaryHUD() {
  const { data: summary, isLoading } = useGetCourtsSummary()
  const ref = useRef<HTMLDivElement>(null)

  // Publish the HUD's real height as a CSS variable so other fixed overlays
  // (e.g. the wordmark badge on mobile) can position themselves below it
  // even when text scaling or content changes make the HUD taller.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => document.documentElement.style.setProperty("--hud-height", `${el.offsetHeight}px`)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty("--hud-height")
    }
  }, [summary])

  if (isLoading || !summary) return null

  const stats = [
    { label: "Courts", value: summary.totalCourts, color: "#22d3ee" },
    { label: "Parks", value: summary.parkCourts, color: "#00ff66" },
    { label: "Schools", value: summary.schoolCourts, color: "#ff9900" },
    { label: "Comm. Centres", value: summary.communityCourts, color: "#ff0055" },
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-xl px-3 md:px-4"
    >
      <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl flex items-center justify-between shadow-2xl pointer-events-auto overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-60" />
        <div className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        {stats.map((s, i) => (
          <div key={s.label} className="relative flex items-center flex-1">
            {i > 0 && <div className="w-px h-8 md:h-10 bg-white/10 mr-2 md:mr-0" />}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5 md:mb-1 truncate max-w-full">
                {s.label}
              </span>
              <span className="text-lg md:text-2xl font-black tabular-nums" style={{ color: s.color }}>
                <CountUp value={s.value} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
