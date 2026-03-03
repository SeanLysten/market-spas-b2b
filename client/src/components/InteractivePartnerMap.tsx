import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation, MapPin, X, Ruler, Route, GripVertical, ExternalLink, Trash2, Plus, Car, Clock, RotateCcw, Save, FolderOpen, Bookmark, Loader2, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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

interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isUserLocation?: boolean;
}

interface RouteResult {
  distance: number; // km
  duration: number; // minutes
  geometry: [number, number][]; // lat,lng pairs
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

// OSRM routing API (gratuit, open source)
const fetchOSRMRoute = async (points: RoutePoint[]): Promise<RouteResult | null> => {
  if (points.length < 2) return null;
  try {
    const coords = points.map(p => `${p.lng},${p.lat}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`
    );
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const geometry: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
      );
      return {
        distance: route.distance / 1000, // meters to km
        duration: route.duration / 60, // seconds to minutes
        geometry,
      };
    }
  } catch (e) {
    console.warn('[Map] OSRM routing failed:', e);
  }
  return null;
};

// Generate Google Maps directions URL
const generateGoogleMapsUrl = (points: RoutePoint[]): string => {
  if (points.length < 2) return '';
  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const waypoints = points.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  if (waypoints) url += `&waypoints=${waypoints}`;
  return url;
};

