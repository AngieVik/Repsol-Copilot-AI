import React from 'react';
import { SearchPreferences, GasStationBrand } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefs: SearchPreferences;
  onUpdatePrefs: (newPrefs: SearchPreferences) => void;
  apiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  prefs, 
  onUpdatePrefs,
  apiKey,
  onUpdateApiKey
}) => {
  if (!isOpen) return null;

  const togglePref = (key: keyof SearchPreferences) => {
    // @ts-ignore
    onUpdatePrefs({ ...prefs, [key]: !prefs[key] });
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdatePrefs({ ...prefs, gasStationBrand: e.target.value as GasStationBrand });
  };

  const handleSliderChange = (key: 'trafficIntervalMinutes' | 'weatherIntervalMinutes', val: string) => {
    onUpdatePrefs({ ...prefs, [key]: parseInt(val) });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
          <h2 className="text-white text-lg font-bold uppercase tracking-widest silver-text">Configuración</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">

           {/* API KEY SECTION */}
           <div className="bg-black/40 p-4 rounded border border-gray-700">
             <label className="block text-[10px] text-yellow-500 font-bold uppercase tracking-wide mb-2">Gemini API Key</label>
             <input 
               type="password" 
               value={apiKey}
               onChange={(e) => onUpdateApiKey(e.target.value)}
               placeholder="Pegar API Key aquí (opcional si ya está en env)"
               className="w-full bg-black border border-gray-600 text-white text-sm rounded px-3 py-2 focus:ring-1 focus:ring-yellow-500 outline-none font-mono"
             />
             <p className="text-[10px] text-gray-500 mt-2">
               Si dejas esto vacío, la app intentará usar la variable de entorno del servidor.
             </p>
           </div>
          
          {/* Filtering Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] text-yellow-500 font-bold uppercase tracking-wide mb-1">Marca Principal</label>
                  <div className="relative">
                    <select 
                      value={prefs.gasStationBrand}
                      onChange={handleBrandChange}
                      className="w-full bg-black border border-gray-600 text-gray-200 text-sm rounded-md px-3 py-2 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none appearance-none font-mono"
                    >
                      <option value="repsol">REPSOL</option>
                      <option value="moeve">MOEVE (CEPSA)</option>
                      <option value="bp">BP</option>
                      <option value="galp">GALP</option>
                      <option value="shell">SHELL</option>
                      <option value="all">TODAS LAS MARCAS</option>
                    </select>
                  </div>
               </div>

               <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between cursor-pointer group p-2 bg-gray-800/50 rounded border border-transparent hover:border-gray-600 transition-colors">
                    <span className={`text-xs font-bold uppercase ${prefs.filterRest ? 'text-white' : 'text-gray-500'}`}>Descanso / Restauración</span>
                    <input type="checkbox" checked={prefs.filterRest} onChange={() => togglePref('filterRest')} 
                      className="w-4 h-4 bg-black border-gray-500 rounded text-yellow-500 focus:ring-0" />
                  </label>
               </div>
            </div>

            {/* Monitoring Section */}
            <div className="space-y-5">
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${prefs.monitorTraffic ? 'text-yellow-500' : 'text-gray-600'}`}>Monitoreo Tráfico</span>
                     <button 
                      onClick={() => togglePref('monitorTraffic')}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${prefs.monitorTraffic ? 'bg-yellow-600' : 'bg-gray-700'}`}
                    >
                      <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${prefs.monitorTraffic ? 'translate-x-4' : ''}`}></div>
                    </button>
                  </div>
                  <input 
                    type="range" min="10" max="60" step="5" 
                    value={prefs.trafficIntervalMinutes} 
                    onChange={(e) => handleSliderChange('trafficIntervalMinutes', e.target.value)}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-1"
                  />
                  <div className="text-[10px] text-gray-500 text-right">Intervalo: {prefs.trafficIntervalMinutes} min</div>
               </div>

               <div>
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-[10px] font-bold uppercase tracking-widest ${prefs.monitorWeather ? 'text-blue-400' : 'text-gray-600'}`}>Monitoreo Clima</span>
                     <button 
                      onClick={() => togglePref('monitorWeather')}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${prefs.monitorWeather ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                      <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${prefs.monitorWeather ? 'translate-x-4' : ''}`}></div>
                    </button>
                  </div>
                   <input 
                    type="range" min="10" max="120" step="10" 
                    value={prefs.weatherIntervalMinutes} 
                    onChange={(e) => handleSliderChange('weatherIntervalMinutes', e.target.value)}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-1"
                   />
                   <div className="text-[10px] text-gray-500 text-right">Intervalo: {prefs.weatherIntervalMinutes} min</div>
               </div>
            </div>
          </div>

        </div>

        <div className="p-4 bg-black/50 border-t border-gray-800 text-center">
            <button onClick={onClose} className="px-6 py-2 bg-yellow-500 text-black font-bold text-sm uppercase rounded hover:bg-yellow-400">
                Guardar y Cerrar
            </button>
        </div>

      </div>
    </div>
  );
};