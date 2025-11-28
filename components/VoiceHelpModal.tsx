import React from 'react';

interface VoiceHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceHelpModal: React.FC<VoiceHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const commands = [
    { cmd: "Copiloto / Iniciar", desc: "Activa el escaneo de ruta" },
    { cmd: "Parar / Detener", desc: "Detiene el escaneo" },
    { cmd: "Tráfico", desc: "Fuerza un análisis de tráfico inmediato" },
    { cmd: "HUD / Pantalla", desc: "Activa el modo HUD (Espejo) para el parabrisas" },
    { cmd: "Emergencia / Ayuda", desc: "Busca hospitales o policía cercanos inmediatamente" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 bg-black/50 flex justify-between items-center">
          <h3 className="text-white font-bold uppercase tracking-widest text-sm">Comandos de Voz</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-3">
          {commands.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-gray-800 pb-2 last:border-0">
               <span className="text-yellow-500 font-mono text-sm font-bold">"{item.cmd}"</span>
               <span className="text-gray-400 text-xs text-right">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="p-3 bg-black/30 text-center">
           <p className="text-[10px] text-gray-600">Di estos comandos claramente cuando el micrófono esté activo.</p>
        </div>
      </div>
    </div>
  );
};