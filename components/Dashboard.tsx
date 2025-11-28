
import React, { useState } from 'react';
import { ScanResult, GeoCoordinates, SearchPreferences } from '../types';
import { InteractiveMap } from './InteractiveMap';

interface DashboardProps {
  scanResult: ScanResult | null;
  location: GeoCoordinates | null;
  statusMessage: string;
  prefs: SearchPreferences;
  onUpdateDestination: (dest: string) => void;
  isLocked: boolean; // Wake Lock status
  isScanning: boolean;
  onToggleHud: () => void;
  onForceSync: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  scanResult, 
  location, 
  statusMessage,
  prefs,
  onUpdateDestination,
  isLocked,
  isScanning,
  onToggleHud,
  onForceSync
}) => {
  const [localDestination, setLocalDestination] = useState(prefs.destination);

  const handleDestinationBlur = () => {
    if (localDestination !== prefs.destination) {
      onUpdateDestination(localDestination);
    }
  };

  const speedKmph = location?.speed ? Math.round(location.speed * 3.6) : 0;

  // --- HUD MODE RENDER ---
  if (prefs.isHudMode) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 transform scale-y-[-1]">
        {/* Mirrored for HUD reflection */}
        <div className="w-full text-center space-y-6">
           <h1 className="text-6xl font-black text-yellow-500">{speedKmph} <span className="text-2xl text-gray-400">KM/H</span></h1>
           
           <div className="border-t-4 border-yellow-500 w-1/2 mx-auto my-4"></div>

           {scanResult?.alertTriggered && (
             <div className="animate-pulse">
                <h2 className="text-4xl font-bold text-white uppercase">{scanResult.nearestStation.name}</h2>
                <h3 className="text-5xl font-black text-yellow-500 mt-2">{scanResult.nearestStation.distance}</h3>
                <div className="text-xl text-gray-300 font-mono mt-2">{scanResult.nearestStation.locationDetails}</div>
             </div>
           )}

           {!scanResult?.alertTriggered && (
             <h2 className="text-3xl font-bold text-gray-600 uppercase">ESCANENADO RUTA...</h2>
           )}

           <div className="flex justify-center gap-8 mt-8">
              {prefs.monitorTraffic && (
                <div className="text-center">
                   <div className={`text-2xl font-bold ${scanResult?.traffic.status.includes('Atasco') ? 'text-red-500' : 'text-green-500'}`}>
                      {scanResult?.traffic.status || "TRÁFICO"}
                   </div>
                </div>
              )}
           </div>
           
           <button onClick={onToggleHud} className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-30 text-white border border-white px-4 py-2 rounded text-lg">
             SALIR HUD
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-32">
      
      {/* --- STATUS HEADER --- */}
      <div className="bg-gradient-to-r from-gray-900 to-black rounded-lg p-1 border-b border-yellow-500/50 mb-4 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Audio Visualizer Animation when scanning */}
            {isScanning ? (
               <div className="flex items-end gap-0.5 h-4">
                 <div className="w-1 bg-yellow-500 animate-[bounce_0.8s_infinite] h-2"></div>
                 <div className="w-1 bg-yellow-500 animate-[bounce_1.2s_infinite] h-3"></div>
                 <div className="w-1 bg-yellow-500 animate-[bounce_0.6s_infinite] h-1"></div>
                 <div className="w-1 bg-yellow-500 animate-[bounce_1.0s_infinite] h-4"></div>
               </div>
            ) : (
               <div className="w-2 h-2 rounded-full bg-gray-600"></div>
            )}
            <span className="text-yellow-500 font-mono text-xs uppercase tracking-widest">
              {statusMessage}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono text-right flex flex-col items-end">
             <div className="flex gap-2">
               <span>{location ? `GPS LOCKED` : "GPS SEARCHING..."}</span>
               <span title="Pantalla encendida" className={isLocked ? "text-green-500" : "text-gray-700"}>
                 {isLocked ? "☀ WAKE" : "☾ DIM"}
               </span>
               <button onClick={onToggleHud} className="text-yellow-500 hover:text-white font-bold ml-2 border border-yellow-900 px-1 rounded bg-black/50">
                 HUD MODE
               </button>
             </div>
             <span className="text-yellow-600 font-bold">{speedKmph} KM/H</span>
          </div>
        </div>
      </div>

      {/* --- TELEMETRY COCKPIT (Formerly Map) --- */}
      <div className="relative overflow-hidden rounded-xl border border-gray-700 bg-gray-900 mb-6 shadow-lg h-56 md:h-64 group">
           <InteractiveMap 
             location={location} 
             destination={prefs.destination} 
             stationLocationName={scanResult?.nearestStation?.name}
             onSync={onForceSync}
           />
      </div>

      {/* --- UNIFIED RESULTS CARD --- */}
      <div className={`relative overflow-hidden rounded-2xl border-l-4 transition-all duration-500 mb-6 group ${
        scanResult?.alertTriggered 
          ? "bg-yellow-950/30 border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]" 
          : "bg-gray-900 border-gray-700"
      }`}>
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-800 to-transparent opacity-20 rounded-bl-full pointer-events-none"></div>

        {/* --- Main Gas Station Info --- */}
        <div className="p-6 pb-4 border-b border-gray-800">
           <div className="flex justify-between items-start mb-1">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Próxima Estación</h2>
              {scanResult?.alertTriggered && (
                <div className="px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-wide rounded animate-pulse">
                  ⚠️ EN RUTA
                </div>
              )}
           </div>
           
           <div className="flex flex-col md:flex-row md:items-baseline gap-2">
             <span className="text-2xl md:text-3xl font-bold text-white font-mono truncate tracking-tight silver-text">
               {scanResult ? scanResult.nearestStation.name : "..."}
             </span>
             {scanResult && (
               <span className="text-xl font-mono text-yellow-500">
                 {scanResult.nearestStation.distance}
               </span>
             )}
           </div>
           
           {/* New Location Details (KM Point) */}
           {scanResult && scanResult.alertTriggered && (
             <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm md:text-base font-bold text-gray-300 font-mono tracking-wide border-b border-yellow-900/50 pb-0.5">
                   {scanResult.nearestStation.locationDetails}
                </span>
             </div>
           )}

           <div className="mt-2 text-xs md:text-sm text-gray-500 font-mono flex items-center gap-2">
              <span className="text-yellow-600">>>></span> 
              Siguiente: <span className="text-gray-300">{scanResult ? `${scanResult.nextStation.name} (${scanResult.nextStation.distance})` : "---"}</span>
           </div>
        </div>

        {/* --- Unified Secondary Data Grid (Internal) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 bg-black/20">
            
            {/* Column 1: Environmental (Traffic & Weather) */}
            <div className="p-4 space-y-4">
              {/* Traffic */}
              {prefs.monitorTraffic && (
                <div>
                   <h3 className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     Tráfico ({scanResult?.traffic.status})
                   </h3>
                   <p className="text-xs text-gray-300 leading-relaxed">
                     {scanResult?.traffic.summary || "Analizando..."}
                   </p>
                </div>
              )}

              {/* Weather */}
              {prefs.monitorWeather && (
                <div className={`${prefs.monitorTraffic ? 'pt-4 border-t border-gray-800/50' : ''}`}>
                   <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                     Clima ({scanResult?.weather.condition})
                   </h3>
                   <p className="text-xs text-gray-300">
                     {scanResult?.weather.summary || "Analizando..."}
                   </p>
                </div>
              )}
            </div>

            {/* Column 2: POIs (Rest) */}
            <div className="p-4 space-y-4">
               {/* Rest */}
               {prefs.filterRest && (
                 <div>
                    <h3 className="text-green-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Descanso
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {scanResult?.poi.restAreas || "..."}
                    </p>
                 </div>
               )}
               
               {!prefs.filterRest && (
                 <div className="h-full flex items-center justify-center opacity-30">
                   <p className="text-[10px] uppercase text-gray-500 text-center">Sin filtros adicionales<br/>activados</p>
                 </div>
               )}
            </div>
        </div>
        
        {/* Grounding Attribution Footnote */}
        {scanResult?.groundingUrls && scanResult.groundingUrls.length > 0 && (
          <div className="px-6 py-2 bg-black border-t border-gray-800 flex flex-wrap gap-2 items-center">
            <span className="text-[9px] text-gray-600 uppercase">Fuentes:</span>
            {scanResult.groundingUrls.slice(0, 3).map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-yellow-700 hover:text-yellow-500 truncate max-w-[150px]">
                {new URL(url).hostname}
              </a>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
