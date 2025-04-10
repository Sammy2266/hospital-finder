"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

// Define the Hospital type
interface Hospital {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  phone: string
  hasEmergency: boolean
  distance: number
}

interface MapComponentProps {
  userLocation: [number, number]
  hospitals: Hospital[]
  selectedHospital: Hospital | null
  onSelectHospital: (hospital: Hospital) => void
}

export default function MapComponent({
  userLocation,
  hospitals,
  selectedHospital,
  onSelectHospital,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const hospitalMarkersRef = useRef<Record<string, L.Marker>>({})

  useEffect(() => {
    // Fix for default markers in Leaflet with Next.js
    const DefaultIcon = L.icon({
      iconUrl: icon.src,
      shadowUrl: iconShadow.src,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })
    L.Marker.prototype.options.icon = DefaultIcon

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView(userLocation, 14)

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
    } else {
      // Update map view if it already exists
      mapRef.current.setView(userLocation, 14)
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    hospitalMarkersRef.current = {}

    // Add user location marker
    const userMarker = L.marker(userLocation, {
      icon: L.divIcon({
        className: "user-location-marker",
        html: `<div class="w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }).addTo(mapRef.current)
    userMarker.bindPopup("Your Location").openPopup()
    markersRef.current.push(userMarker)

    // Add circle around user location (1km radius)
    L.circle(userLocation, {
      color: "blue",
      fillColor: "blue",
      fillOpacity: 0.1,
      radius: 1000,
    }).addTo(mapRef.current)

    // Add hospital markers
    hospitals.forEach((hospital) => {
      const hospitalIcon = L.divIcon({
        className: "hospital-marker",
        html: `<div class="w-6 h-6 bg-white border-2 border-red-500 rounded-full flex items-center justify-center">
                <div class="w-3 h-3 text-red-500 flex items-center justify-center text-xs font-bold">H</div>
              </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
        .addTo(mapRef.current!)
        .bindPopup(`<b>${hospital.name}</b><br>${hospital.distance.toFixed(1)} km away`)

      marker.on("click", () => {
        onSelectHospital(hospital)
      })

      markersRef.current.push(marker)
      hospitalMarkersRef.current[hospital.id] = marker
    })

    // Add custom CSS for markers
    if (!document.getElementById("map-styles")) {
      const style = document.createElement("style")
      style.id = "map-styles"
      style.innerHTML = `
        .user-location-marker, .hospital-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `
      document.head.appendChild(style)
    }

    // Cleanup function
    return () => {
      // We don't destroy the map on cleanup to prevent re-initialization flicker
      // Just clear the markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      hospitalMarkersRef.current = {}
    }
  }, [userLocation, hospitals, onSelectHospital])

  // Update selected hospital marker
  useEffect(() => {
    // Reset all hospital markers to default style
    Object.values(hospitalMarkersRef.current).forEach((marker) => {
      const el = marker.getElement()
      if (el) {
        const iconDiv = el.querySelector("div")
        if (iconDiv) {
          iconDiv.classList.remove("bg-primary")
          iconDiv.classList.add("bg-white")
        }
      }
    })

    // Highlight selected hospital marker
    if (selectedHospital && hospitalMarkersRef.current[selectedHospital.id]) {
      const marker = hospitalMarkersRef.current[selectedHospital.id]
      marker.openPopup()

      const el = marker.getElement()
      if (el) {
        const iconDiv = el.querySelector("div")
        if (iconDiv) {
          iconDiv.classList.remove("bg-white")
          iconDiv.classList.add("bg-primary")
        }
      }
    }
  }, [selectedHospital])

  return <div id="map" className="h-full w-full" />
}
