import { useEffect, useRef, useState } from "react"
import maplibregl, { GeoJSONSource, MapGeoJSONFeature } from "maplibre-gl"
import type { FeatureCollection, Point } from "geojson"
import "maplibre-gl/dist/maplibre-gl.css"
import { Court } from "@workspace/api-client-react"
import { getCourtStatus, getStatusHex } from "@/lib/utils"

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
const NEON = "#22d3ee"

interface CourtMapProps {
  courts: Court[]
  selectedCourtId: number | null
  onSelectCourt: (court: Court) => void
}

function toFeatureCollection(courts: Court[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: courts.map((c) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [c.lng, c.lat] },
      properties: { id: c.id, color: getStatusHex(getCourtStatus(c)) },
    })),
  }
}

export function CourtMap({ courts, selectedCourtId, onSelectCourt }: CourtMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)
  const courtsByIdRef = useRef<Map<number, Court>>(new Map())
  const courtsRef = useRef<Court[]>(courts)
  const onSelectRef = useRef(onSelectCourt)
  const selectedRef = useRef<number | null>(selectedCourtId)
  const [glError, setGlError] = useState(false)

  // keep latest values available to map callbacks captured at init time
  courtsRef.current = courts
  courtsByIdRef.current = new Map(courts.map((c) => [c.id, c]))
  onSelectRef.current = onSelectCourt
  selectedRef.current = selectedCourtId

  // ---- init map once ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: [-79.3832, 43.72],
        zoom: 9.8,
        pitch: 0,
        bearing: 0,
        attributionControl: { compact: true },
        canvasContextAttributes: { antialias: true, failIfMajorPerformanceCaveat: false },
      })
    } catch {
      setGlError(true)
      return
    }
    mapRef.current = map

    let spinRaf = 0
    let introTimeout = 0
    // If style/WebGL never finishes loading, fall back gracefully instead of a blank map.
    const loadTimeout = window.setTimeout(() => {
      if (!readyRef.current) {
        map.remove()
        mapRef.current = null
        setGlError(true)
      }
    }, 12000)

    map.on("error", (e) => {
      // tile/source errors are usually benign; log without breaking the app
      console.warn("[court-map] maplibre error", e.error)
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")

    map.on("load", () => {
      window.clearTimeout(loadTimeout)

      // ---- 3D building extrusions (Carto vector source) ----
      try {
        if (map.getSource("carto")) {
          const layers = map.getStyle().layers ?? []
          const firstSymbol = layers.find((l) => l.type === "symbol")?.id
          map.addLayer(
            {
              id: "3d-buildings",
              source: "carto",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 13,
              filter: ["!=", ["get", "hide_3d"], true],
              paint: {
                "fill-extrusion-color": [
                  "interpolate", ["linear"], ["coalesce", ["get", "render_height"], 8],
                  0, "#0e1118", 60, "#161c28", 160, "#1d232f",
                ],
                "fill-extrusion-height": [
                  "interpolate", ["linear"], ["zoom"],
                  13, 0,
                  16, ["coalesce", ["get", "render_height"], 10],
                ],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
                "fill-extrusion-opacity": 0.6,
              },
            },
            firstSymbol,
          )
        }
      } catch {
        // building layer is a nice-to-have; ignore if the style schema differs
      }

      // ---- courts source (clustered), seeded with the latest data ----
      map.addSource("courts", {
        type: "geojson",
        data: toFeatureCollection(courtsRef.current),
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 13,
      })

      // cluster glow
      map.addLayer({
        id: "clusters-glow",
        type: "circle",
        source: "courts",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": NEON,
          "circle-blur": 1,
          "circle-opacity": 0.45,
          "circle-radius": ["step", ["get", "point_count"], 22, 25, 30, 100, 42],
        },
      })
      // cluster core
      map.addLayer({
        id: "clusters-core",
        type: "circle",
        source: "courts",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0a0f14",
          "circle-stroke-color": NEON,
          "circle-stroke-width": 2,
          "circle-radius": ["step", ["get", "point_count"], 15, 25, 20, 100, 28],
        },
      })
      // cluster count
      map.addLayer({
        id: "clusters-count",
        type: "symbol",
        source: "courts",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold"],
          "text-size": ["step", ["get", "point_count"], 13, 25, 15, 100, 18],
        },
        paint: { "text-color": NEON, "text-halo-color": "#0a0f14", "text-halo-width": 1 },
      })

      // unclustered glow
      map.addLayer({
        id: "points-glow",
        type: "circle",
        source: "courts",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-blur": 1,
          "circle-opacity": 0.5,
          "circle-radius": 11,
        },
      })
      // unclustered core
      map.addLayer({
        id: "points-core",
        type: "circle",
        source: "courts",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#06080b",
          "circle-stroke-width": 1.5,
          "circle-radius": 6,
        },
      })
      // selected ring (animated), seeded with the latest selection
      map.addLayer({
        id: "point-selected",
        type: "circle",
        source: "courts",
        filter: ["==", ["get", "id"], selectedRef.current ?? -1],
        paint: {
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-radius": 10,
        },
      })

      readyRef.current = true

      // ---- interactions ----
      map.on("click", "clusters-core", (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ["clusters-core"] })
        const clusterId = feats[0]?.properties?.cluster_id
        if (clusterId == null) return
        const src = map.getSource("courts") as GeoJSONSource
        src
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            if (!mapRef.current) return
            const coords = (feats[0].geometry as Point).coordinates as [number, number]
            map.easeTo({ center: coords, zoom: zoom + 0.4, duration: 800 })
          })
          .catch(() => {})
      })

      const handlePointClick = (e: maplibregl.MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const id = e.features?.[0]?.properties?.id as number | undefined
        if (id == null) return
        const court = courtsByIdRef.current.get(id)
        if (court) onSelectRef.current(court)
      }
      map.on("click", "points-core", handlePointClick)
      map.on("click", "points-glow", handlePointClick)

      for (const layer of ["clusters-core", "points-core", "points-glow"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer" })
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = "" })
      }

      // ---- cinematic intro + gentle idle spin ----
      map.easeTo({ zoom: 10.8, pitch: 55, bearing: -22, duration: 5000, easing: (t) => t * (2 - t) })

      let userInteracting = false
      const stop = () => { userInteracting = true; cancelAnimationFrame(spinRaf) }
      ;["mousedown", "touchstart", "wheel", "dragstart"].forEach((ev) =>
        map.on(ev as "mousedown", stop),
      )
      const spin = () => {
        if (userInteracting || !mapRef.current) return
        map.setBearing(map.getBearing() + 0.012)
        spinRaf = requestAnimationFrame(spin)
      }
      introTimeout = window.setTimeout(() => {
        if (!userInteracting && mapRef.current) spin()
      }, 5200)
    })

    return () => {
      window.clearTimeout(loadTimeout)
      window.clearTimeout(introTimeout)
      cancelAnimationFrame(spinRaf)
      readyRef.current = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ---- update data on refetch / mutation ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const src = map.getSource("courts") as GeoJSONSource | undefined
    if (src) src.setData(toFeatureCollection(courts))
  }, [courts])

  // ---- selection ring + pulse ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (!map.getLayer("point-selected")) return
    map.setFilter("point-selected", ["==", ["get", "id"], selectedCourtId ?? -1])

    if (selectedCourtId == null) return
    let raf = 0
    const start = performance.now()
    const pulse = () => {
      if (!mapRef.current) return
      const t = (performance.now() - start) / 1000
      const r = 10 + Math.sin(t * 4) * 4 + 4
      map.setPaintProperty("point-selected", "circle-radius", r)
      map.setPaintProperty("point-selected", "circle-stroke-opacity", 0.6 + Math.sin(t * 4) * 0.4)
      raf = requestAnimationFrame(pulse)
    }
    raf = requestAnimationFrame(pulse)
    return () => cancelAnimationFrame(raf)
  }, [selectedCourtId])

  if (glError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#06080b] text-center p-8">
        <div className="max-w-sm">
          <p className="text-white font-bold text-lg">Map unavailable</p>
          <p className="text-muted-foreground text-sm mt-2">
            Your browser may have WebGL/hardware acceleration disabled, or the map failed to load.
            You can still browse every court in the List View.
          </p>
        </div>
      </div>
    )
  }
  return <div ref={containerRef} className="w-full h-full bg-[#06080b]" />
}
