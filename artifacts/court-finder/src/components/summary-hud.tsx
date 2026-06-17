import { useGetCourtsSummary } from "@workspace/api-client-react"
import { Activity, Users, MapPin } from "lucide-react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect } from "react"

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

  if (isLoading || !summary) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-xl px-4"
    >
      <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-2xl pointer-events-auto overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-60" />
        <div className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />

        <div className="relative flex flex-col items-center flex-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Total Players</span>
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            <span className="text-2xl font-black tabular-nums"><CountUp value={summary.totalPlayers} /></span>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10" />

        <div className="relative flex flex-col items-center flex-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Courts</span>
          <div className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-[#00ff66]" />
            <span className="text-2xl font-black tabular-nums">
              <CountUp value={summary.activeCourts} />
              <span className="text-muted-foreground text-sm font-medium">/{summary.totalCourts}</span>
            </span>
          </div>
        </div>

        <div className="w-px h-10 bg-white/10" />

        <div className="relative flex flex-col items-center flex-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Needing Players</span>
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5 text-[#ff9900]" />
            <span className="text-2xl font-black tabular-nums"><CountUp value={summary.courtsNeedingPlayers} /></span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
