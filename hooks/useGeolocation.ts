
import { useState, useEffect, useRef, useCallback } from 'react';
import { GeoCoordinates } from '../types';

export const useGeolocation = (active: boolean) => {
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está soportada en este navegador.");
      return;
    }

    // Clear existing watch if any
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed, // m/s
          heading: position.coords.heading,
        });
        setError(null);
      },
      (err) => {
        setError(`Error GPS: ${err.message}. Asegúrate de permitir el acceso.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000, 
      }
    );
  }, []);

  // Manual refresh function
  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    
    // Attempt to get current position immediately
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
        });
        setError(null);
        // Restart the watch to ensure continuity
        startWatching();
      },
      (err) => {
        setError(`Error al sincronizar: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [startWatching]);

  useEffect(() => {
    if (active) {
      startWatching();
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [active, startWatching]);

  return { location, error, refreshLocation };
};
