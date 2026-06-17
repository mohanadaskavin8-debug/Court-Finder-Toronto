import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Court } from "@workspace/api-client-react"
import { getCourtStatus, getStatusHex, getStatusGlow } from "@/lib/utils"
import { useEffect } from "react"

// Create a custom pulsing marker icon
const createMarkerIcon = (court: Court) => {
  const status = getCourtStatus(court)
  const color = getStatusHex(status)
  
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8" fill="${color}" stroke="#0a0a0c" stroke-width="2"/>
    </svg>
  `
  
  return L.divIcon({
    className: 'bg-transparent border-0',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6 group">
        <div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${color}"></div>
        <div class="relative z-10 w-4 h-4 rounded-full border-2 border-background" style="background-color: ${color}; box-shadow: 0 0 10px ${color}"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

interface CourtMapProps {
  courts: Court[]
  selectedCourtId: number | null
  onSelectCourt: (court: Court) => void
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export function CourtMap({ courts, selectedCourtId, onSelectCourt }: CourtMapProps) {
  const torontoCenter: [number, number] = [43.6532, -79.3832]

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={torontoCenter}
        zoom={13}
        className="w-full h-full bg-[#0a0a0c]"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {courts.map((court) => (
          <Marker
            key={court.id}
            position={[court.lat, court.lng]}
            icon={createMarkerIcon(court)}
            eventHandlers={{
              click: () => onSelectCourt(court),
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
