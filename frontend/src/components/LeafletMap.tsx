"use client";

import { useEffect, useRef, useState } from "react";
import { Incident } from "@/lib/types";
import { ShieldAlert, MapPin, Eye, AlertTriangle, Layers, Filter, Crosshair, Loader2 } from "lucide-react";

interface LeafletMapProps {
  incidents: Incident[];
  depots?: any[];
  hazardCorridors?: any[];
  onSelectIncident?: (incident: Incident) => void;
  selectedIncidentId?: number | null;
  height?: string;
  initialCenter?: [number, number];
}

export default function LeafletMap({
  incidents,
  depots = [],
  hazardCorridors = [],
  onSelectIncident,
  selectedIncidentId,
  height = "560px",
  initialCenter = [13.0827, 80.2707], // Chennai default
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const [tileError, setTileError] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [showDepots, setShowDepots] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 12,
          zoomControl: true,
        });

        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        });

        tileLayer.on("tileerror", () => {
          if (isMounted) setTileError(true);
        });

        tileLayer.addTo(map);

        // Click map event to display coordinates
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          L.popup()
            .setLatLng([lat, lng])
            .setContent(`
              <div style="font-size: 11px; padding: 2px;">
                <strong>Custom Pin Coordinates</strong>
                <p style="margin: 2px 0 0 0; color: #178F8B; font-family: monospace;">
                  Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}
                </p>
              </div>
            `)
            .openOn(map);
        });

        mapInstanceRef.current = map;
      }

      renderMarkers(L);
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Re-render markers when filter or incidents change
  useEffect(() => {
    if (typeof window === "undefined" || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      renderMarkers(L);
    });
  }, [incidents, depots, hazardCorridors, filterSeverity, showDepots, showHazards, selectedIncidentId, userLocation]);

  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLocation({ lat, lon });

        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current;
          map.flyTo([lat, lon], 14, { duration: 1.5 });

          const L = await import("leaflet");

          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current);
          }

          const userHtml = `
            <div style="
              background-color: #2563EB;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 14px rgba(37, 99, 235, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
            </div>
          `;

          const userIcon = L.divIcon({
            html: userHtml,
            className: "user-gps-marker",
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const marker = L.marker([lat, lon], { icon: userIcon })
            .bindPopup(`
              <div style="font-size: 11px; padding: 2px;">
                <strong style="color: #2563EB;">📍 Your Current Location</strong>
                <p style="margin: 2px 0 0 0; color: #475569; font-family: monospace;">
                  Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}
                </p>
              </div>
            `)
            .openPopup();

          marker.addTo(map);
          userMarkerRef.current = marker;
        }
      },
      (err) => {
        setLocating(false);
        alert(`Location detection failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const renderMarkers = (L: any) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous layers
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    // 1. Add Incident Markers
    incidents.forEach((inc) => {
      if (filterSeverity !== "ALL" && inc.priority_category !== filterSeverity) {
        return;
      }

      const isSelected = selectedIncidentId === inc.id;
      const color =
        inc.priority_category === "Critical"
          ? "#D94841"
          : inc.priority_category === "High"
          ? "#F2A93B"
          : inc.priority_category === "Moderate"
          ? "#178F8B"
          : "#25845B";

      const html = `
        <div style="
          background-color: ${color};
          width: ${isSelected ? "26px" : "20px"};
          height: ${isSelected ? "26px" : "20px"};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px ${color}99, 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          ${isSelected ? '<div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>' : ""}
        </div>
      `;

      const customIcon = L.divIcon({
        html: html,
        className: "custom-incident-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px;">
              ${inc.priority_category} (${inc.priority_score.toFixed(0)}/100)
            </span>
            <span style="font-size: 9px; font-weight: 600; color: #d97706; background: #fef3c7; padding: 1px 4px; border-radius: 3px;">
              DEMO DATA
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #142B3B;">
            ${inc.title}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">
            ${inc.location_name} • ${inc.people_affected} affected
          </p>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 6px;">
            Urgency: <strong>${inc.medical_urgency}</strong> | Threat: <strong>${inc.threat_to_life ? "YES" : "NO"}</strong>
          </div>
          <button id="btn-view-inc-${inc.id}" style="
            width: 100%;
            background: #178F8B;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 5px 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
          ">
            View Assessment Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-view-inc-${inc.id}`);
        if (btn && onSelectIncident) {
          btn.onclick = () => onSelectIncident(inc);
        }
      });

      marker.addTo(map);
      layersRef.current.push(marker);
    });

    // 2. Add Depot Markers
    if (showDepots) {
      depots.forEach((depot) => {
        const depotHtml = `
          <div style="
            background: #142B3B;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            border: 2px solid #178F8B;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          ">
            ⛊
          </div>
        `;

        const depotIcon = L.divIcon({
          html: depotHtml,
          className: "custom-depot-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon });
        marker.bindPopup(`
          <div style="min-width: 200px; padding: 2px;">
            <div style="font-size: 10px; font-weight: bold; color: #178F8B; margin-bottom: 2px;">
              RELIEF SUPPLY DEPOT (CHENNAI)
            </div>
            <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #142B3B;">
              ${depot.name}
            </h4>
            <div style="font-size: 11px; color: #475569;">
              Key Supplies: Trauma Kits, Bottled Water, Rescue Boats, Heavy Dewatering Pumps
            </div>
          </div>
        `);
        marker.addTo(map);
        layersRef.current.push(marker);
      });
    }

    // 3. Add Hazard Corridors (Road Closures / Flooding)
    if (showHazards) {
      hazardCorridors.forEach((hazard) => {
        const isBlocked = hazard.status === "blocked";
        const polyline = L.polyline(hazard.coordinates, {
          color: isBlocked ? "#D94841" : "#F2A93B",
          weight: 5,
          dashArray: isBlocked ? "6, 8" : "3, 6",
          opacity: 0.85,
        });

        polyline.bindPopup(`
          <div style="font-size: 11px; padding: 2px;">
            <strong style="color: ${isBlocked ? "#D94841" : "#F2A93B"}">
              ${isBlocked ? "ROAD CLOSED (HAZARD)" : "CAUTION CORRIDOR"}
            </strong>
            <p style="margin: 4px 0 0 0; color: #1e293b; font-weight: 600;">${hazard.road}</p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">${hazard.hazard || "Impassable disaster zone"}</p>
          </div>
        `);
        polyline.addTo(map);
        layersRef.current.push(polyline);
      });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
      {/* Top Map Controls & Legend Toolbar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            Severity:
          </span>
          {["ALL", "Critical", "High", "Moderate", "Low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                filterSeverity === sev
                  ? "bg-navy text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Layer Toggles & Locate Me Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-teal hover:text-white text-teal border border-teal/40 rounded-lg font-semibold shadow-2xs transition-colors disabled:opacity-50"
            title="Detect and center around your live GPS coordinates"
          >
            {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
            <span>Locate Me (GPS)</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showDepots}
              onChange={(e) => setShowDepots(e.target.checked)}
              className="w-3.5 h-3.5 text-navy rounded border-slate-300"
            />
            <span>Depots</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showHazards}
              onChange={(e) => setShowHazards(e.target.checked)}
              className="w-3.5 h-3.5 text-emergency rounded border-slate-300"
            />
            <span>Road Closures</span>
          </label>

          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
            CHENNAI METRO (DEMO)
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Offline / Tile Fallback Overlay */}
        {tileError && (
          <div className="absolute inset-0 bg-slate-100/90 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <h4 className="font-bold text-navy text-sm">OpenStreetMap Tiles Fallback</h4>
            <p className="text-xs text-slate-600 max-w-md mt-1">
              Live map tiles unavailable in current offline environment. Incident coordinates remain mapped using mathematical projection.
            </p>
          </div>
        )}

        {/* Interactive Floating Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5">
          <div className="font-bold text-navy text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between gap-4">
            <span>Chennai Map Legend</span>
            <span className="text-[10px] text-teal font-mono">13.0827°N, 80.2707°E</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emergency inline-block"></span>
            <span className="text-slate-700">Critical Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-relief-amber inline-block"></span>
            <span className="text-slate-700">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal inline-block"></span>
            <span className="text-slate-700">Moderate Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-relief-green inline-block"></span>
            <span className="text-slate-700">Low Priority</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
            <span className="w-3 h-3 bg-navy text-teal text-[9px] font-bold rounded flex items-center justify-center">⛊</span>
            <span className="text-slate-700">Relief Supply Depot</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emergency border-t border-dashed border-emergency inline-block"></span>
            <span className="text-slate-700">Blocked Road Closure</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-blue-600 font-semibold">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
              <span>Your GPS Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