// Generate Waze directions URL
const generateWazeUrl = (points: RoutePoint[]): string => {
  if (points.length < 1) return '';
  const last = points[points.length - 1];
  return `https://www.waze.com/ul?ll=${last.lat},${last.lng}&navigate=yes`;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// ============================================
// COMPONENT
// ============================================

interface InteractivePartnerMapProps {
  candidates: Candidate[];
  statusFilter: string;
  onRefresh?: () => void;
}

export default function InteractivePartnerMap({
  candidates,
  statusFilter,
  onRefresh,
}: InteractivePartnerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const geocodeCacheRef = useRef<Map<string, { lat: number; lng: number } | null>>(new Map());

  // Route mode (replaces old measure mode)
  const [routeMode, setRouteMode] = useState<'off' | 'simple' | 'tour'>('off');
  const routeModeRef = useRef<'off' | 'simple' | 'tour'>('off');
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const routePointsRef = useRef<RoutePoint[]>([]);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const routeMarkersRef = useRef<L.Marker[]>([]);

  // User location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const userLocationRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
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

  // Mutation pour sauvegarder les coordonnées géocodées en base
  const saveCoordsMutation = trpc.admin.candidates.saveCoordinates.useMutation();

  // tRPC mutations for status change, visited toggle, increment calls/emails
  const updateMutation = trpc.admin.candidates.update.useMutation({
    onSuccess: () => {
      toast.success('Statut mis à jour');
      onRefresh?.();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const toggleVisitedMutation = trpc.admin.candidates.toggleVisited.useMutation({
    onSuccess: () => {
      toast.success('Statut de visite mis à jour');
      onRefresh?.();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const incrementPhoneMutation = trpc.admin.candidates.incrementPhoneCall.useMutation({
    onSuccess: () => {
      toast.success('Appel enregistré');
      onRefresh?.();
    },
  });

  const incrementEmailMutation = trpc.admin.candidates.incrementEmail.useMutation({
    onSuccess: () => {
      toast.success('Email enregistré');
      onRefresh?.();
    },
  });

  // Saved routes
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [loadedRouteId, setLoadedRouteId] = useState<number | null>(null);

  const savedRoutesQuery = trpc.savedRoutes.list.useQuery(undefined, {
    enabled: showSavedRoutes,
  });

  const saveRouteMutation = trpc.savedRoutes.save.useMutation({
    onSuccess: () => {
      toast.success('Itinéraire sauvegardé');
      setShowSaveForm(false);
      setSaveName('');
      setSaveNotes('');
      savedRoutesQuery.refetch();
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const deleteRouteMutation = trpc.savedRoutes.delete.useMutation({
    onSuccess: () => {
      toast.success('Itinéraire supprimé');
      savedRoutesQuery.refetch();
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleSaveRoute = () => {
    if (!saveName.trim()) {
      toast.error('Veuillez donner un nom à l\'itinéraire');
      return;
    }
    if (routePoints.length < 2) {
      toast.error('L\'itinéraire doit contenir au moins 2 points');
      return;
    }
    saveRouteMutation.mutate({
      name: saveName.trim(),
      type: routeMode === 'tour' ? 'tour' : 'simple',
      points: JSON.stringify(routePoints),
      totalDistance: routeResult?.distance?.toFixed(2),
      totalDuration: routeResult?.duration?.toFixed(2),
      notes: saveNotes.trim() || undefined,
    });
  };

  const handleLoadRoute = (route: { id: number; name: string; type: string; points: string; totalDistance: string | null; totalDuration: string | null }) => {
    try {
      const points: RoutePoint[] = JSON.parse(route.points);
      if (points.length < 2) {
        toast.error('Itinéraire invalide');
        return;
      }
      // Set mode
      const mode = route.type === 'tour' ? 'tour' : 'simple';
      routeModeRef.current = mode;
      setRouteMode(mode as 'simple' | 'tour');
      // Set points
      routePointsRef.current = points;
      setRoutePoints(points);
      setLoadedRouteId(route.id);
      setShowSavedRoutes(false);
      // Calculate route
      calculateRoute(points);
      toast.success(`Itinéraire "${route.name}" chargé`);
    } catch {
      toast.error('Erreur lors du chargement');
    }
  };

  // Refs to keep mutations accessible in popup event handlers
  const updateMutationRef = useRef(updateMutation);
  const toggleVisitedMutationRef = useRef(toggleVisitedMutation);
  const incrementPhoneMutationRef = useRef(incrementPhoneMutation);
  const incrementEmailMutationRef = useRef(incrementEmailMutation);
  useEffect(() => {
    updateMutationRef.current = updateMutation;
    toggleVisitedMutationRef.current = toggleVisitedMutation;
    incrementPhoneMutationRef.current = incrementPhoneMutation;
    incrementEmailMutationRef.current = incrementEmailMutation;
  }, [updateMutation, toggleVisitedMutation, incrementPhoneMutation, incrementEmailMutation]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.5, 2.5],
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

  // Geocode candidates
  useEffect(() => {
    let cancelled = false;

    const geocodeAll = async () => {
      const items: GeocodedCandidate[] = [];
      const cache = geocodeCacheRef.current;
      const coordsToSave: { id: number; latitude: string; longitude: string }[] = [];

      const filtered = statusFilter === 'all'
        ? candidates
        : candidates.filter(c => c.status === statusFilter);

      for (const candidate of filtered) {
        if (cancelled) return;

        if (candidate.latitude && candidate.longitude) {
          const lat = parseFloat(candidate.latitude);
          const lng = parseFloat(candidate.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            items.push({ id: `candidate-${candidate.id}`, lat, lng, data: candidate });
            continue;
          }
        }

        const address = `${candidate.city}, France`;
        let coords = cache.get(`candidate-${address}`);
        if (coords === undefined) {
          coords = await geocodeAddress(address);
          cache.set(`candidate-${address}`, coords);
          if (coords) {
            coordsToSave.push({ id: candidate.id, latitude: String(coords.lat), longitude: String(coords.lng) });
          }
          await new Promise(r => setTimeout(r, 200));
        }
        if (coords) {
          items.push({ id: `candidate-${candidate.id}`, lat: coords.lat, lng: coords.lng, data: candidate });
        }

        if (items.length % 5 === 0 && !cancelled) {
          setGeocodedItems([...items]);
        }
      }

      if (!cancelled) {
        setGeocodedItems(items);
      }

      if (coordsToSave.length > 0 && !cancelled) {
        try {
          saveCoordsMutation.mutate(coordsToSave);
        } catch (e) {
          console.warn('[Map] Erreur sauvegarde coordonnées:', e);
        }
      }
    };

    geocodeAll();
    return () => { cancelled = true; };
  }, [candidates, statusFilter]);

  // ============================================
  // ROUTE CALCULATION
  // ============================================

  const calculateRoute = useCallback(async (points: RoutePoint[]) => {
    if (points.length < 2) {
      clearRouteFromMap();
      setRouteResult(null);
      return;
    }
    setIsCalculating(true);
    const result = await fetchOSRMRoute(points);
    setIsCalculating(false);
    if (result) {
      setRouteResult(result);
      drawRouteOnMap(result.geometry, points);
    } else {
      toast.error('Impossible de calculer l\'itinéraire routier');
      // Fallback: show straight lines
      const straightGeometry: [number, number][] = points.map(p => [p.lat, p.lng]);
      const totalDist = points.reduce((sum, p, i) => {
        if (i === 0) return 0;
        return sum + calculateDistance(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng);
      }, 0);
      setRouteResult({ distance: totalDist, duration: totalDist / 60 * 60, geometry: straightGeometry });
      drawRouteOnMap(straightGeometry, points);
    }
  }, []);

  const drawRouteOnMap = (geometry: [number, number][], points: RoutePoint[]) => {
    if (!mapRef.current) return;
    clearRouteFromMap();

    // Draw route line
    const routeLine = L.polyline(geometry, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.8,
      lineJoin: 'round',
    }).addTo(mapRef.current);
    routeLayerRef.current = routeLine;

    // Draw numbered markers for each stop
    points.forEach((point, index) => {
      if (!mapRef.current) return;
      const isStart = index === 0;
      const isEnd = index === points.length - 1;
      const color = isStart ? '#16a34a' : isEnd ? '#dc2626' : '#2563eb';
      const label = point.isUserLocation ? '📍' : `${index + 1}`;

      const icon = L.divIcon({
        className: 'route-stop-marker',
        html: `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: ${color}; color: white; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          font-size: ${point.isUserLocation ? '16px' : '14px'};
          border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([point.lat, point.lng], { icon, zIndexOffset: 1000 + index })
        .addTo(mapRef.current!);
      marker.bindTooltip(point.name, { permanent: false, direction: 'top', offset: [0, -20] });
      routeMarkersRef.current.push(marker);
    });

    // Fit map to route
    mapRef.current.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
  };

  const clearRouteFromMap = () => {
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    routeMarkersRef.current.forEach(m => {
      if (mapRef.current) mapRef.current.removeLayer(m);
    });
    routeMarkersRef.current = [];
  };

  // ============================================
  // ROUTE POINT MANAGEMENT
  // ============================================

  const addRoutePoint = useCallback((point: RoutePoint) => {
    const currentMode = routeModeRef.current;
    const currentPoints = routePointsRef.current;

    // Check if point already in route
    if (currentPoints.some(p => p.id === point.id)) {
      toast.info(`${point.name} est déjà dans l'itinéraire`);
      return;
    }

    if (currentMode === 'simple') {
      // Simple mode: max 2 points
      if (currentPoints.length === 0) {
        const newPoints = [point];
        routePointsRef.current = newPoints;
        setRoutePoints(newPoints);
        toast.info(`Point de départ : ${point.name}. Cliquez sur un deuxième point.`);
      } else if (currentPoints.length === 1) {
        const newPoints = [...currentPoints, point];
        routePointsRef.current = newPoints;
        setRoutePoints(newPoints);
        calculateRoute(newPoints);
      } else {
        // Replace: start new measurement
        const newPoints = [point];
        routePointsRef.current = newPoints;
        setRoutePoints(newPoints);
        setRouteResult(null);
        clearRouteFromMap();
        toast.info(`Nouveau point de départ : ${point.name}`);
      }
    } else if (currentMode === 'tour') {
      // Tour mode: unlimited points
      const newPoints = [...currentPoints, point];
      routePointsRef.current = newPoints;
      setRoutePoints(newPoints);
      if (newPoints.length >= 2) {
        calculateRoute(newPoints);
      } else {
        toast.info(`Étape ajoutée : ${point.name}. Ajoutez d'autres points.`);
      }
    }
  }, [calculateRoute]);

  const removeRoutePoint = useCallback((index: number) => {
    const newPoints = routePointsRef.current.filter((_, i) => i !== index);
    routePointsRef.current = newPoints;
    setRoutePoints(newPoints);
    if (newPoints.length >= 2) {
      calculateRoute(newPoints);
    } else {
      clearRouteFromMap();
      setRouteResult(null);
    }
  }, [calculateRoute]);

  const moveRoutePoint = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    const newPoints = [...routePointsRef.current];
    [newPoints[fromIndex], newPoints[toIndex]] = [newPoints[toIndex], newPoints[fromIndex]];
    routePointsRef.current = newPoints;
    setRoutePoints(newPoints);
    if (newPoints.length >= 2) {
      calculateRoute(newPoints);
    }
  }, [calculateRoute]);

  const addUserLocationToRoute = useCallback(() => {
    const loc = userLocationRef.current;
    if (!loc) {
      toast.error('Veuillez d\'abord activer votre géolocalisation');
      return;
    }
    addRoutePoint({
      id: 'user-location',
      name: 'Ma position',
      lat: loc.lat,
      lng: loc.lng,
      isUserLocation: true,
    });
  }, [addRoutePoint]);

  const resetRoute = useCallback(() => {
    routePointsRef.current = [];
    setRoutePoints([]);
    setRouteResult(null);
    clearRouteFromMap();
  }, []);

  const handleToggleRouteMode = (mode: 'simple' | 'tour') => {
    if (routeMode === mode) {
      // Turn off
      routeModeRef.current = 'off';
      setRouteMode('off');
      resetRoute();
    } else {
      routeModeRef.current = mode;
      setRouteMode(mode);
      resetRoute();
    }
  };

  // ============================================
  // UPDATE MARKERS
  // ============================================

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

      const isValidated = c.status === 'valide';
      const markerBg = isValidated ? 
        `<div style="position: relative; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #16a34a; overflow: hidden; background: white;">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/logomarketspa_ec8e23e8.png" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #16a34a; margin: -2px auto 0;"></div>
        </div>` :
        `<div style="
          width: 32px; height: 32px; border-radius: 50%;
          background: ${priorityColor}; color: ${textColor};
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 13px;
          border: ${visitedBorder};
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
        ">${c.priorityScore}</div>`;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: markerBg,
        iconSize: isValidated ? [40, 52] : [32, 32],
        iconAnchor: isValidated ? [20, 52] : [16, 16],
      });

      const marker = L.marker([item.lat, item.lng], { icon }).addTo(mapRef.current!);

      // Popup content
      const statusButtons = Object.entries(CANDIDATE_STATUS_LABELS)
        .map(([key, label]) => `<button data-action="status" data-candidate-id="${c.id}" data-status="${key}" style="padding: 4px 10px; border-radius: 8px; font-size: 11px; border: 1px solid ${c.status === key ? '#16a34a' : '#e5e7eb'}; background: ${c.status === key ? '#dcfce7' : 'white'}; color: ${c.status === key ? '#16a34a' : '#374151'}; cursor: pointer; font-weight: ${c.status === key ? '600' : '400'};">${label}</button>`)
        .join('');

      const popupContent = `
        <div style="min-width: 280px; max-width: 360px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 4px;">${c.companyName}</h3>
            <p style="font-size: 13px; color: #6b7280; margin: 0;">${c.fullName} — ${c.city}</p>
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 12px;">${statusButtons}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="background: #f9fafb; border-radius: 8px; padding: 8px; text-align: center;">
              <p style="font-size: 11px; color: #6b7280; margin: 0;">Score</p>
              <p style="font-size: 18px; font-weight: 700; color: ${priorityColor}; margin: 2px 0 0;">${c.priorityScore}/8</p>
            </div>
            <div style="background: #f9fafb; border-radius: 8px; padding: 8px; text-align: center;">
              <p style="font-size: 11px; color: #6b7280; margin: 0;">Visité</p>
              <button data-action="toggle-visited" data-candidate-id="${c.id}" data-visited="${c.visited}" style="font-size: 18px; font-weight: 700; color: ${c.visited ? '#16a34a' : '#ef4444'}; margin: 2px 0 0; background: none; border: none; cursor: pointer;">${c.visited ? '✓ Oui' : '✗ Non'}</button>
            </div>
          </div>
          <div style="display: flex; gap: 6px; margin-bottom: 12px;">
            <button data-action="increment-phone" data-candidate-id="${c.id}" style="flex: 1; padding: 6px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; font-size: 12px;">📞 ${c.phoneCallsCount}</button>
            <button data-action="increment-email" data-candidate-id="${c.id}" style="flex: 1; padding: 6px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer; font-size: 12px;">✉️ ${c.emailsSentCount}</button>
          </div>
          ${c.notes ? `<p style="font-size: 12px; color: #6b7280; background: #f9fafb; padding: 8px; border-radius: 8px; margin: 0;">${c.notes}</p>` : ''}
        </div>
      `;

      const popup = L.popup({
        maxWidth: 380,
        className: 'custom-popup',
        closeButton: true,
        autoPan: true,
        autoPanPadding: L.point(60, 60),
      }).setContent(popupContent);

      // Attach event listeners after popup opens
      popup.on('add', () => {
        const container = popup.getElement();
        if (!container) return;

        container.querySelectorAll<HTMLButtonElement>('[data-action="status"]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const candidateId = parseInt(btn.dataset.candidateId || '0');
            const newStatus = btn.dataset.status || 'non_contacte';
            updateMutationRef.current.mutate({ id: candidateId, updates: { status: newStatus as any } });
          });
        });

        container.querySelectorAll<HTMLButtonElement>('[data-action="toggle-visited"]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const candidateId = parseInt(btn.dataset.candidateId || '0');
            const currentlyVisited = btn.dataset.visited === '1';
            toggleVisitedMutationRef.current.mutate({ candidateId, visited: !currentlyVisited });
          });
        });

        container.querySelectorAll<HTMLButtonElement>('[data-action="increment-phone"]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const candidateId = parseInt(btn.dataset.candidateId || '0');
            incrementPhoneMutationRef.current.mutate({ candidateId });
          });
        });

        container.querySelectorAll<HTMLButtonElement>('[data-action="increment-email"]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const candidateId = parseInt(btn.dataset.candidateId || '0');
            incrementEmailMutationRef.current.mutate({ candidateId });
          });
        });
      });

      marker.on('click', () => {
        const currentMode = routeModeRef.current;
        if (currentMode !== 'off') {
          addRoutePoint({ id: item.id, name: c.companyName, lat: item.lat, lng: item.lng });
        } else {
          marker.bindPopup(popup).openPopup();
        }
      });

      markersRef.current.push(marker);
    });

    if (geocodedItems.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(geocodedItems.map(i => [i.lat, i.lng]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [geocodedItems, addRoutePoint]);

  // User location
  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const loc = { lat: latitude, lng: longitude, accuracy };
        setUserLocation(loc);
        userLocationRef.current = loc;
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

        // Also make user marker clickable in route mode
        userMarker.on('click', () => {
          if (routeModeRef.current !== 'off') {
            addRoutePoint({
              id: 'user-location',
              name: 'Ma position',
              lat: latitude,
              lng: longitude,
              isUserLocation: true,
            });
          }
        });

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
      () => { setIsLocating(false); toast.error('Impossible d\'obtenir votre position'); },
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
        .route-stop-marker { background: transparent; border: none; }
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

        {/* Route tools */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[1000] flex flex-col gap-2 max-w-[calc(100vw-1rem)] md:max-w-sm">
          {/* Mode buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleToggleRouteMode('simple')}
              variant={routeMode === 'simple' ? "default" : "outline"}
              size="lg"
              className={`shadow-lg min-h-[44px] flex-1 ${routeMode === 'simple' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50'}`}
            >
              <Ruler className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Itinéraire</span>
              <span className="sm:hidden">A→B</span>
            </Button>
            <Button
              onClick={() => handleToggleRouteMode('tour')}
              variant={routeMode === 'tour' ? "default" : "outline"}
              size="lg"
              className={`shadow-lg min-h-[44px] flex-1 ${routeMode === 'tour' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white hover:bg-gray-50'}`}
            >
              <Route className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Tournée</span>
              <span className="sm:hidden">Tour</span>
            </Button>
          </div>

          {/* Route panel */}
          {routeMode !== 'off' && (
            <Card className="p-3 md:p-4 shadow-xl bg-white w-full max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  {routeMode === 'simple' ? (
                    <><Ruler className="w-4 h-4 text-blue-600" /> Itinéraire</>
                  ) : (
                    <><Route className="w-4 h-4 text-purple-600" /> Tournée</>
                  )}
                </h3>
                <Button onClick={resetRoute} variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Instructions */}
              {routePoints.length === 0 && (
                <div className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                  <p className="font-medium mb-1">
                    {routeMode === 'simple' ? 'Mesurer un itinéraire' : 'Créer une tournée'}
                  </p>
                  <p className="text-xs">
                    Cliquez sur les marqueurs de la carte pour {routeMode === 'simple' ? 'définir le départ et l\'arrivée' : 'ajouter des étapes'}.
                    {isLocated && ' Vous pouvez aussi partir de votre position.'}
                  </p>
                </div>
              )}

              {/* Add user location button */}
              {isLocated && !routePoints.some(p => p.isUserLocation) && (
                <Button
                  onClick={addUserLocationToRoute}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs border-dashed"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Partir de ma position
                </Button>
              )}

              {/* Route points list */}
              {routePoints.length > 0 && (
                <div className="mt-3 space-y-1">
                  {routePoints.map((point, index) => (
                    <div
                      key={point.id + '-' + index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 group text-sm"
                    >
                      {/* Step number */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{
                          background: index === 0 ? '#16a34a' : index === routePoints.length - 1 ? '#dc2626' : '#2563eb',
                        }}
                      >
                        {point.isUserLocation ? '📍' : index + 1}
                      </div>

                      {/* Name */}
                      <span className="flex-1 truncate text-xs font-medium">{point.name}</span>

                      {/* Reorder buttons (tour mode) */}
                      {routeMode === 'tour' && routePoints.length > 2 && (
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          {index > 0 && (
                            <button
                              onClick={() => moveRoutePoint(index, 'up')}
                              className="text-gray-400 hover:text-gray-700 p-0.5"
                            >
                              <GripVertical className="w-3 h-3 rotate-180" />
                            </button>
                          )}
                          {index < routePoints.length - 1 && (
                            <button
                              onClick={() => moveRoutePoint(index, 'down')}
                              className="text-gray-400 hover:text-gray-700 p-0.5"
                            >
                              <GripVertical className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={() => removeRoutePoint(index)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading */}
              {isCalculating && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  Calcul de l'itinéraire...
                </div>
              )}

              {/* Route result */}
              {routeResult && !isCalculating && (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <Car className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">{routeResult.distance.toFixed(1)} km</p>
                      <p className="text-[10px] text-blue-500">Distance route</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <Clock className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-orange-700">{formatDuration(routeResult.duration)}</p>
                      <p className="text-[10px] text-orange-500">Temps estimé</p>
                    </div>
                  </div>

                  {/* Navigation links */}
                  <div className="flex gap-2">
                    <a
                      href={generateGoogleMapsUrl(routePoints)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Google Maps
                      </Button>
                    </a>
                    <a
                      href={generateWazeUrl(routePoints)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Waze
                      </Button>
                    </a>
                  </div>

                  {/* Save route button */}
                  <div className="mt-3 pt-3 border-t">
                    {!showSaveForm ? (
                      <Button
                        onClick={() => setShowSaveForm(true)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Sauvegarder cet itinéraire
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nom de l'itinéraire..."
                          value={saveName}
                          onChange={(e) => setSaveName(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                        <textarea
                          placeholder="Notes (optionnel)..."
                          value={saveNotes}
                          onChange={(e) => setSaveNotes(e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveRoute}
                            size="sm"
                            className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                            disabled={saveRouteMutation.isPending}
                          >
                            {saveRouteMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5 mr-1" />
                            )}
                            Sauvegarder
                          </Button>
                          <Button
                            onClick={() => { setShowSaveForm(false); setSaveName(''); setSaveNotes(''); }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tour mode: add more hint */}
              {routeMode === 'tour' && routePoints.length >= 2 && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Cliquez sur d'autres marqueurs pour ajouter des étapes
                </p>
              )}
            </Card>
          )}
          {/* Saved routes button */}
          <Button
            onClick={() => setShowSavedRoutes(!showSavedRoutes)}
            variant={showSavedRoutes ? "default" : "outline"}
            size="lg"
            className={`shadow-lg min-h-[44px] ${showSavedRoutes ? 'bg-green-600 hover:bg-green-700' : 'bg-white hover:bg-gray-50'}`}
          >
            <Bookmark className={`w-4 h-4 mr-1 ${showSavedRoutes ? 'text-white' : 'text-green-600'}`} />
            <span className="hidden sm:inline">Mes itinéraires</span>
            <span className="sm:hidden"><FolderOpen className="w-4 h-4" /></span>
          </Button>

          {/* Saved routes panel */}
          {showSavedRoutes && (
            <Card className="p-3 md:p-4 shadow-xl bg-white w-full max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-green-600" />
                  Itinéraires sauvegardés
                </h3>
                <Button onClick={() => setShowSavedRoutes(false)} variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {savedRoutesQuery.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : !savedRoutesQuery.data || savedRoutesQuery.data.length === 0 ? (
                <div className="text-center py-6">
                  <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun itinéraire sauvegardé</p>
                  <p className="text-xs text-muted-foreground mt-1">Créez un itinéraire puis cliquez sur "Sauvegarder"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedRoutesQuery.data.map((route: any) => {
                    const pointsArr = JSON.parse(route.points || '[]');
                    const isLoaded = loadedRouteId === route.id;
                    return (
                      <div
                        key={route.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isLoaded ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                route.type === 'tour'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {route.type === 'tour' ? 'Tournée' : 'Itinéraire'}
                              </span>
                              <span className="text-sm font-semibold truncate">{route.name}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{pointsArr.length} étape{pointsArr.length > 1 ? 's' : ''}</span>
                              {route.totalDistance && (
                                <span className="flex items-center gap-0.5">
                                  <Car className="w-3 h-3" />
                                  {parseFloat(route.totalDistance).toFixed(1)} km
                                </span>
                              )}
                              {route.totalDuration && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(parseFloat(route.totalDuration))}
                                </span>
                              )}
                            </div>
                            {route.notes && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="truncate">{route.notes}</span>
                              </p>
                            )}
                            {/* List stop names */}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {pointsArr.slice(0, 5).map((p: RoutePoint, i: number) => (
                                <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {i + 1}. {p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name}
                                </span>
                              ))}
                              {pointsArr.length > 5 && (
                                <span className="text-[10px] text-gray-400">+{pointsArr.length - 5} autres</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(route.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button
                              onClick={() => handleLoadRoute(route)}
                              size="sm"
                              className={`text-xs h-7 ${
                                isLoaded
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isLoaded ? 'Actif' : 'Charger'}
                            </Button>
                            <Button
                              onClick={() => {
                                if (confirm('Supprimer cet itinéraire ?')) {
                                  deleteRouteMutation.mutate({ id: route.id });
                                  if (loadedRouteId === route.id) setLoadedRouteId(null);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
