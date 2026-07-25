import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Court type color coding: green = park, orange = school, red = community centre
export const COURT_TYPES = [
  { type: "park", label: "Park", hex: "#00ff66" },
  { type: "school", label: "School", hex: "#ff9900" },
  { type: "community", label: "Community Centre", hex: "#ff0055" },
] as const

export function getTypeHex(courtType: string): string {
  return COURT_TYPES.find((t) => t.type === courtType)?.hex ?? "#22d3ee"
}

export function getTypeLabel(courtType: string): string {
  return COURT_TYPES.find((t) => t.type === courtType)?.label ?? courtType
}

export function getTypeColor(courtType: string): string {
  switch (courtType) {
    case "park":
      return "text-[#00ff66] border-[#00ff66] bg-[#00ff66]/10"
    case "school":
      return "text-[#ff9900] border-[#ff9900] bg-[#ff9900]/10"
    case "community":
      return "text-[#ff0055] border-[#ff0055] bg-[#ff0055]/10"
    default:
      return "text-[#22d3ee] border-[#22d3ee] bg-[#22d3ee]/10"
  }
}
