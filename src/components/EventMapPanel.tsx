import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
} from 'lucide-react';
import { Camera, LPRDetection, FaceDetection, MotionAlert } from '../types';

interface EventMapPanelProps {
  cameras: Camera[];
  lprDetections: LPRDetection[];
  faceDetections: FaceDetection[];
  alerts: MotionAlert[];
}

export const EventMapPanel: React.FC<EventMapPanelProps> = ({
  cameras,
  lprDetections,
  faceDetections,
  alerts,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'LPR' | 'FACIAL' | 'MOTION'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const defaultCenter = cameras.length > 0
    ? { lat: cameras[0].lat, lng: cameras[0].lng }
    : { lat: -17.0397, lng: -39.5312 };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if ((el as any)._leaflet_id) {
      (el as any)._leaflet_id = null;
    }

    let map: L.Map;
    try {
      map = L.map(el, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstance.current = map;
    } catch (err) {
      console.warn('EventMapPanel Leaflet init warning:', err);
    }

    return () => {
      if (layerGroupRef.current) {
        try { layerGroupRef.current.clearLayers(); } catch {}
        layerGroupRef.current = null;
      }
      if (mapInstance.current) {
        try { mapInstance.current.remove(); } catch {}
        mapInstance.current = null;
      }
      if (el && (el as any)._leaflet_id) {
        (el as any)._leaflet_id = null;
      }
    };
  }, []);

  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();

    // Add Markers for LPR Detections
    if (filterType === 'ALL' || filterType === 'LPR') {
      lprDetections.forEach((det) => {
        if (
          searchTerm &&
          !det.plate.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !det.cameraName.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return;
        }

        const iconHtml = `<div class="w-8 h-8 rounded-full ${
          det.isStolenAlert ? 'bg-rose-600 animate-bounce' : 'bg-emerald-600'
        } border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">🚘</div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([det.latitude, det.longitude], { icon: customIcon });
        marker.on('click', () => setSelectedEvent({ type: 'LPR', data: det }));
        marker.addTo(layerGroup);
      });
    }

    // Add Markers for Facial Detections
    if (filterType === 'ALL' || filterType === 'FACIAL') {
      faceDetections.forEach((fdet) => {
        const cam = cameras.find((c) => c.id === fdet.cameraId) || cameras[0];
        if (!cam) return;

        if (
          searchTerm &&
          !fdet.personName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !fdet.cameraName.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return;
        }

        const iconHtml = `<div class="w-8 h-8 rounded-full ${
          fdet.isWatchlistAlert ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'
        } border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">👤</div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([cam.lat, cam.lng], { icon: customIcon });
        marker.on('click', () => setSelectedEvent({ type: 'FACIAL', data: fdet }));
        marker.addTo(layerGroup);
      });
    }
  }, [filterType, searchTerm, lprDetections, faceDetections, cameras]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white tracking-tight">Mapa Georreferenciado de Ocorrências</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              TEMPO REAL GIS
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Mapeamento espacial unificado de passagens LPR, recohecimento facial watchlist e alertas de invasão.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('LPR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'LPR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            LPR Placas
          </button>
          <button
            onClick={() => setFilterType('FACIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'FACIAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Facial
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 h-[550px] relative overflow-hidden shadow-2xl">
          <div ref={containerRef} className="w-full h-full rounded-xl z-10" />
        </div>

        {/* Selected Event Details Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Detalhes do Evento Selecionado</h3>

          {selectedEvent ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {selectedEvent.type}
                </span>

                {selectedEvent.type === 'LPR' && (
                  <div className="space-y-2 pt-1">
                    <img
                      src={selectedEvent.data.carImageUrl}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <p className="text-base font-black text-emerald-400">{selectedEvent.data.plate}</p>
                    <p className="text-slate-300">{selectedEvent.data.cameraName}</p>
                    <p className="text-slate-400">{selectedEvent.data.address}</p>
                    <p className="text-[10px] text-slate-500">{selectedEvent.data.timestamp}</p>
                  </div>
                )}

                {selectedEvent.type === 'FACIAL' && (
                  <div className="space-y-2 pt-1">
                    <img
                      src={selectedEvent.data.faceCropUrl}
                      className="w-24 h-24 object-cover rounded-xl mx-auto ring-2 ring-indigo-500"
                    />
                    <p className="text-sm font-bold text-white text-center">
                      {selectedEvent.data.personName || 'Pessoa Desconhecida'}
                    </p>
                    <p className="text-center text-indigo-400 font-bold">
                      Similaridade: {selectedEvent.data.similarity}%
                    </p>
                    <p className="text-slate-400 text-center">{selectedEvent.data.cameraName}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 italic">
              Clique em um marcador no mapa para inspecionar a evidência e local do evento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
