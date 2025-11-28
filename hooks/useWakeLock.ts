
import { useEffect, useState } from 'react';

export const useWakeLock = (active: boolean) => {
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          setIsLocked(true);
          
          wakeLock.addEventListener('release', () => {
            setIsLocked(false);
          });
        } else {
          setError("Wake Lock not supported");
        }
      } catch (err: any) {
        setError(err.name + ": " + err.message);
        setIsLocked(false);
      }
    };

    if (active) {
      requestWakeLock();
    } else {
      if (wakeLock) {
        wakeLock.release().catch(e => console.error(e));
        wakeLock = null;
      }
    }

    // Re-acquire on visibility change (tab switch return)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [active]);

  return { isLocked, error };
};
