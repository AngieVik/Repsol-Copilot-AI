import React from 'react';

interface ControlsProps {
  isScanning: boolean;
  onToggle: () => void;
  onToggleSearchBeyond: () => void;
  isSearchBeyondActive: boolean;
  isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ isScanning, onToggle, onToggleSearchBeyond, isSearchBeyondActive, isLoading }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-gray-800 flex flex-col md:flex-row items-center justify-center gap-4 z-50">
      
      {/* Main Toggle */}
      <button
        onClick={onToggle}
        className={`w-full md:w-auto px-10 py-4 rounded-sm font-black text-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] transform transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider skew-x-[-10deg] ${
          isScanning
            ? "bg-red-600 hover:bg-red-700 text-white border border-red-500"
            : "bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-300"
        }`}
      >
        <span className="skew-x-[10deg] flex items-center gap-2">
          {isScanning ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Detener
            </>
          ) : (
            <>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Iniciar Copilot
            </>
          )}
        </span>
      </button>

      {/* Search Beyond Toggle (Active when scanning) */}
      {isScanning && (
        <button
          onClick={onToggleSearchBeyond}
          className={`w-full md:w-auto px-6 py-4 rounded-sm font-bold border shadow-lg skew-x-[-10deg] transition-all
            ${isSearchBeyondActive 
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                : "bg-gray-900 text-gray-500 border-gray-700 hover:border-gray-500"
            }
            active:scale-95
          `}
        >
          <div className="skew-x-[10deg] flex items-center justify-center gap-2 text-sm uppercase">
             {/* Radar Icon */}
             <div className={`relative flex items-center justify-center w-6 h-6 rounded-full border ${isSearchBeyondActive ? 'border-yellow-500' : 'border-gray-600'}`}>
                <div className={`w-1 h-1 rounded-full ${isSearchBeyondActive ? 'bg-yellow-500 animate-ping' : 'bg-gray-600'}`}></div>
             </div>
             
             <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold">Modo Explorador</span>
                <span className="text-xs">{isSearchBeyondActive ? "ACTIVADO (50KM)" : "DESACTIVADO"}</span>
             </div>
          </div>
        </button>
      )}
    </div>
  );
};