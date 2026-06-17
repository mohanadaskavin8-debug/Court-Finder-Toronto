import { motion } from "framer-motion"
import { Dribbble } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

export function IntroSplash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.12, filter: "blur(16px)" }}
      transition={{ duration: 0.9, ease: [0.7, 0, 0.84, 0] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#06080b]"
    >
      {/* ambient glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
        className="absolute w-[440px] h-[440px] rounded-full bg-primary/20 blur-[130px]"
      />

      <div className="relative flex flex-col items-center">
        {/* spinning basketball mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative w-20 h-20 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          >
            <Dribbble className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-3xl bg-primary/25 blur-xl -z-10"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        </motion.div>

        {/* wordmark with Apple-style letter-spacing settle */}
        <motion.div
          initial={{ opacity: 0, y: 14, letterSpacing: "0.45em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.06em" }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
          className="text-2xl md:text-3xl font-black text-white pl-[0.06em]"
        >
          COURT FINDER
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold mt-2"
        >
          Toronto · Live
        </motion.div>

        {/* shimmer progress line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 h-px w-40 overflow-hidden bg-white/10 relative"
        >
          <motion.div
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
            initial={{ x: "-120%" }}
            animate={{ x: "240%" }}
            transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
