
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { useWakeLock } from './hooks/useWakeLock';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { analyzeRouteContext } from './services/geminiService';
import { ScanResult, ScanStatus, SearchPreferences, GeoCoordinates } from './types';
import { Dashboard } from './components/Dashboard';
import { Controls } from './components/Controls';
import { SettingsModal } from './components/SettingsModal';
import { VoiceHelpModal } from './components/VoiceHelpModal';

const App: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  
  // API Key State (Env OR Local Storage)
 // App.tsx CORREGIDO:
const [apiKey, setApiKey] = useState<string>(() => {
  // Solo busca en local storage o inicia vacío para que el usuario la ponga
  return localStorage.getItem('gemini_api_key') || '';

  });

  const handleUpdateApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };
  
  // Toggle State for Extended Search Mode
  const [isSearchBeyondActive, setIsSearchBeyondActive] = useState(false);

  // New Preferences State with Destination Persistence
  const [prefs, setPrefs] = useState<SearchPreferences>(() => {
    const savedDestination = localStorage.getItem('copilot_destination') || '';
    return {
      destination: savedDestination,
      gasStationBrand: 'repsol',
      filterRest: false,
      isHudMode: false,
      monitorTraffic: true,
      trafficIntervalMinutes: 20,
      monitorWeather: true,
      weatherIntervalMinutes: 60
    };
  });

  // Save destination whenever it changes
  const handleUpdateDestination = (newDest: string) => {
    setPrefs(prev => ({ ...prev, destination: newDest }));
    localStorage.setItem('copilot_destination', newDest);
  };

  const { location, error: geoError, refreshLocation } = useGeolocation(true); // Always active
  const { isLocked } = useWakeLock(isScanning); 
  
  // Refs to access latest state inside async loops
  const locationRef = useRef<GeoCoordinates | null>(null);
  const prefsRef = useRef<SearchPreferences>(prefs);
  const lastTrafficScanRef = useRef<number>(0);
  const lastWeatherScanRef = useRef<number>(0);
  const lastSpokenStationRef = useRef<string | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSearchBeyondRef = useRef<boolean>(isSearchBeyondActive);
  const apiKeyRef = useRef<string>(apiKey);
  
  // Sync refs
  useEffect(() => { locationRef.current = location; }, [location]);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);
  useEffect(() => { isSearchBeyondRef.current = isSearchBeyondActive; }, [isSearchBeyondActive]);
  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);

  // Voice Command Handler
  const handleVoiceCommand = useCallback((command: string) => {
    if (command.includes('copiloto') || command.includes('iniciar')) {
      if (!isScanning) handleToggleScan();
    } else if (command.includes('parar') || command.includes('detener')) {
      if (isScanning) handleToggleScan();
    } else if (command.includes('tráfico')) {
      lastTrafficScanRef.current = 0; // Force traffic scan next loop
    } else if (command.includes('hud') || command.includes('pantalla')) {
      handleToggleHud();
    } else if (command.includes('ayuda') || command.includes('emergencia')) {
       triggerEmergencyMode();
    }
  }, [isScanning]);

  const { isListening, lastTranscript } = useVoiceRecognition(handleVoiceCommand, voiceActive);

  // Text to Speech
  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    // Cancel previous
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.1;
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleScan = () => {
    if (isScanning) {
      setIsScanning(false);
      setScanStatus(ScanStatus.IDLE);
      window.speechSynthesis.cancel();
    } else {
      setIsScanning(true);
      setScanStatus(ScanStatus.SCANNING);
      runScanLoop();
      speak("Copiloto activado. Monitoreando ruta.");
    }
  };

  const handleToggleSearchBeyond = () => {
    setIsSearchBeyondActive(prev => !prev);
    // Visual feedback handled by state, logic handled by ref in next loop
  };

  const handleToggleHud = () => {
    setPrefs(p => ({...p, isHudMode: !p.isHudMode}));
  };

  const triggerEmergencyMode = async () => {
    if (!locationRef.current) return;
    setScanStatus(ScanStatus.EMERGENCY);
    speak("Modo emergencia activado. Buscando ayuda médica o policial cercana.");
    
    const emergencyResult = await analyzeRouteContext(
      apiKeyRef.current,
      locationRef.current, 
      prefsRef.current, 
      false, 
      false, 
      false, 
      true
    );
    
    setResult(emergencyResult);
    if (emergencyResult.nearestStation) {
      speak(`Emergencia. Dirígete a ${emergencyResult.nearestStation.name}. Distancia ${emergencyResult.nearestStation.distance}.`);
    }
  };

  // Main Logic Loop
  const runScanLoop = async () => {
    if (!locationRef.current) {
      // Wait for GPS
      setTimeout(() => {
        if (isScanning) runScanLoop(); // Retry
      }, 2000);
      return;
    }

    try {
      const now = Date.now();
      
      // Check intervals
      const shouldScanTraffic = prefsRef.current.monitorTraffic && 
        (now - lastTrafficScanRef.current > prefsRef.current.trafficIntervalMinutes * 60 * 1000);
      
      const shouldScanWeather = prefsRef.current.monitorWeather && 
        (now - lastWeatherScanRef.current > prefsRef.current.weatherIntervalMinutes * 60 * 1000);

      // Status Update
      if (isSearchBeyondRef.current) setScanStatus(ScanStatus.SCANNING_BEYOND);
      else setScanStatus(ScanStatus.SCANNING);

      // --- AI CALL ---
      const scanResult = await analyzeRouteContext(
        apiKeyRef.current,
        locationRef.current,
        prefsRef.current,
        isSearchBeyondRef.current,
        shouldScanTraffic,
        shouldScanWeather
      );
      
      setResult(scanResult);

      // --- ALERTS & TTS LOGIC ---
      if (scanResult.alertTriggered) {
         // Prevent repeating the same station immediately
         if (lastSpokenStationRef.current !== scanResult.nearestStation.name) {
           speak(`Atención. ${scanResult.nearestStation.name} a ${scanResult.nearestStation.distance}.`);
           lastSpokenStationRef.current = scanResult.nearestStation.name;
           
           // If traffic/weather changed significantly, announce it
           if (shouldScanTraffic && scanResult.traffic.status !== 'Fluido') {
             speak(`Tráfico ${scanResult.traffic.status}. ${scanResult.traffic.summary}`);
           }
         }
      }

      // Update Timestamps
      if (shouldScanTraffic) lastTrafficScanRef.current = now;
      if (shouldScanWeather) lastWeatherScanRef.current = now;

    } catch (e) {
      console.error("Scan loop error", e);
    }

    // Schedule next loop
    // Dynamic interval: If moving fast, scan often. If alert triggered, scan often.
    let nextInterval = 45000; // 45s default
    if (result?.alertTriggered) nextInterval = 30000; 
    if (isSearchBeyondRef.current) nextInterval = 20000; // Faster update in search mode

    setTimeout(() => {
       // Check if still scanning using the functional state updater or ref logic isn't strictly needed here 
       // because we check isScanning state at start of function if we recurse, 
       // BUT we need to break the loop if component unmounted or stopped.
       // Since `runScanLoop` is async and closes over state, we need a ref to check 'active' status if we want to stop strictly.
       // However, the simple `if (isScanning)` check inside the timeout callback is better.
       setIsScanning(currentScanning => {
         if (currentScanning) runScanLoop();
         return currentScanning;
       });
    }, nextInterval);
  };
  
  const handleForceSync = () => {
      speak("Sincronizando GPS.");
      refreshLocation(); // Call the explicit refresh
      if(isScanning) {
          // Reset timers to force full scan
          lastTrafficScanRef.current = 0;
          lastWeatherScanRef.current = 0;
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-center p-4 border-b border-gray-800 bg-black/80 backdrop-blur-sm fixed top-0 w-full z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded-bl-xl rounded-tr-xl flex items-center justify-center">
            <span className="text-black font-black text-xl">R</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter leading-none">REPSOL <span className="text-yellow-500">COPILOT</span></h1>
            <div className="text-[9px] text-gray-500 uppercase tracking-widest">AI Route Assistant</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Help Button */}
          <button 
             onClick={() => setShowVoiceHelp(true)}
             className="w-8 h-8 rounded-full border border-gray-700 text-gray-400 flex items-center justify-center text-sm font-bold hover:text-white hover:border-gray-500"
             title="Comandos de Voz"
          >
            ?
          </button>

          {/* Mic Button */}
          <button 
            onClick={() => setVoiceActive(!voiceActive)}
            className={`p-2 rounded-full border ${voiceActive ? 'border-red-500 text-red-500 animate-pulse' : 'border-gray-700 text-gray-500'}`}
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-24 px-4 pb-32 max-w-lg mx-auto md:max-w-3xl">
         {geoError ? (
           <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-4 text-center">
             <p className="font-bold">⚠️ Error de GPS</p>
             <p className="text-sm">{geoError}</p>
             <p className="text-xs mt-2">Asegúrate de permitir el acceso a la ubicación en tu navegador.</p>
           </div>
         ) : (
           <Dashboard 
             scanResult={result}
             location={location}
             statusMessage={isScanning ? (isSearchBeyondActive ? "RADAR AMPLIADO" : "EN RUTA") : "EN ESPERA"}
             prefs={prefs}
             onUpdateDestination={handleUpdateDestination}
             isLocked={isLocked}
             isScanning={isScanning}
             onToggleHud={handleToggleHud}
             onForceSync={handleForceSync}
           />
         )}
      </main>

      {/* --- CONTROLS --- */}
      <Controls 
        isScanning={isScanning} 
        onToggle={handleToggleScan} 
        onToggleSearchBeyond={handleToggleSearchBeyond}
        isSearchBeyondActive={isSearchBeyondActive}
        isLoading={false}
      />

      {/* --- MODALS --- */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        prefs={prefs} 
        onUpdatePrefs={setPrefs}
        apiKey={apiKey}
        onUpdateApiKey={handleUpdateApiKey}
      />
      
      <VoiceHelpModal 
        isOpen={showVoiceHelp}
        onClose={() => setShowVoiceHelp(false)}
      />

    </div>
  );
};

export default App;
