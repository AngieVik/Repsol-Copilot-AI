import React from 'react';
import { GeoCoordinates } from '../types';

interface InteractiveMapProps {
  location: GeoCoordinates | null;
  destination: string;
  stationLocationName?: string;
  onSync?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ location, destination, stationLocationName, onSync }) => {
  
  // Helper to convert heading degrees to cardinal direction
  const getCardinalDirection = (heading: number | null | undefined) => {
    if (heading === null || heading === undefined) return null;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(((heading %= 360) < 0 ? heading + 360 : heading) / 45) % 8;
    return directions[index];
  };

  const latitude = location?.latitude.toFixed(5) || "00.00000";
  const longitude = location?.longitude.toFixed(5) || "00.00000";
  const heading = location?.heading;
  const speed = location?.speed ? Math.round(location.speed * 3.6) : 0;
  
  const directionStr = getCardinalDirection(heading);

  return (
    <div className="w-full h-full min-h-[250px] bg-gray-900 flex flex-col relative overflow-hidden p-6 select-none">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(234, 179, 8, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(234, 179, 8, 0.1) 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Main Data Layout */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        
        {/* Top Row: Auto-Detect & Status */}
        <div className="flex justify-between items-start">
          <div className="border-l-2 border-yellow-500 pl-3">
             <div className="text-[10px] text-gray-400 uppercase tracking-widest">Ruta Detectada (Vía)</div>
             <div className="text-lg text-white font-mono font-bold truncate max-w-[200px] shadow-black drop-shadow-md flex flex-col">
                {stationLocationName ? (
                    <span className="text-yellow-500">{stationLocationName}</span>
                ) : (
                    <span className="text-gray-500 text-sm italic">ESPERANDO DATOS...</span>
                )}
             </div>
          </div>
          
          <div className="text-right flex flex-col items-end gap-2">
             <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest">Estado GPS</div>
                <div className={`text-xs font-bold font-mono ${location ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
                {location ? "SEÑAL BLOQUEADA" : "BUSCANDO SATÉLITES"}
                </div>
             </div>
             
             {onSync && (
                <button 
                  onClick={onSync}
                  className="bg-yellow-900/40 hover:bg-yellow-800/60 text-yellow-500 text-[10px] font-bold border border-yellow-700/50 px-3 py-1.5 rounded uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="text-xs">⌖</span> Sincronizar GPS
                </button>
             )}
          </div>
        </div>

        {/* Center Row: Speed & Heading */}
        <div className="flex items-center justify-center gap-8 my-4">
           {/* Speed */}
           <div className="text-center">
              <div className="text-6xl font-black text-white tracking-tighter shadow-black drop-shadow-xl">
                {speed}
              </div>
              <div className="text-xs text-yellow-500 font-bold uppercase tracking-[0.2em] border-t border-yellow-500/30 pt-1 mt-1">
                km/h
              </div>
           </div>

           {/* Compass / Heading */}
           <div className="w-px h-16 bg-gray-700 mx-4"></div>

           <div className="text-center w-24">
              <div className={`text-4xl font-bold font-mono ${directionStr ? 'text-gray-300' : 'text-yellow-600/50 text-2xl animate-pulse'}`}>
                {directionStr || "---"}
              </div>
              <div className="text-[10px] text-gray-500 uppercase mt-1">
                {directionStr ? `Rumbo ${Math.round(heading || 0)}°` : "CALCULANDO..."}
              </div>
           </div>
        </div>

        {/* Bottom Row: Coordinates */}
        <div className="flex justify-between items-end">
           <div className="font-mono text-[10px] text-gray-500 space-y-1">
              <div>LAT: <span className="text-yellow-500/80">{latitude}</span></div>
              <div>LNG: <span className="text-yellow-500/80">{longitude}</span></div>
           </div>
        </div>
      </div>
      
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50"></div>

    </div>
  );
};