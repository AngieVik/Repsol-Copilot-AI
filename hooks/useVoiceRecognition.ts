
import { useState, useEffect, useCallback } from 'react';

// Define types for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const useVoiceRecognition = (
  onCommand: (command: string) => void,
  isActive: boolean
) => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const Recognition = SpeechRecognition || webkitSpeechRecognition;

    if (!Recognition) {
      setError("Reconocimiento de voz no soportado");
      return;
    }

    if (!isActive) {
      setIsListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      // Auto-restart if it stops while active
      if (isActive) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Error", event.error);
      if (event.error === 'not-allowed') {
        setError("Permiso de micrófono denegado");
      }
    };

    recognition.onresult = (event: any) => {
      const resultIndex = event.results.length - 1;
      const transcript = event.results[resultIndex][0].transcript.trim().toLowerCase();
      setLastTranscript(transcript);
      console.log("Voice Input:", transcript);
      
      onCommand(transcript);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      recognition.stop();
    };
  }, [isActive, onCommand]);

  return { isListening, lastTranscript, error };
};
