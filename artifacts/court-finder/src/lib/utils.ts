import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Court } from "@workspace/api-client-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CourtStatus = "Open" | "Filling Up" | "Full"

export function getCourtStatus(court: Court): CourtStatus {
  if (court.currentPlayers >= court.maxPlayers) return "Full"
  if (court.currentPlayers >= court.playersNeeded / 2 && court.currentPlayers > 0) return "Filling Up"
  return "Open"
}

export function getStatusColor(status: CourtStatus): string {
  switch (status) {
    case "Open":
      return "text-[#00ff66] border-[#00ff66] bg-[#00ff66]/10"
    case "Filling Up":
      return "text-[#ff9900] border-[#ff9900] bg-[#ff9900]/10"
    case "Full":
      return "text-[#ff0055] border-[#ff0055] bg-[#ff0055]/10"
  }
}

export function getStatusGlow(status: CourtStatus): string {
  switch (status) {
    case "Open":
      return "drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]"
    case "Filling Up":
      return "drop-shadow-[0_0_8px_rgba(255,153,0,0.8)]"
    case "Full":
      return "drop-shadow-[0_0_8px_rgba(255,0,85,0.8)]"
  }
}

export function getStatusHex(status: CourtStatus): string {
  switch (status) {
    case "Open": return "#00ff66"
    case "Filling Up": return "#ff9900"
    case "Full": return "#ff0055"
  }
}
