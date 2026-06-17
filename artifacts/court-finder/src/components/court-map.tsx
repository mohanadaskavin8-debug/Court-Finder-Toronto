import { MapContainer, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import L from "leaflet"
import "leaflet.markercluster"
import { Court } from "@workspace/api-client-react"
import { getCourtStatus, getStatusHex } from "@/lib/utils"
import { useEffect } from "react"

// Create a custom pulsing marker icon
const createMarkerIcon = (court: Court) => {
  const status = getCourtStatus(court)
  const color = getStatusHex(status)

  return L.divIcon({
    className: "bg-transparent border-0",
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
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

function ClusterLayer({
  courts,
  onSelectCourt,
}: {
  courts: Court[]
  onSelectCourt: (court: Court) => void
}) {
  const map = useMap()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = (L as any).markerClusterGroup({
      maxClusterRadius: 55,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount()
        return L.divIcon({
          className: "bg-transparent border-0",
          html: `<div style="box-shadow:0 0 16px rgba(34,211,238,0.7)" class="flex items-center justify-center w-11 h-11 rounded-full bg-[#0a0a0c]/90 border-2 border-[#22d3ee] text-[#22d3ee] font-black text-base backdrop-blur-sm">${count}</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        })
      },
    })

    courts.forEach((court) => {
      const marker = L.marker([court.lat, court.lng], { icon: createMarkerIcon(court) })
      marker.on("click", () => onSelectCourt(court))
      group.addLayer(marker)
    })

    map.addLayer(group)
    return () => {
      map.removeLayer(group)
    }
  }, [courts, map, onSelectCourt])

  return null
}

export function CourtMap({ courts, onSelectCourt }: CourtMapProps) {
  const torontoCenter: [number, number] = [43.7, -79.3832]

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={torontoCenter}
        zoom={11}
        className="w-full h-full bg-[#0a0a0c]"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <ClusterLayer courts={courts} onSelectCourt={onSelectCourt} />
      </MapContainer>
    </div>
  )
}
