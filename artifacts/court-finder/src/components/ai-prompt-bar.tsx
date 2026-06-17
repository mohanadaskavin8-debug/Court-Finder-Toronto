import { useState, type ReactNode } from "react"
import {
  useAiUpdateCourt,
  getListCourtsQueryKey,
  getGetCourtsSummaryQueryKey,
  type AiCourtUpdateResult,
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, CornerDownLeft, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

type Feedback = {
  tone: "success" | "warning" | "error"
  message: string
  candidates?: string[]
}

function resultToFeedback(result: AiCourtUpdateResult): Feedback {
  if (result.status === "updated") {
    return { tone: "success", message: result.message }
  }
  if (result.status === "ambiguous") {
    return { tone: "warning", message: result.message, candidates: result.candidates }
  }
  // not_found | no_change
  return { tone: "warning", message: result.message }
}

export function AiPromptBar() {
  const queryClient = useQueryClient()
  const aiUpdate = useAiUpdateCourt()
  const [prompt, setPrompt] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const submit = () => {
    const trimmed = prompt.trim()
    if (!trimmed || aiUpdate.isPending) return
    setFeedback(null)
    aiUpdate.mutate(
      { data: { prompt: trimmed } },
      {
        onSuccess: (result) => {
          setFeedback(resultToFeedback(result))
          if (result.status === "updated") {
            queryClient.invalidateQueries({ queryKey: getListCourtsQueryKey() })
            queryClient.invalidateQueries({ queryKey: getGetCourtsSummaryQueryKey() })
            setPrompt("")
          }
        },
        onError: (err) => {
          const data =
            err && typeof err === "object" && "data" in err
              ? (err as { data?: unknown }).data
              : undefined
          const message =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Something went wrong. Please try again."
          setFeedback({ tone: "error", message })
        },
      }
    )
  }

  const toneStyles: Record<Feedback["tone"], { border: string; icon: ReactNode; text: string }> = {
    success: {
      border: "border-[#00ff66]/40",
      text: "text-[#00ff66]",
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00ff66]" />,
    },
    warning: {
      border: "border-[#ff9900]/40",
      text: "text-[#ff9900]",
      icon: <HelpCircle className="w-4 h-4 shrink-0 text-[#ff9900]" />,
    },
    error: {
      border: "border-[#ff0055]/40",
      text: "text-[#ff0055]",
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-[#ff0055]" />,
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.message}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: EASE }}
              className={`bg-background/85 backdrop-blur-xl border ${toneStyles[feedback.tone].border} rounded-2xl px-4 py-3 shadow-2xl`}
            >
              <div className="flex items-start gap-2.5">
                {toneStyles[feedback.tone].icon}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white leading-snug">{feedback.message}</p>
                  {feedback.candidates && feedback.candidates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {feedback.candidates.map((c) => (
                        <button
                          key={c}
                          onClick={() => setPrompt((p) => `${c}${p ? " " + p : ""}`)}
                          className="text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-2.5 py-1 text-white/80 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="flex items-center gap-2 px-3 py-2">
            <motion.div
              animate={aiUpdate.isPending ? { rotate: 360 } : { rotate: 0 }}
              transition={
                aiUpdate.isPending
                  ? { duration: 1.2, ease: "linear", repeat: Infinity }
                  : { duration: 0.3 }
              }
              className="shrink-0"
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
              disabled={aiUpdate.isPending}
              placeholder={
                aiUpdate.isPending
                  ? "Thinking…"
                  : 'Try "3 more players needed at Percy Williams Jr PS"'
              }
              className="flex-1 bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />
            <button
              onClick={submit}
              disabled={aiUpdate.isPending || !prompt.trim()}
              className="shrink-0 flex items-center gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              Send
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
