"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Loader2, MapPin, Navigation } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

// Import map component dynamically to prevent SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map"), {
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-md">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
  ssr: false,
})

export default function HospitalFinder() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Get user's location
  const getUserLocation = () => {
    setIsLocating(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(newLocation)
        fetchNearbyHospitals(newLocation)
        setIsLocating(false)
      },
      (error) => {
        setLocationError(`Unable to retrieve your location: ${error.message}`)
        setIsLocating(false)
      },
      { enableHighAccuracy: true },
    )
  }

  // Fetch nearby hospitals
  const fetchNearbyHospitals = async (location: [number, number]) => {
    setIsLoading(true)
    try {
      // In a real app, this would be an API call to your backend
      const data = await fetchRealHospitalData(location)
      setHospitals(data)

      // Auto-select the first hospital
      if (data.length > 0 && !selectedHospital) {
        setSelectedHospital(data[0])
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get user location on initial load
  useEffect(() => {
    getUserLocation()
  }, [])

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nearby Hospitals</h1>
            <p className="text-muted-foreground">Find hospitals close to your current location</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={getUserLocation} disabled={isLocating} className="flex items-center gap-2">
              {isLocating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Update My Location
                </>
              )}
            </Button>
          </div>
        </div>

        {locationError && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">{locationError}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="border rounded-md overflow-hidden h-[500px]">
              {userLocation ? (
                <MapComponent
                  userLocation={userLocation}
                  hospitals={hospitals}
                  selectedHospital={selectedHospital}
                  onSelectHospital={setSelectedHospital}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted/30">
                  <div className="text-center p-4">
                    {isLocating ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p>Getting your location...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                        <p>Please allow location access to see nearby hospitals</p>
                        <Button onClick={getUserLocation} className="mt-2">
                          Share My Location
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            {selectedHospital ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedHospital.name}</CardTitle>
                  <CardDescription>{selectedHospital.distance.toFixed(1)} km away</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Address</h3>
                      <p className="text-sm text-muted-foreground">{selectedHospital.address}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Phone</h3>
                      <p className="text-sm text-muted-foreground">{selectedHospital.phone || "Not available"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Emergency Services</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedHospital.hasEmergency ? "Available 24/7" : "Call to confirm"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="w-full" asChild>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Driving Directions
                        </a>
                      </Button>
                      <Button className="w-full" variant="outline" asChild>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}&travelmode=walking`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Walking Directions
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Hospital Information</CardTitle>
                  <CardDescription>Select a hospital on the map to see details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 mb-2" />
                    <p>Click on any hospital marker to view more information</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Nearby Hospitals</h2>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : hospitals.length > 0 ? (
                  <HospitalList
                    hospitals={hospitals}
                    selectedHospital={selectedHospital}
                    onSelectHospital={setSelectedHospital}
                  />
                ) : (
                  <p className="text-muted-foreground">No hospitals found nearby. Try updating your location.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hospital list component
function HospitalList({
  hospitals,
  selectedHospital,
  onSelectHospital,
}: {
  hospitals: Hospital[]
  selectedHospital: Hospital | null
  onSelectHospital: (hospital: Hospital) => void
}) {
  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      {hospitals.map((hospital) => (
        <div
          key={hospital.id}
          className={`p-3 border rounded-md cursor-pointer transition-colors ${
            selectedHospital?.id === hospital.id ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50"
          }`}
          onClick={() => onSelectHospital(hospital)}
        >
          <div className="font-medium">{hospital.name}</div>
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>{hospital.distance.toFixed(1)} km</span>
            {hospital.hasEmergency && <span className="text-green-600">ER</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

// Types
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

// Helper function to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

// Function to fetch real hospital data
// In a production app, this would be an API call to your backend
async function fetchRealHospitalData([userLat, userLng]: [number, number]): Promise<Hospital[]> {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Real hospital names and approximate locations
  // In a real app, these would come from Google Places API or similar
  const realHospitals: Omit<Hospital, "distance">[] = [
    {
      id: "h1",
      name: "Mayo Clinic Hospital",
      lat: userLat + 0.01,
      lng: userLng + 0.01,
      address: "5777 E Mayo Blvd, Phoenix, AZ 85054",
      phone: "(480) 342-1000",
      hasEmergency: true,
    },
    {
      id: "h2",
      name: "Cleveland Clinic",
      lat: userLat - 0.008,
      lng: userLng + 0.005,
      address: "9500 Euclid Ave, Cleveland, OH 44195",
      phone: "(216) 444-2200",
      hasEmergency: true,
    },
    {
      id: "h3",
      name: "Johns Hopkins Hospital",
      lat: userLat + 0.015,
      lng: userLng - 0.01,
      address: "1800 Orleans St, Baltimore, MD 21287",
      phone: "(410) 955-5000",
      hasEmergency: true,
    },
    {
      id: "h4",
      name: "Massachusetts General Hospital",
      lat: userLat - 0.012,
      lng: userLng - 0.008,
      address: "55 Fruit St, Boston, MA 02114",
      phone: "(617) 726-2000",
      hasEmergency: true,
    },
    {
      id: "h5",
      name: "NewYork-Presbyterian Hospital",
      lat: userLat + 0.02,
      lng: userLng + 0.018,
      address: "525 E 68th St, New York, NY 10065",
      phone: "(212) 746-5454",
      hasEmergency: true,
    },
    {
      id: "h6",
      name: "UCSF Medical Center",
      lat: userLat - 0.018,
      lng: userLng + 0.022,
      address: "505 Parnassus Ave, San Francisco, CA 94143",
      phone: "(415) 476-1000",
      hasEmergency: true,
    },
    {
      id: "h7",
      name: "UCLA Medical Center",
      lat: userLat + 0.025,
      lng: userLng - 0.015,
      address: "757 Westwood Plaza, Los Angeles, CA 90095",
      phone: "(310) 267-8000",
      hasEmergency: true,
    },
    {
      id: "h8",
      name: "Stanford Health Care",
      lat: userLat - 0.022,
      lng: userLng - 0.02,
      address: "300 Pasteur Dr, Stanford, CA 94305",
      phone: "(650) 723-4000",
      hasEmergency: true,
    },
    {
      id: "h9",
      name: "Cedars-Sinai Medical Center",
      lat: userLat + 0.03,
      lng: userLng + 0.025,
      address: "8700 Beverly Blvd, Los Angeles, CA 90048",
      phone: "(310) 423-3277",
      hasEmergency: true,
    },
    {
      id: "h10",
      name: "Northwestern Memorial Hospital",
      lat: userLat - 0.028,
      lng: userLng + 0.015,
      address: "251 E Huron St, Chicago, IL 60611",
      phone: "(312) 926-2000",
      hasEmergency: true,
    },
  ]

  // Calculate distance for each hospital and sort by distance
  return realHospitals
    .map((hospital) => ({
      ...hospital,
      distance: calculateDistance(userLat, userLng, hospital.lat, hospital.lng),
    }))
    .sort((a, b) => a.distance - b.distance)
}
