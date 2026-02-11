import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation, MapPin, X, Ruler } from 'lucide-react';

// Load Font Awesome for marker icons
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
if (!document.querySelector(`link[href="${fontAwesomeLink.href}"]`)) {
  document.head.appendChild(fontAwesomeLink);
}

// ============================================
// TYPES
// ============================================

interface Candidate {
  id: number;
  companyName: string;
  fullName: string;
  city: string;
  phoneNumber: string;
  email: string;
  priorityScore: number;
  showroom: string;
  vendSpa: string;
  autreMarque: string;
  domaineSimilaire: string;
  notes?: string | null;
  status: string;
  latitude?: string | null;
  longitude?: string | null;
  phoneCallsCount: number;
  emailsSentCount: number;
  visited: number;
  visitDate?: string | Date | null;
}

interface MeasurePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// ============================================
// CONSTANTS
// ============================================

const PRIORITY_MARKER_COLORS: Record<number, string> = {
  8: '#dc2626',
  7: '#ef4444',
  6: '#f97316',
  5: '#fb923c',
  4: '#eab308',
  3: '#facc15',
  2: '#4ade80',
  1: '#22c55e',
  0: '#d1d5db',
};

const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  non_contacte: 'Non contacté',
  en_cours: 'En cours',
  valide: 'Validé',
  archive: 'Archivé',
};

// ============================================
// HELPERS
// ============================================

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('[Map] Geocoding failed for:', address, e);
  }
  return null;
};

// ============================================
// COMPONENT
// ============================================

interface InteractivePartnerMapProps {
  candidates: Candidate[];
  statusFilter: string;
}

export default function InteractivePartnerMap({
  candidates,
  statusFilter,
}: InteractivePartnerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number } | null>>(new Map());

  // Measure mode
  const [measureActive, setMeasureActive] = useState(false);
  const measureActiveRef = useRef(false);
  const [measureStart, setMeasureStart] = useState<MeasurePoint | null>(null);
  const [measureEnd, setMeasureEnd] = useState<MeasurePoint | null>(null);
  const measureStartRef = useRef<MeasurePoint | null>(null);
  const measureEndRef = useRef<MeasurePoint | null>(null);
  const measureLineRef = useRef<L.Polyline | null>(null);
  const [straightDistance, setStraightDistance] = useState<number | null>(null);

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLocated, setIsLocated] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [showNearbyInfo, setShowNearbyInfo] = useState(false);

  // Geocoded items
  interface GeocodedCandidate {
    id: string;
    lat: number;
    lng: number;
    data: Candidate;
  }
  const [geocodedItems, setGeocodedItems] = useState<GeocodedCandidate[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.5, 2.5], // Centre de la France
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Geocode candidates only
  useEffect(() => {
    let cancelled = false;

    const geocodeAll = async () => {
      const items: GeocodedCandidate[] = [];
      const cache = geocodeCacheRef.current;

      // Filter by status
      const filtered = statusFilter === 'all'
        ? candidates
        : candidates.filter(c => c.status === statusFilter);

      for (const candidate of filtered) {
        if (cancelled) return;

        // Use stored coordinates if available
        if (candidate.latitude && candidate.longitude) {
          const lat = parseFloat(candidate.latitude);
          const lng = parseFloat(candidate.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            items.push({
              id: `candidate-${candidate.id}`,
              lat,
              lng,
              data: candidate,
            });
            continue;
          }
        }

        // Geocode by city
        const address = `${candidate.city}, France`;
        let coords = cache.get(`candidate-${address}`);
        if (coords === undefined) {
          coords = await geocodeAddress(address);
          cache.set(`candidate-${address}`, coords);
          await new Promise(r => setTimeout(r, 200));
        }
        if (coords) {
          items.push({ id: `candidate-${candidate.id}`, lat: coords.lat, lng: coords.lng, data: candidate });
        }
      }

      if (!cancelled) {
        setGeocodedItems(items);
      }
    };

    geocodeAll();
    return () => { cancelled = true; };
  }, [candidates, statusFilter]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => {
      if (mapRef.current) mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    geocodedItems.forEach(item => {
      if (!mapRef.current) return;

      const c = item.data;
      const priorityColor = PRIORITY_MARKER_COLORS[c.priorityScore] || '#d1d5db';
      const visitedBorder = c.visited ? '3px solid #16a34a' : '3px solid white';
      const textColor = c.priorityScore >= 3 && c.priorityScore <= 4 ? '#1a1a1a' : 'white';

      const iconHtml = `
        <div style="position: relative;">
          <div style="background-color: ${priorityColor}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${textColor}; font-weight: bold; font-size: 15px; border: ${visitedBorder}; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            ${c.priorityScore}
          </div>
          ${c.status === 'en_cours' ? `<div style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; border: 2px solid white;"></div>` : ''}
          ${c.status === 'valide' ? `<div style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #16a34a; border-radius: 50%; border: 2px solid white;"></div>` : ''}
        </div>`;

      const statusLabel = CANDIDATE_STATUS_LABELS[c.status] || c.status;
      const criteria = [];
      if (c.showroom === 'oui' || c.showroom?.toLowerCase().includes('oui')) criteria.push('Showroom');
      if (c.vendSpa === 'oui' || c.vendSpa?.toLowerCase().includes('oui')) criteria.push('Vend Spa');
      if (c.autreMarque === 'oui' || c.autreMarque?.toLowerCase().includes('oui')) criteria.push('Autre marque');
      if (c.domaineSimilaire === 'oui' || c.domaineSimilaire?.toLowerCase().includes('oui')) criteria.push('Domaine similaire');

      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif; padding: 4px; min-width: 260px;">
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <div style="background-color: ${priorityColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${textColor}; font-weight: bold; font-size: 14px; flex-shrink: 0;">
                ${c.priorityScore}
              </div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 600; color: #1d1d1f; line-height: 1.3;">${c.companyName}</h3>
            </div>
            <p style="margin: 0; font-size: 13px; color: #86868b;">${c.fullName} &bull; ${c.city}</p>
          </div>

          <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
            <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: ${c.status === 'valide' ? '#dcfce7' : c.status === 'en_cours' ? '#dbeafe' : c.status === 'archive' ? '#fee2e2' : '#f3f4f6'}; color: ${c.status === 'valide' ? '#166534' : c.status === 'en_cours' ? '#1e40af' : c.status === 'archive' ? '#991b1b' : '#374151'}; font-weight: 500;">${statusLabel}</span>
            ${c.visited ? `<span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: #dcfce7; color: #166534; font-weight: 500;">Visité</span>` : ''}
          </div>

          ${criteria.length > 0 ? `
            <div style="padding: 8px 12px; background: #f5f5f7; border-radius: 10px; margin-bottom: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #86868b;">Critères</p>
              <p style="margin: 0; font-size: 13px; font-weight: 500;">${criteria.join(', ')}</p>
            </div>
          ` : ''}

          <div style="display: flex; gap: 12px; padding: 8px 12px; background: #f5f5f7; border-radius: 10px; margin-bottom: 12px;">
            <div><p style="margin: 0; font-size: 11px; color: #86868b;">Appels</p><p style="margin: 0; font-size: 15px; font-weight: 600;">${c.phoneCallsCount}</p></div>
            <div><p style="margin: 0; font-size: 11px; color: #86868b;">Emails</p><p style="margin: 0; font-size: 15px; font-weight: 600;">${c.emailsSentCount}</p></div>
          </div>

          ${c.notes ? `
            <div style="padding: 8px 12px; background: #fffbeb; border-radius: 10px; margin-bottom: 12px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e;">Notes</p>
              <p style="margin: 0; font-size: 13px;">${c.notes}</p>
            </div>
          ` : ''}

          <div style="display: flex; gap: 6px;">
            <a href="tel:${c.phoneNumber}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background: #f5f5f7; border-radius: 10px; text-decoration: none; color: #007aff; font-size: 13px; font-weight: 500;">
              <i class="fas fa-phone" style="font-size: 12px;"></i>Appeler
            </a>
            <a href="mailto:${c.email}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background: #f5f5f7; border-radius: 10px; text-decoration: none; color: #007aff; font-size: 13px; font-weight: 500;">
              <i class="fas fa-envelope" style="font-size: 12px;"></i>Email
            </a>
          </div>
        </div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([item.lat, item.lng], { icon }).addTo(mapRef.current!);

      marker.on('click', () => {
        if (measureActiveRef.current) {
          handleMarkerClickInMeasureMode({ id: item.id, name: c.companyName, lat: item.lat, lng: item.lng });
        } else {
          marker.bindPopup(popupContent, { maxWidth: 320, className: 'custom-popup' }).openPopup();
        }
      });

      markersRef.current.push(marker);
    });

    if (geocodedItems.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(geocodedItems.map(i => [i.lat, i.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [geocodedItems]);

  // Measure mode handlers
  const handleMarkerClickInMeasureMode = useCallback((point: MeasurePoint) => {
    if (!measureStartRef.current) {
      measureStartRef.current = point;
      measureEndRef.current = null;
      setMeasureStart(point);
      setMeasureEnd(null);
      setStraightDistance(null);
    } else if (measureStartRef.current.id !== point.id) {
      measureEndRef.current = point;
      setMeasureEnd(point);
      const dist = calculateDistance(measureStartRef.current.lat, measureStartRef.current.lng, point.lat, point.lng);
      setStraightDistance(dist);
      if (mapRef.current) {
        if (measureLineRef.current) mapRef.current.removeLayer(measureLineRef.current);
        const line = L.polyline(
          [[measureStartRef.current.lat, measureStartRef.current.lng], [point.lat, point.lng]],
          { color: '#3b82f6', weight: 3, dashArray: '10, 10', opacity: 0.8 }
        ).addTo(mapRef.current);
        measureLineRef.current = line;
      }
    }
  }, []);

  const handleResetMeasure = () => {
    measureStartRef.current = null;
    measureEndRef.current = null;
    setMeasureStart(null);
    setMeasureEnd(null);
    setStraightDistance(null);
    if (measureLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(measureLineRef.current);
      measureLineRef.current = null;
    }
  };

  const handleToggleMeasure = () => {
    if (measureActive) {
      handleResetMeasure();
      measureActiveRef.current = false;
      setMeasureActive(false);
    } else {
      handleResetMeasure();
      measureActiveRef.current = true;
      setMeasureActive(true);
    }
  };

  // User location
  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setIsLocating(false);
        setIsLocated(true);
        setShowNearbyInfo(true);

        if (!mapRef.current) return;

        if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
        if (userCircleRef.current) mapRef.current.removeLayer(userCircleRef.current);

        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `<div style="width: 20px; height: 20px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current);
        userMarker.bindPopup(`<div style="text-align: center;"><strong>Votre position</strong><br/><span style="font-size: 12px; color: #666;">Précision: &plusmn;${Math.round(accuracy)}m</span></div>`);
        userMarkerRef.current = userMarker;

        const userCircle = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(mapRef.current);
        userCircleRef.current = userCircle;

        mapRef.current.setView([latitude, longitude], 10, { animate: true });

        const nearby = geocodedItems.filter(item => {
          const dist = calculateDistance(latitude, longitude, item.lat, item.lng);
          return dist <= 50;
        });
        setNearbyCount(nearby.length);
      },
      () => { setIsLocating(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (showNearbyInfo) {
      const timer = setTimeout(() => setShowNearbyInfo(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showNearbyInfo]);

  return (
    <>
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
          padding: 16px;
          background: #ffffff;
        }
        .custom-popup .leaflet-popup-tip { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .custom-marker { background: transparent; border: none; }
        .leaflet-popup-close-button { width: 32px !important; height: 32px !important; font-size: 20px !important; padding: 0 !important; line-height: 32px !important; right: 8px !important; top: 8px !important; color: #8e8e93 !important; font-weight: 300 !important; }
        .leaflet-popup-close-button:hover { background-color: rgba(0,0,0,0.05) !important; border-radius: 50%; color: #000 !important; }
        @media (max-width: 768px) {
          .leaflet-control-zoom a { width: 44px !important; height: 44px !important; line-height: 44px !important; font-size: 24px !important; }
          .leaflet-popup-close-button { width: 44px !important; height: 44px !important; font-size: 28px !important; line-height: 44px !important; }
          .leaflet-popup-content-wrapper { max-width: 90vw !important; }
          .custom-marker { transform: scale(1.2); }
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: '600px' }} />

        {/* User location control */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 z-[1000] flex flex-col gap-2">
          <Button
            onClick={handleLocateUser}
            variant={isLocated ? "default" : "outline"}
            size="lg"
            disabled={isLocating}
            className={`shadow-lg min-h-[44px] ${isLocated ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50'}`}
          >
            {isLocating ? (
              <div className="animate-spin"><Navigation className="w-5 h-5" /></div>
            ) : (
              <Navigation className={`w-5 h-5 ${isLocated ? 'text-white' : 'text-blue-600'}`} />
            )}
            <span className="hidden md:inline ml-2">
              {isLocating ? 'Localisation...' : isLocated ? 'Ma position' : 'Me localiser'}
            </span>
          </Button>

          {showNearbyInfo && isLocated && (
            <Card className="p-3 shadow-xl bg-white max-w-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">
                      {nearbyCount > 0 ? `${nearbyCount} candidat${nearbyCount > 1 ? 's' : ''} à proximité` : 'Aucun candidat à proximité'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nearbyCount > 0 ? 'Dans un rayon de 50 km' : 'Essayez d\'élargir la zone'}
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowNearbyInfo(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Distance measure tool */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-1rem)] md:max-w-sm">
          <Button
            onClick={handleToggleMeasure}
            variant={measureActive ? "default" : "outline"}
            size="lg"
            className={`shadow-lg min-h-[48px] ${measureActive ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50'}`}
          >
            <Ruler className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">{measureActive ? 'Mode mesure actif' : 'Mesurer distance'}</span>
            <span className="sm:hidden">{measureActive ? 'Actif' : 'Mesurer'}</span>
          </Button>

          {measureActive && (
            <Card className="p-3 md:p-4 shadow-xl bg-white w-full">
              {!measureStart && !measureEnd && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Étape 1/2</p>
                  <p>Cliquez sur un premier marqueur pour commencer</p>
                </div>
              )}
              {measureStart && !measureEnd && (
                <div className="text-sm">
                  <p className="font-semibold mb-2 text-blue-600">Étape 2/2</p>
                  <p className="text-muted-foreground mb-3">Point de départ :</p>
                  <p className="font-medium">{measureStart.name}</p>
                  <p className="text-muted-foreground mt-3">Cliquez sur un deuxième marqueur</p>
                </div>
              )}
              {measureStart && measureEnd && straightDistance !== null && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Résultats</h3>
                    <Button onClick={handleResetMeasure} variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 mb-4 text-sm">
                    <div><p className="text-muted-foreground text-xs">De</p><p className="font-medium">{measureStart.name}</p></div>
                    <div><p className="text-muted-foreground text-xs">À</p><p className="font-medium">{measureEnd.name}</p></div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{straightDistance.toFixed(1)} km</p>
                    <p className="text-xs text-muted-foreground mt-1">Distance à vol d'oiseau</p>
                  </div>
                  <Button onClick={handleResetMeasure} variant="outline" size="sm" className="w-full mt-4">
                    Nouvelle mesure
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
